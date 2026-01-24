import app from '#src/app.js';
import request from 'supertest';

describe('API endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});

describe('API endpoints', () => {
  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api').expect(200);
      expect(response.body).toHaveProperty(
        'message',
        'Acquistions api Running!!'
      );
    });
  });
});

describe('API endpoints', () => {
  describe('GET /nonexistent', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/nonexistent').expect(404);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
