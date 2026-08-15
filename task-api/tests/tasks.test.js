const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');


// Reset in-memory DB before each test
beforeEach(() => {
  taskService._reset();
});


describe('POST /tasks', () => {

  it('should create a task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test task');
  });

  it('should fail if title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Test', status: 'invalid' });

    expect(res.statusCode).toBe(400);
  });

});


describe('GET /tasks', () => {

  it('should return empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should get all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });

    const res = await request(app).get('/tasks');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

});


describe('PATCH /tasks/:id/complete', () => {

  it('should complete a task', async () => {
    const create = await request(app)
      .post('/tasks')
      .send({ title: 'Task' });

    const id = create.body.id;

    const res = await request(app)
      .patch(`/tasks/${id}/complete`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).not.toBeNull();
  });

  it('should not allow completing a task twice (BUG TEST)', async () => {
    const create = await request(app)
      .post('/tasks')
      .send({ title: 'Task' });

    const id = create.body.id;

    await request(app).patch(`/tasks/${id}/complete`);
    const second = await request(app).patch(`/tasks/${id}/complete`);

    expect(second.statusCode).toBe(400);
  });

  it('should return 404 for invalid id', async () => {
    const res = await request(app)
      .patch('/tasks/invalid-id/complete');

    expect(res.statusCode).toBe(404);
  });

});


describe('DELETE /tasks/:id', () => {

  it('should delete a task', async () => {
    const create = await request(app)
      .post('/tasks')
      .send({ title: 'Task' });

    const id = create.body.id;

    const res = await request(app)
      .delete(`/tasks/${id}`);

    expect(res.statusCode).toBe(204);
  });

  it('should return 404 when deleting twice', async () => {
    const create = await request(app)
      .post('/tasks')
      .send({ title: 'Task' });

    const id = create.body.id;

    await request(app).delete(`/tasks/${id}`);
    const res = await request(app).delete(`/tasks/${id}`);

    expect(res.statusCode).toBe(404);
  });

});


describe('GET /tasks/stats', () => {

  it('should return stats', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });

    const res = await request(app).get('/tasks/stats');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('todo');
    expect(res.body).toHaveProperty('in_progress');
    expect(res.body).toHaveProperty('done');
    expect(res.body).toHaveProperty('overdue');
  });

});


