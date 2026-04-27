import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { dbQuery } from '../services/supabase.js';
import { uploadFile, deleteFile, getSignedUrl } from '../services/storage.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { logActivity } from '../services/activity.js';
import { checkBoardAccess } from '../middleware/board-access.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// ─── Helper: look up board via card → column → board ─────────────────────────

interface BoardAccessTarget {
  id: string;
  scope_type: string;
  scope_ref: string | null;
  created_by: string;
}

async function getBoardForCard(cardId: string): Promise<BoardAccessTarget | null> {
  const { rows } = await dbQuery(
    `SELECT b.id, b.scope_type, b.scope_ref, b.created_by FROM cards c
     JOIN columns col ON col.id = c.column_id
     JOIN boards b ON b.id = col.board_id
     WHERE c.id = $1`,
    [cardId],
  );
  return rows[0] ?? null;
}

async function requireAccessToBoard(
  req: Request,
  res: Response,
  board: BoardAccessTarget,
): Promise<boolean> {
  const hasAccess = await checkBoardAccess(req.user!.id, req.user!.email || '', board);
  if (!hasAccess) {
    res.status(403).json({ error: { message: 'Access denied' } });
    return false;
  }
  return true;
}

async function getAttachmentWithBoard(attachmentId: string) {
  const { rows } = await dbQuery(
    `SELECT a.*,
            b.id AS board_id,
            b.scope_type AS board_scope_type,
            b.scope_ref AS board_scope_ref,
            b.created_by AS board_created_by
     FROM attachments a
     JOIN cards c ON c.id = a.card_id
     JOIN boards b ON b.id = c.board_id
     WHERE a.id = $1`,
    [attachmentId],
  );
  return rows[0] ?? null;
}

function boardFromAttachment(attachment: any): BoardAccessTarget {
  return {
    id: attachment.board_id,
    scope_type: attachment.board_scope_type,
    scope_ref: attachment.board_scope_ref,
    created_by: attachment.board_created_by,
  };
}

// ─── GET /cards/:cardId/attachments ──────────────────────────────────────────

router.get('/cards/:cardId/attachments', async (req, res) => {
  try {
    const cardId = req.params.cardId;

    const board = await getBoardForCard(cardId);
    if (!board) return sendNotFound(res, 'Card');
    if (!(await requireAccessToBoard(req, res, board))) return;

    const { rows: attachments } = await dbQuery(
      'SELECT * FROM attachments WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId],
    );

    // Generate signed download URLs
    const enriched = await Promise.all(
      attachments.map(async (a: any) => {
        let download_url: string | null = null;
        try {
          download_url = await getSignedUrl(a.storage_path);
        } catch {
          // Storage may not be configured — leave URL null
        }
        return { ...a, download_url };
      }),
    );

    res.json(enriched);
  } catch (err) {
    sendServerError(res, err, 'GET /cards/:cardId/attachments');
  }
});

// ─── POST /cards/:cardId/attachments ─────────────────────────────────────────

router.post('/cards/:cardId/attachments', upload.single('file'), async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    // Verify board access
    const board = await getBoardForCard(cardId);
    if (!board) return sendNotFound(res, 'Card');
    if (!(await requireAccessToBoard(req, res, board))) return;

    // Generate unique storage path
    const uuid = crypto.randomUUID();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `cards/${cardId}/${uuid}-${safeFilename}`;

    // Upload to Supabase Storage
    await uploadFile(storagePath, file.buffer, file.mimetype);

    // Create DB record
    const { rows } = await dbQuery(
      `INSERT INTO attachments (card_id, file_name, file_size, mime_type, storage_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cardId, file.originalname, file.size, file.mimetype, storagePath, userId],
    );

    // Log activity
    await logActivity(cardId, userId, 'attachment_added', {
      file_name: file.originalname,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    sendServerError(res, err, 'POST /cards/:cardId/attachments');
  }
});

// ─── GET /attachments/:id/download ──────────────────────────────────────────

router.get('/attachments/:id/download', async (req, res) => {
  try {
    const attachment = await getAttachmentWithBoard(req.params.id);
    if (!attachment) return sendNotFound(res, 'Attachment');
    if (!(await requireAccessToBoard(req, res, boardFromAttachment(attachment)))) return;

    const downloadUrl = await getSignedUrl(attachment.storage_path);
    res.redirect(downloadUrl);
  } catch (err) {
    sendServerError(res, err, 'GET /attachments/:id/download');
  }
});

// ─── DELETE /attachments/:id ─────────────────────────────────────────────────

router.delete('/attachments/:id', async (req, res) => {
  try {
    const attachmentId = req.params.id;
    const userId = req.user!.id;

    const attachment = await getAttachmentWithBoard(attachmentId);
    if (!attachment) return sendNotFound(res, 'Attachment');

    if (!(await requireAccessToBoard(req, res, boardFromAttachment(attachment)))) return;

    // Only the uploader can delete
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({
        error: { message: 'Only the uploader can delete this attachment' },
      });
    }

    // Delete from storage
    try {
      await deleteFile(attachment.storage_path);
    } catch {
      // If storage delete fails, still remove DB record
    }

    // Delete DB record
    await dbQuery('DELETE FROM attachments WHERE id = $1', [attachmentId]);

    // Log activity
    await logActivity(attachment.card_id, userId, 'attachment_removed', {
      file_name: attachment.file_name,
    });

    res.status(204).send();
  } catch (err) {
    sendServerError(res, err, 'DELETE /attachments/:id');
  }
});

export default router;
