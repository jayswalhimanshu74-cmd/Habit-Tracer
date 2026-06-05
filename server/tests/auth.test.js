const request = require('supertest');
const app     = require('../server');

let authToken;
let createdHabitId;
describe('Auth endpoints', () => {
  const testUser = {
    name:     'Test User',
    username: `testuser_${Date.now()}`,
    email:    `test_${Date.now()}@example.com`,
    password: 'Test1234!',
  };


  it('POST /api/auth/register — creates a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  it('POST /api/auth/login — returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  it('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Habits endpoints', () => {

  it('POST /api/habits — creates a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Morning run', category: 'Health', difficulty: 'Easy' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Morning run');
    createdHabitId = res.body.data.id;
  });

  it('GET /api/habits — returns habits list', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('GET HABITS:', res.statusCode, JSON.stringify(res.body).slice(0, 100));
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/habits/:id — updates a habit', async () => {
    const res = await request(app)
      .put(`/api/habits/${createdHabitId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ difficulty: 'Hard' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.difficulty).toBe('Hard');
  });

  it('DELETE /api/habits/:id — deletes a habit', async () => {
    const res = await request(app)
      .delete(`/api/habits/${createdHabitId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('GET /api/habits — rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.statusCode).toBe(401);
  });
});