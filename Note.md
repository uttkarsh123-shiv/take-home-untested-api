# Notes

## 1. What would you test next if you had more time?

- Edge cases for pagination: `page=0`, negative page numbers, `limit=0`
- What happens if you pass both `status` and `page` in the same request — right now status takes priority and pagination is ignored silently
- The priority reset bug in `completeTask` — completing a high priority task quietly sets it back to medium. I'd write a test for that and remove the hardcoded `priority: 'medium'` line

## 2. What surprised you?

The `getByStatus` bug was subtle. Using `.includes()` on a string checks for substrings, so `?status=in` would match `in_progress` tasks with no error, just silently wrong results. Easy to miss without a test.

Also the route ordering in Express — `/stats` has to be registered before `/:id`, otherwise Express treats the string "stats" as a task id and returns 404.

## 3. What would you ask before going to production?

- Should reassignment be allowed, or should a task stay with whoever it was first assigned to?
- Is there a max page size we should enforce on `limit`?
- What should happen to `completedAt` if someone updates a done task back to `todo` via PUT?
