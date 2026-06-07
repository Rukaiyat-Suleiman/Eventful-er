const request = require('supertest');
const app = require('../src/app.js');
const { sequelize } = require('../src/database/models');

describe('GET /', () => {
    afterAll(async () => {
        await sequelize.close();
    });

    it('should return success message', async () => {
        const response = await request(app)
            .get('/api')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            statusCode: 200,
            message: 'Hi',
            data: null
        });
    });

    it('should serve Swagger API docs', async () => {
        await request(app)
            .get('/api-docs/')
            .expect(200);
    });
});
