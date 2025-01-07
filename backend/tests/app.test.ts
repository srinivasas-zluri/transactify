import request from 'supertest';
import app from '../src/app';

describe('GET /', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(201);
    expect(response.text).toBe('Hello, world!');
  });
});
