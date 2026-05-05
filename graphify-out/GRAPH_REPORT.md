# Graph Report - /home/stan.b/Desktop/the-boundary/MC-Kanban  (2026-04-29)

## Corpus Check
- Corpus is ~27,085 words - fits in a single context window. You may not need a graph.

## Summary
- 312 nodes · 456 edges · 37 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_supabase.ts  route-helpers.ts|supabase.ts / route-helpers.ts]]
- [[_COMMUNITY_Sidebar  boards.ts|Sidebar / boards.ts]]
- [[_COMMUNITY_cache.ts  logger.ts|cache.ts / logger.ts]]
- [[_COMMUNITY_auth.ts  auth.ts|auth.ts / auth.ts]]
- [[_COMMUNITY_auth.ts  auth.ts|auth.ts / auth.ts]]
- [[_COMMUNITY_useAuth  AuthContext.tsx|useAuth / AuthContext.tsx]]
- [[_COMMUNITY_cards.ts  cards.ts|cards.ts / cards.ts]]
- [[_COMMUNITY_CLAUDE.md  Auth|CLAUDE.md / Auth]]
- [[_COMMUNITY_columns.ts  columns.ts|columns.ts / columns.ts]]
- [[_COMMUNITY_fetchApi  fetchApi.ts|fetchApi / fetchApi.ts]]
- [[_COMMUNITY_labels.ts  labels.ts|labels.ts / labels.ts]]
- [[_COMMUNITY_checklists.ts  checklists.ts|checklists.ts / checklists.ts]]
- [[_COMMUNITY_CardChecklist.tsx  CardChecklist.tsx|CardChecklist.tsx / CardChecklist.tsx]]
- [[_COMMUNITY_comments.ts  comments.ts|comments.ts / comments.ts]]
- [[_COMMUNITY_ErrorBoundary.tsx  ErrorBoundary.tsx|ErrorBoundary.tsx / ErrorBoundary.tsx]]
- [[_COMMUNITY_handleKeyDown  handleCancel|handleKeyDown / handleCancel]]
- [[_COMMUNITY_CardLabels.tsx  CardLabels.tsx|CardLabels.tsx / CardLabels.tsx]]
- [[_COMMUNITY_attachments.ts  attachments.ts|attachments.ts / attachments.ts]]
- [[_COMMUNITY_App.tsx  App.tsx|App.tsx / App.tsx]]
- [[_COMMUNITY_displayName  initial|displayName / initial]]
- [[_COMMUNITY_formatFileSize  handleUpload|formatFileSize / handleUpload]]
- [[_COMMUNITY_handleArchive  handleDelete|handleArchive / handleDelete]]
- [[_COMMUNITY_cn  handleTitleSave|cn / handleTitleSave]]
- [[_COMMUNITY_handleSave  handleSubmit|handleSave / handleSubmit]]
- [[_COMMUNITY_cn  utils.ts|cn / utils.ts]]
- [[_COMMUNITY_LabelBadge  LabelBadge.tsx|LabelBadge / LabelBadge.tsx]]
- [[_COMMUNITY_PriorityBadge  PriorityBadge.tsx|PriorityBadge / PriorityBadge.tsx]]
- [[_COMMUNITY_MarkdownRenderer  MarkdownRenderer.tsx|MarkdownRenderer / MarkdownRenderer.tsx]]
- [[_COMMUNITY_AppShell  AppShell.tsx|AppShell / AppShell.tsx]]
- [[_COMMUNITY_cn  ColumnHeader.tsx|cn / ColumnHeader.tsx]]
- [[_COMMUNITY_handleClick  CardItem.tsx|handleClick / CardItem.tsx]]
- [[_COMMUNITY_RecentBoards  RecentBoards.tsx|RecentBoards / RecentBoards.tsx]]
- [[_COMMUNITY_NotFoundPage  NotFoundPage.tsx|NotFoundPage / NotFoundPage.tsx]]
- [[_COMMUNITY_LoginPage  LoginPage.tsx|LoginPage / LoginPage.tsx]]
- [[_COMMUNITY_useBoardFilters  useBoardFilters.ts|useBoardFilters / useBoardFilters.ts]]
- [[_COMMUNITY_useUsers  users.ts|useUsers / users.ts]]
- [[_COMMUNITY_useActivity  activity.ts|useActivity / activity.ts]]

