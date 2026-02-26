export interface Board {
  id: string;
  scope_type: 'app' | 'project' | 'personal';
  scope_ref: string | null;
  title: string;
  description: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  columns?: Column[];
  labels?: Label[];
  member_count?: number;
  card_count?: number;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  color: string | null;
  wip_limit: number | null;
  cards?: Card[];
}

export interface Card {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  due_date: string | null;
  created_by: string;
  assignee_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  labels?: Label[];
  assignee?: UserSummary;
  creator?: UserSummary;
  checklist_progress?: { total: number; checked: number };
  comment_count?: number;
  attachment_count?: number;
  // Full card detail fields (from GET /cards/:id)
  checklists?: Checklist[];
  comments?: Comment[];
  attachments?: Attachment[];
  activity?: CardActivity[];
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export interface Checklist {
  id: string;
  card_id: string;
  title: string;
  position: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  is_checked: boolean;
  position: number;
  assignee_id: string | null;
  assignee?: UserSummary;
}

export interface Comment {
  id: string;
  card_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: UserSummary;
}

export interface Attachment {
  id: string;
  card_id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
  uploader?: UserSummary;
}

export interface BoardMember {
  board_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
  user?: UserSummary;
}

export interface CardActivity {
  id: string;
  card_id: string;
  actor_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor?: UserSummary;
}

export interface UserSummary {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ScopeType = 'app' | 'project' | 'personal';
