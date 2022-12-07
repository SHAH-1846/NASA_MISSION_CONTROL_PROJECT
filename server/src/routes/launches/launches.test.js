const request = require('supertest');
const app = require('../../app');
const { loadPlanetsData } = require('../../models/planets.model');
const { mongoConnect,mongoDisconnect } = require('../../services/mongo');
jest.setTimeout(60000);





describe('Launches API', () => {


    beforeAll(async () => {
        await mongoConnect();
        await loadPlanetsData();
    });

    afterAll(async ()=>{
        await mongoDisconnect();
    })


    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });


    describe('Test POST /launches', () => {
        test('It should respond with 201 created', async () => {
            const completeLaunchData = {
                mission: 'USS Enterprise',
                rocket: 'Ncc 1701-D',
                target: 'Kepler-62 f',
                launchDate: 'January 4, 2028',
            };
            const completeLaunchDataWithoutDate = {
                mission: 'USS Enterprise',
                rocket: 'Ncc 1701-D',
                target: 'Kepler-62 f',
            };

            const response = await request(app)
                .post('/v1/launches')
                .send(completeLaunchData)
                .expect('content-Type', /json/)
                .expect(201);

            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);

            expect(response.body).toMatchObject(completeLaunchDataWithoutDate);
        })

        test('It should catch the missing required properties', async () => {
            const completeLaunchDataWithoutDate = {
                mission: 'USS Enterprise',
                rocket: 'Ncc 1701-D',
                target: 'Kepler-186 f',
            };

            const response = await request(app)
                .post('/v1/launches')
                .send(completeLaunchDataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: 'Missing required launch property',
            });
        });

        test('It should catch invalid dates', async () => {
            const invalidDate = {
                mission: 'USS Enterprise',
                rocket: 'Ncc 1701-D',
                target: 'Kepler-186 f',
                launchDate: 'Zoot',
            };

            const response = await request(app)
                .post('/v1/launches')
                .send(invalidDate)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: 'Invalid launch date',
            });
        })

    });

}
)

