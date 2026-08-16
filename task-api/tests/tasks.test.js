const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// POST /tasks
describe('POST /tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Buy groceries' });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Buy groceries');
    expect(res.body.status).toBe('todo');
  });

  it('returns 400 if title is missing', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Task', status: 'invalid' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid priority', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Task', priority: 'urgent' });
    expect(res.statusCode).toBe(400);
  });
});

// GET /tasks
describe('GET /tasks', () => {
  it('returns empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });
    await request(app).post('/tasks').send({ title: 'Task 2' });

    const res = await request(app).get('/tasks');
    expect(res.body).toHaveLength(2);
  });

  it('filters tasks by status', async () => {
    await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/tasks?status=todo');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('todo');
  });

  it('page 1 skips the first N tasks due to a bug (offset = page * limit)', async () => {
    for (let i = 1; i <= 6; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }

    const res = await request(app).get('/tasks?page=1&limit=3');
    expect(res.body).toHaveLength(3);
    // Bug: offset = 1 * 3 = 3, so page 1 actually starts at Task 4 instead of Task 1
    expect(res.body[0].title).toBe('Task 4');
  });
});

// PUT /tasks/:id
describe('PUT /tasks/:id', () => {
  it('updates a task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Old title' });
    const id = created.body.id;

    const res = await request(app).put(`/tasks/${id}`).send({ title: 'New title' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('New title');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/tasks/fake-id').send({ title: 'x' });
    expect(res.statusCode).toBe(404);
  });
});

// DELETE /tasks/:id
describe('DELETE /tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    const res = await request(app).delete(`/tasks/${id}`);
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/tasks/fake-id');
    expect(res.statusCode).toBe(404);
  });
});

// PATCH /tasks/:id/complete
describe('PATCH /tasks/:id/complete', () => {
  it('marks a task as done', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    const res = await request(app).patch(`/tasks/${id}/complete`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/tasks/fake-id/complete');
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 if task is already completed', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    await request(app).patch(`/tasks/${id}/complete`);
    const res = await request(app).patch(`/tasks/${id}/complete`);

    expect(res.statusCode).toBe(400);
  });
});

// GET /tasks/stats
describe('GET /tasks/stats', () => {
  it('returns counts for each status', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });

    const res = await request(app).get('/tasks/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
  });

  it('counts overdue tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Late', dueDate: '2000-01-01T00:00:00.000Z' });

    const res = await request(app).get('/tasks/stats');
    expect(res.body.overdue).toBe(1);
  });
});

// PATCH /tasks/:id/assign
describe('PATCH /tasks/:id/assign', () => {
  it('assigns a task to a person', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    const res = await request(app).patch(`/tasks/${id}/assign`).send({ assignee: 'Uttkarsh' });
    expect(res.statusCode).toBe(200);
    expect(res.body.assignee).toBe('Uttkarsh');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/tasks/fake-id/assign').send({ assignee: 'Uttkarsh' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 if assignee is empty', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    const res = await request(app).patch(`/tasks/${id}/assign`).send({ assignee: '' });
    expect(res.statusCode).toBe(400);
  });

  it('allows reassigning to a different person', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const id = created.body.id;

    await request(app).patch(`/tasks/${id}/assign`).send({ assignee: 'Rahul' });
    const res = await request(app).patch(`/tasks/${id}/assign`).send({ assignee: 'Uttkarsh' });

    expect(res.statusCode).toBe(200);
    expect(res.body.assignee).toBe('Uttkarsh');
  });
});
