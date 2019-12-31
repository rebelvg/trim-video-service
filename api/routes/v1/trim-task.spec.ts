import * as supertest from 'supertest';
import { assert } from 'chai';
import { ObjectID } from 'mongodb';

import { server } from '../..';
import { userService } from '../../../common/services/user';
import { userRepository } from '../../../common/repositories/user';
import { trimTaskService } from '../../../common/services/trim-task';
import { trimTaskRepository } from '../../../common/repositories/trim-task';
import { IUser } from '../../../common/models/user';
import { ITrimTask, TrimTaskStatusEnum } from '../../../common/models/trim-task';

describe('/trim-tasks acceptance test', () => {
  let user: IUser;

  before(async () => {
    user = await userService.create();
  });

  after(async () => {
    await userRepository['collection'].deleteMany({
      token: user.token
    });
  });

  describe('POST /', () => {
    it('should return HTTP status 200', () => {
      return supertest(server)
        .post('/v1/trim-tasks')
        .set('token', user.token)
        .send({
          startTime: 0,
          endTime: 0
        })
        .expect(200)
        .expect(({ body }) => {
          assert.isString(body.taskId);
        });
    });

    it('should return HTTP status 400', () => {
      return supertest(server)
        .post('/v1/trim-tasks')
        .set('token', user.token)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /:id/upload-video', () => {
    let trimTask: ITrimTask;

    before(async () => {
      trimTask = await trimTaskService.create({
        startTime: 0,
        endTime: 0,
        userId: user._id
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        _id: trimTask._id
      });
    });

    it('should return HTTP status 204', () => {
      return supertest(server)
        .put(`/v1/trim-tasks/${trimTask._id.toHexString()}/upload-video`)
        .set('token', user.token)
        .send('test')
        .expect(204);
    });
  });

  describe('GET /', () => {
    let trimTask: ITrimTask;

    before(async () => {
      trimTask = await trimTaskService.create({
        startTime: 0,
        endTime: 0,
        userId: user._id
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        _id: trimTask._id
      });
    });

    it('should return HTTP status 200', () => {
      return supertest(server)
        .get('/v1/trim-tasks')
        .set('token', user.token)
        .expect(200)
        .expect(({ body }) => {
          assert.isArray(body.tasks);
        });
    });
  });

  describe('PUT /:id/restart', () => {
    let trimTaskId: ObjectID;

    before(async () => {
      trimTaskId = await trimTaskRepository.create({
        startTime: 0,
        endTime: 0,
        userId: user._id,
        status: TrimTaskStatusEnum.FAILED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        _id: trimTaskId
      });
    });

    it('should return HTTP status 204', () => {
      return supertest(server)
        .put(`/v1/trim-tasks/${trimTaskId.toHexString()}/restart`)
        .set('token', user.token)
        .expect(204);
    });
  });

  describe('GET /:id', () => {
    let trimTaskId: ObjectID;

    before(async () => {
      trimTaskId = await trimTaskRepository.create({
        startTime: 0,
        endTime: 0,
        userId: user._id,
        status: TrimTaskStatusEnum.COMPLETED,
        filePath: null,
        processedFilePath: 'test.flv',
        processingError: null
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        _id: trimTaskId
      });
    });

    it('should return HTTP status 200', () => {
      return supertest(server)
        .get(`/v1/trim-tasks/${trimTaskId.toHexString()}`)
        .set('token', user.token)
        .expect(200)
        .expect(({ body }) => {
          assert.instanceOf(body, Buffer);
        });
    });
  });
});
