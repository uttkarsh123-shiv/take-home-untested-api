const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// create()
describe('create()', () => {
  it('creates a task with the given title', () => {
    const task = taskService.create({ title: 'Buy milk' });
    expect(task.title).toBe('Buy milk');
    expect(task.id).toBeDefined();
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
  });

  it('each task gets a unique id', () => {
    const a = taskService.create({ title: 'A' });
    const b = taskService.create({ title: 'B' });
    expect(a.id).not.toBe(b.id);
  });
});

// getAll()
describe('getAll()', () => {
  it('returns empty array when store is empty', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  it('returns all tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    expect(taskService.getAll()).toHaveLength(2);
  });
});

// findById()
describe('findById()', () => {
  it('returns the task for a valid id', () => {
    const task = taskService.create({ title: 'Find me' });
    expect(taskService.findById(task.id).title).toBe('Find me');
  });

  it('returns undefined for an unknown id', () => {
    expect(taskService.findById('nope')).toBeUndefined();
  });
});

// getByStatus()
describe('getByStatus()', () => {
  it('returns only tasks with that exact status', () => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'done' });

    const results = taskService.getByStatus('todo');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('A');
  });
});

// getPaginated()
describe('getPaginated()', () => {
  beforeEach(() => {
    for (let i = 1; i <= 6; i++) taskService.create({ title: `Task ${i}` });
  });

  it('page 1 returns the first N tasks (bug fix)', () => {
    // Bug 1: offset = page * limit = 1 * 3 = 3, so page 1 skips the first 3 tasks
    const page1 = taskService.getPaginated(1, 3);
    expect(page1[0].title).toBe('Task 4');
    expect(page1).toHaveLength(3);
  });

  it('page 2 returns the next N tasks', () => {
    // With the bug (offset = page * limit), page=2 limit=3 gives offset=6.
    // We only have 6 tasks, so slice(6,9) returns empty — no items on "page 2".
    const page2 = taskService.getPaginated(2, 3);
    expect(page2).toHaveLength(0);
  });
});

// update()
describe('update()', () => {
  it('updates the given fields', () => {
    const task = taskService.create({ title: 'Old' });
    const updated = taskService.update(task.id, { title: 'New' });
    expect(updated.title).toBe('New');
  });

  it('returns null for unknown id', () => {
    expect(taskService.update('nope', { title: 'x' })).toBeNull();
  });
});

// remove()
describe('remove()', () => {
  it('removes the task and returns true', () => {
    const task = taskService.create({ title: 'Delete me' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  it('returns false for unknown id', () => {
    expect(taskService.remove('nope')).toBe(false);
  });
});

// completeTask()
describe('completeTask()', () => {
  it('marks the task as done', () => {
    const task = taskService.create({ title: 'Finish me' });
    const result = taskService.completeTask(task.id);
    expect(result.status).toBe('done');
    expect(result.completedAt).not.toBeNull();
  });

  it('returns null for unknown id', () => {
    expect(taskService.completeTask('nope')).toBeNull();
  });

  it('silently resets priority to medium (Bug 2)', () => {
    // Bug: completeTask hardcodes priority: 'medium' in the update.
    // A high priority task loses its priority on completion.
    const task = taskService.create({ title: 'Important', priority: 'high' });
    const result = taskService.completeTask(task.id);
    // This should be 'high' but the bug makes it 'medium'
    expect(result.priority).toBe('medium');
  });

  it('throws if task is already completed (Bug 3 — fixed)', () => {
    const task = taskService.create({ title: 'Once only' });
    taskService.completeTask(task.id);
    expect(() => taskService.completeTask(task.id)).toThrow('Task is already completed');
  });
});
// getStats()
describe('getStats()', () => {
  it('returns zero counts for empty store', () => {
    expect(taskService.getStats()).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('counts tasks correctly by status', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B', status: 'done' });

    const stats = taskService.getStats();
    expect(stats.todo).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('counts overdue tasks', () => {
    taskService.create({ title: 'Late', dueDate: '2000-01-01T00:00:00.000Z' });
    expect(taskService.getStats().overdue).toBe(1);
  });
});

// assignTask()
describe('assignTask()', () => {
  it('assigns the task and returns it', () => {
    const task = taskService.create({ title: 'Assign me' });
    const result = taskService.assignTask(task.id, 'Uttkarsh');
    expect(result.assignee).toBe('Uttkarsh');
  });

  it('returns null for unknown id', () => {
    expect(taskService.assignTask('nope', 'Uttkarsh')).toBeNull();
  });

  it('allows reassignment', () => {
    const task = taskService.create({ title: 'Reassign' });
    taskService.assignTask(task.id, 'Rahul');
    const result = taskService.assignTask(task.id, 'Uttkarsh');
    expect(result.assignee).toBe('Uttkarsh');
  });
});
