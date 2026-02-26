-- 001_kanban_schema.sql
-- MC-Kanban database schema

CREATE SCHEMA IF NOT EXISTS kanban;

-- Boards
CREATE TABLE kanban.boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type  TEXT NOT NULL CHECK (scope_type IN ('app', 'project', 'personal')),
  scope_ref   TEXT,
  title       TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_boards_app_scope
  ON kanban.boards (scope_type, scope_ref)
  WHERE scope_type = 'app';

CREATE UNIQUE INDEX idx_boards_project_scope
  ON kanban.boards (scope_type, scope_ref)
  WHERE scope_type = 'project';

CREATE INDEX idx_boards_created_by ON kanban.boards (created_by);

-- Columns
CREATE TABLE kanban.columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES kanban.boards(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  color       TEXT,
  wip_limit   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_columns_board ON kanban.columns (board_id, position);

-- Cards
CREATE TABLE kanban.cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   UUID NOT NULL REFERENCES kanban.columns(id) ON DELETE CASCADE,
  board_id    UUID NOT NULL REFERENCES kanban.boards(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL,
  priority    TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date    DATE,
  created_by  UUID NOT NULL,
  assignee_id UUID,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_column ON kanban.cards (column_id, position);
CREATE INDEX idx_cards_board ON kanban.cards (board_id);
CREATE INDEX idx_cards_assignee ON kanban.cards (assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_cards_due_date ON kanban.cards (due_date) WHERE due_date IS NOT NULL;

-- Labels
CREATE TABLE kanban.labels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES kanban.boards(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  UNIQUE (board_id, name)
);

CREATE TABLE kanban.card_labels (
  card_id     UUID NOT NULL REFERENCES kanban.cards(id) ON DELETE CASCADE,
  label_id    UUID NOT NULL REFERENCES kanban.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Checklists
CREATE TABLE kanban.checklists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES kanban.cards(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kanban.checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES kanban.checklists(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  is_checked    BOOLEAN NOT NULL DEFAULT FALSE,
  position      INTEGER NOT NULL,
  assignee_id   UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE kanban.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES kanban.cards(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_card ON kanban.comments (card_id, created_at DESC);

-- Attachments
CREATE TABLE kanban.attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       UUID NOT NULL REFERENCES kanban.cards(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_size     INTEGER,
  mime_type     TEXT,
  storage_path  TEXT NOT NULL,
  uploaded_by   UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_card ON kanban.attachments (card_id);

-- Board members (sharing)
CREATE TABLE kanban.board_members (
  board_id    UUID NOT NULL REFERENCES kanban.boards(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  added_by    UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

CREATE INDEX idx_board_members_user ON kanban.board_members (user_id);

-- Activity log
CREATE TABLE kanban.card_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES kanban.cards(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL,
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_activity_card ON kanban.card_activity (card_id, created_at DESC);
