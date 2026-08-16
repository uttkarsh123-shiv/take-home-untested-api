# Bug Report

Found 3 bugs while writing tests. Fixed Bug 3.

---

## Bug 1 — Pagination skips the first page

**File:** `src/services/taskService.js` — `getPaginated()`

**What should happen:**
`GET /tasks?page=1&limit=3` should return the first 3 tasks.

**What actually happens:**
It returns tasks 4–6. Page 1 is skipped entirely.

**Why:**
```js
const offset = page * limit; // page=1, limit=3 → offset=3, skips first 3 tasks
```

**What it should be:**
```js
const offset = (page - 1) * limit; // page=1, limit=3 → offset=0, starts from task 1
```

**How I found it:** Wrote a pagination test and noticed it was returning the wrong tasks.

**Status: Not fixed**

---

## Bug 2 — completeTask silently resets priority to medium

**File:** `src/services/taskService.js` — `completeTask()`

**What should happen:**
Completing a task should only set `status` to `"done"` and record `completedAt`. The priority should stay as it was.

**What actually happens:**
Any task that gets completed has its priority silently overwritten to `"medium"`, regardless of what it was originally. A `"high"` priority task becomes `"medium"` after completion with no warning.

**Why:**
```js
const updated = {
  ...task,
  priority: 'medium', // ← this line has no reason to be here
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

**What it should be:**
Just remove `priority: 'medium'`. The `...task` spread already keeps the original priority.

**How I found it:** Read through `completeTask` — there was no reason for priority to change when completing a task.

**Status: Not fixed**

---

## Bug 3 — Task can be completed multiple times ✅ FIXED

**File:** `src/services/taskService.js` — `completeTask()`

**What should happen:**
Completing a task that is already done should return a `400` error.

**What actually happens (before fix):**
Calling `PATCH /tasks/:id/complete` twice on the same task both return `200`. The second call silently overwrites `completedAt` with a new timestamp.

**How I found it:** Wrote a test that completed the same task twice and expected `400` on the second call — it was returning `200`.

**The fix:**

In `taskService.js`, added a guard inside `completeTask()`:
```js
if (task.status === 'done') {
  throw new Error('Task is already completed');
}
```

In `routes/tasks.js`, wrapped the call in `try/catch` so the thrown error becomes a `400` response:
```js
try {
  const task = taskService.completeTask(req.params.id);
  ...
} catch (error) {
  res.status(400).json({ error: error.message });
}
```

**Before fix:** First complete → 200, second complete → 200
**After fix:** First complete → 200, second complete → 400
