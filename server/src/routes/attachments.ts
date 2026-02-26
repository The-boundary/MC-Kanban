import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { dbQuery } from '../services/supabase.js';
import { uploadFile, deleteFile, getSignedUrl } from '../services/storage.js';
import { sendServerError, sendNotFound } from '../utils/route-helpers.js';
import { logActivity } from '../services/activity.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// ─── Helper: look up board via card → column → board ─────────────────────────

async function getBoardIdForCard(cardId: string): Promise<string | null> {
  const { rows } = await dbQuery(
    `SELECT b.id FROM cards c
     JOIN columns col ON col.id = c.column_id
     JOIN boards b ON b.id = col.board_id
     WHERE c.id = $1`,
    [cardId],
  );
  return rows[0]?.id ?? null;
}

// ─── GET /cards/:cardId/attachments ──────────────────────────────────────────

router.get('/cards/:cardId/attachments', async (req, res) => {
  try {
    const cardId = req.params.cardId;

    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

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

    // Verify card exists
    const { rows: cardCheck } = await dbQuery('SELECT id FROM cards WHERE id = $1', [cardId]);
    if (cardCheck.length === 0) return sendNotFound(res, 'Card');

    // Verify board access
    const boardId = await getBoardIdForCard(cardId);
    if (!boardId) return sendNotFound(res, 'Board');

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

// ─── DELETE /attachments/:id ─────────────────────────────────────────────────

router.delete('/attachments/:id', async (req, res) => {
  try {
    const attachmentId = req.params.id;
    const userId = req.user!.id;

    const { rows } = await dbQuery(
      'SELECT * FROM attachments WHERE id = $1',
      [attachmentId],
    );
    if (rows.length === 0) return sendNotFound(res, 'Attachment');

    const attachment = rows[0];

    // Only the uploader can delete
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({ error: { message: 'Only the uploader can delete this attachment' } });
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