## God Nodes (most connected - your core abstractions)
1. `Sidebar()` - 7 edges
2. `getAuthSupabaseClient()` - 6 edges
3. `dbQuery()` - 6 edges
4. `requireAuth()` - 6 edges
5. `CLAUDE.md (MC-Kanban Project Context)` - 6 edges
6. `checkBoardAccess()` - 5 edges
7. `fetchApi()` - 5 edges
8. `useAuth()` - 5 edges
9. `requireEnv()` - 4 edges
10. `base64Url()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `client/index.html` --references--> `favicon.svg (browser tab icon)`  [INFERRED]
  /home/stan.b/Desktop/the-boundary/MC-Kanban/client/index.html → /home/stan.b/Desktop/the-boundary/MC-Kanban/client/public/favicon.svg
- `client/index.html` --references--> `logo-icon.svg (app icon mark)`  [INFERRED]
  /home/stan.b/Desktop/the-boundary/MC-Kanban/client/index.html → /home/stan.b/Desktop/the-boundary/MC-Kanban/client/public/logo-icon.svg
- `Sidebar()` --calls--> `useAuth()`  [INFERRED]
  client/src/components/layout/Sidebar.tsx → client/src/context/AuthContext.tsx
- `logo-dark.svg (dark theme branding)` --semantically_similar_to--> `logo-icon.svg (app icon mark)`  [INFERRED] [semantically similar]
  /home/stan.b/Desktop/the-boundary/MC-Kanban/client/public/logo-dark.svg → /home/stan.b/Desktop/the-boundary/MC-Kanban/client/public/logo-icon.svg
- `uploadFile()` --calls--> `getAuthSupabaseClient()`  [INFERRED]
  server/src/services/storage.ts → server/src/services/supabase.ts

## Communities

### Community 0 - "supabase.ts / route-helpers.ts"
Cohesion: 0.15
Nodes (13): checkBoardAccess(), requireBoardAccess(), boardFromAttachment(), getAttachmentWithBoard(), getBoardForCard(), requireAccessToBoard(), logActivity(), dbQuery() (+5 more)

### Community 1 - "Sidebar / boards.ts"
Cohesion: 0.11
Nodes (13): useApps(), useBoard(), useBoardByScope(), useBoards(), useCreateBoard(), useDeleteBoard(), useUpdateBoard(), useProjects() (+5 more)

### Community 3 - "cache.ts / logger.ts"
Cohesion: 0.23
Nodes (6): cacheMiddleware(), cacheSize(), getCacheKey(), invalidateCache(), errorHandler(), notFoundHandler()

### Community 4 - "auth.ts / auth.ts"
Cohesion: 0.34
Nodes (12): base64Url(), cookieDomain(), cookieOpts(), cookieSecure(), createPkce(), exchangeAuthCodeForSession(), fetchSupabaseUser(), getBaseUrl() (+4 more)

### Community 5 - "auth.ts / auth.ts"
Cohesion: 0.31
Nodes (9): ensureAppAccess(), extractToken(), isEmailDomainAllowed(), requireAuth(), verifySupabaseToken(), deleteFile(), getSignedUrl(), uploadFile() (+1 more)

### Community 6 - "useAuth / AuthContext.tsx"
Cohesion: 0.24
Nodes (6): NoAccessPage(), ProtectedRoute(), initAuth(), parseAccess(), parseUser(), useAuth()

### Community 7 - "cards.ts / cards.ts"
Cohesion: 0.26
Nodes (8): useCard(), useCreateCard(), useDeleteCard(), useMoveCard(), useMyCards(), useReorderCards(), useUpdateCard(), AddCard()

### Community 8 - "CLAUDE.md / Auth"
Cohesion: 0.22
Nodes (10): CLAUDE.md (MC-Kanban Project Context), Auth (Cookie-based SSO via GoTrue, TowerWatch), Database Schema: kanban, Deployment (kanban container, port 3049), graphify Knowledge Graph Rules, Tech Stack (React 19, Vite 5, Express, Supabase), client/index.html, favicon.svg (browser tab icon) (+2 more)

### Community 9 - "columns.ts / columns.ts"
Cohesion: 0.31
Nodes (5): useCreateColumn(), useDeleteColumn(), useReorderColumns(), useUpdateColumn(), AddColumn()

### Community 10 - "fetchApi / fetchApi.ts"
Cohesion: 0.54
Nodes (5): fetchApi(), hasBody(), HttpError, isJsonResponse(), parseErrorMessage()

### Community 11 - "labels.ts / labels.ts"
Cohesion: 0.43
Nodes (6): useAttachLabel(), useCreateLabel(), useDeleteLabel(), useDetachLabel(), useLabels(), useUpdateLabel()

### Community 12 - "checklists.ts / checklists.ts"
Cohesion: 0.43
Nodes (6): useCreateChecklist(), useCreateChecklistItem(), useDeleteChecklist(), useDeleteChecklistItem(), useUpdateChecklist(), useUpdateChecklistItem()

### Community 13 - "CardChecklist.tsx / CardChecklist.tsx"
Cohesion: 0.53
Nodes (4): handleAddItem(), handleCreateChecklist(), handleSave(), handleTitleSave()

### Community 14 - "comments.ts / comments.ts"
Cohesion: 0.53
Nodes (4): useComments(), useCreateComment(), useDeleteComment(), useUpdateComment()

### Community 15 - "ErrorBoundary.tsx / ErrorBoundary.tsx"
Cohesion: 0.6
Nodes (3): componentDidCatch(), constructor(), getDerivedStateFromError()

### Community 16 - "handleKeyDown / handleCancel"
Cohesion: 0.8
Nodes (3): handleCancel(), handleKeyDown(), handleSave()

### Community 17 - "CardLabels.tsx / CardLabels.tsx"
Cohesion: 0.6
Nodes (3): cn(), handleCreateLabel(), handleToggleLabel()

### Community 18 - "attachments.ts / attachments.ts"
Cohesion: 0.6
Nodes (3): useAttachments(), useDeleteAttachment(), useUploadAttachment()

### Community 19 - "App.tsx / App.tsx"
Cohesion: 0.67
Nodes (2): AppShellLayout(), RouteFallback()

### Community 20 - "displayName / initial"
Cohesion: 0.83
Nodes (2): displayName(), initial()

### Community 21 - "formatFileSize / handleUpload"
Cohesion: 0.67
Nodes (2): formatFileSize(), handleUpload()

### Community 22 - "handleArchive / handleDelete"
Cohesion: 0.67
Nodes (2): handleArchive(), handleDelete()

### Community 23 - "cn / handleTitleSave"
Cohesion: 0.67
Nodes (2): cn(), handleTitleSave()

### Community 24 - "handleSave / handleSubmit"
Cohesion: 0.67
Nodes (2): handleSave(), handleSubmit()

### Community 25 - "cn / utils.ts"
Cohesion: 0.67
Nodes (1): cn()

### Community 26 - "LabelBadge / LabelBadge.tsx"
Cohesion: 0.67
Nodes (1): LabelBadge()

### Community 27 - "PriorityBadge / PriorityBadge.tsx"
Cohesion: 0.67
Nodes (1): PriorityBadge()

### Community 28 - "MarkdownRenderer / MarkdownRenderer.tsx"
Cohesion: 0.67
Nodes (1): MarkdownRenderer()

### Community 29 - "AppShell / AppShell.tsx"
Cohesion: 0.67
Nodes (1): AppShell()

### Community 30 - "cn / ColumnHeader.tsx"
Cohesion: 0.67
Nodes (1): cn()

### Community 31 - "handleClick / CardItem.tsx"
Cohesion: 0.67
Nodes (1): handleClick()

### Community 32 - "RecentBoards / RecentBoards.tsx"
Cohesion: 0.67
Nodes (1): RecentBoards()

### Community 33 - "NotFoundPage / NotFoundPage.tsx"
Cohesion: 0.67
Nodes (1): NotFoundPage()

### Community 34 - "LoginPage / LoginPage.tsx"
Cohesion: 0.67
Nodes (1): LoginPage()

### Community 35 - "useBoardFilters / useBoardFilters.ts"
Cohesion: 0.67
Nodes (1): useBoardFilters()

### Community 36 - "useUsers / users.ts"
Cohesion: 0.67
Nodes (1): useUsers()

### Community 37 - "useActivity / activity.ts"
Cohesion: 0.67
Nodes (1): useActivity()

## Knowledge Gaps
- **3 isolated node(s):** `graphify Knowledge Graph Rules`, `favicon.svg (browser tab icon)`, `logo-dark.svg (dark theme branding)`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App.tsx / App.tsx`** (4 nodes): `App.tsx`, `App.tsx`, `AppShellLayout()`, `RouteFallback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `displayName / initial`** (4 nodes): `UserPicker.tsx`, `UserPicker.tsx`, `displayName()`, `initial()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `formatFileSize / handleUpload`** (4 nodes): `formatFileSize()`, `handleUpload()`, `CardAttachments.tsx`, `CardAttachments.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `handleArchive / handleDelete`** (4 nodes): `handleArchive()`, `handleDelete()`, `CardSidebar.tsx`, `CardSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cn / handleTitleSave`** (4 nodes): `cn()`, `handleTitleSave()`, `CardDetail.tsx`, `CardDetail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `handleSave / handleSubmit`** (4 nodes): `handleSave()`, `handleSubmit()`, `CardComments.tsx`, `CardComments.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cn / utils.ts`** (3 nodes): `utils.ts`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LabelBadge / LabelBadge.tsx`** (3 nodes): `LabelBadge.tsx`, `LabelBadge.tsx`, `LabelBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PriorityBadge / PriorityBadge.tsx`** (3 nodes): `PriorityBadge.tsx`, `PriorityBadge.tsx`, `PriorityBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MarkdownRenderer / MarkdownRenderer.tsx`** (3 nodes): `MarkdownRenderer.tsx`, `MarkdownRenderer.tsx`, `MarkdownRenderer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AppShell / AppShell.tsx`** (3 nodes): `AppShell.tsx`, `AppShell.tsx`, `AppShell()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cn / ColumnHeader.tsx`** (3 nodes): `cn()`, `ColumnHeader.tsx`, `ColumnHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `handleClick / CardItem.tsx`** (3 nodes): `handleClick()`, `CardItem.tsx`, `CardItem.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RecentBoards / RecentBoards.tsx`** (3 nodes): `RecentBoards.tsx`, `RecentBoards()`, `RecentBoards.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `NotFoundPage / NotFoundPage.tsx`** (3 nodes): `NotFoundPage.tsx`, `NotFoundPage.tsx`, `NotFoundPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LoginPage / LoginPage.tsx`** (3 nodes): `LoginPage()`, `LoginPage.tsx`, `LoginPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useBoardFilters / useBoardFilters.ts`** (3 nodes): `useBoardFilters.ts`, `useBoardFilters.ts`, `useBoardFilters()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useUsers / users.ts`** (3 nodes): `useUsers()`, `users.ts`, `users.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `useActivity / activity.ts`** (3 nodes): `useActivity()`, `activity.ts`, `activity.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sidebar()` connect `Sidebar / boards.ts` to `useAuth / AuthContext.tsx`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth / AuthContext.tsx` to `Sidebar / boards.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `getAuthSupabaseClient()` connect `auth.ts / auth.ts` to `supabase.ts / route-helpers.ts`, `supabase.ts / route-helpers.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Sidebar()` (e.g. with `useAuth()` and `useApps()`) actually correct?**
  _`Sidebar()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getAuthSupabaseClient()` (e.g. with `uploadFile()` and `deleteFile()`) actually correct?**
  _`getAuthSupabaseClient()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `dbQuery()` (e.g. with `logActivity()` and `getBoardForCard()`) actually correct?**
  _`dbQuery()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `graphify Knowledge Graph Rules`, `favicon.svg (browser tab icon)`, `logo-dark.svg (dark theme branding)` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._