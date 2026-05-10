# CRITICAL Backend Fix: Resolve 403 Forbidden for Kanban Statuses

**Problem:** Standard workspace members are currently receiving a `403 Forbidden` error when trying to Create, Update, or Delete Kanban columns (Statuses). The console shows `POST http://localhost:5000/api/v1/statuses 403 (Forbidden)`.

This is happening because the backend controllers are strictly enforcing an `admin/owner` role check for all status-related operations.

---

### 1. Fix Status Controller (`src/controllers/status.controller.ts`)

Please update the following three functions to allow **any member** of the workspace to perform the action.

**Functions to Update:**
- `createStatus`
- `updateStatus`
- `deleteStatus`

**Required Change:**
Look for the authorization block that looks like this:
```typescript
if (!membership || !["admin", "owner"].includes(membership.role)) {
  throw new AuthorizationError("Only admins or owners can manage columns");
}
```

**Change it to:**
```typescript
// Allow ANY valid membership (remove the role restriction)
if (!membership) {
  throw new AuthorizationError("You must be a member of this workspace to manage columns");
}
```

---

### 2. Fix Task Controller (`src/controllers/task.controller.ts`)

Ensure that members are also allowed to **Create** and **Update** tasks.

**Required Change:**
In `createTask` and `updateTask`, ensure the `membership.role` check is removed, allowing all members of the workspace to manage tasks.

---

### Why this is urgent:
The frontend UI has already been updated to support member-level column management. However, the server is still rejecting these requests, making it impossible for members to collaborate on the board until these role checks are relaxed.

**Console Error for Reference:**
`POST http://localhost:5000/api/v1/statuses 403 (Forbidden)`
`{message: 'Something went wrong', status: 403}`
