import * as supertest from 'supertest';
import { assert } from 'chai';

import { server } from '../..';

describe('/users acceptance test', () => {
  describe('GET /', () => {
    it('should return HTTP status 200', () => {
      return supertest(server)
        .post('/v1/users')
        .expect(200)
        .expect(({ body }) => {
          assert.isString(body.token);
        });
    });
  });
});
