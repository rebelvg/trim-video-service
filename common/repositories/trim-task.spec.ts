import { assert } from 'chai';
import * as faker from 'faker';

import { trimTaskRepository } from './trim-task';
import { TrimTaskStatusEnum } from '../models/trim-task';
import { ObjectID } from 'mongodb';

describe('TrimTaskRepository integration test', () => {
  before(async () => {
    await trimTaskRepository['connect']();
  });

  describe('#create', () => {
    let createdRecordId;
    let foundRecord;

    before(async () => {
      createdRecordId = await trimTaskRepository.create({
        userId: new ObjectID(),
        startTime: faker.random.number(),
        endTime: faker.random.number(),
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });

      foundRecord = await trimTaskRepository['collection'].findOne({
        _id: createdRecordId
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        _id: createdRecordId
      });
    });

    it('should create record', () => {
      assert.isOk(foundRecord);
    });
  });

  describe('#findOne', () => {
    let userId;
    let foundRecord;

    before(async () => {
      userId = new ObjectID();

      await trimTaskRepository['collection'].insertOne({
        userId,
        startTime: faker.random.number(),
        endTime: faker.random.number(),
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });

      foundRecord = await trimTaskRepository.findOne({
        userId
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        userId
      });
    });

    it('should find record', () => {
      assert.deepEqual(foundRecord.userId, userId);
    });
  });

  describe('#find', () => {
    let userId;
    let foundRecords;

    before(async () => {
      userId = new ObjectID();

      await trimTaskRepository['collection'].insertOne({
        userId,
        startTime: faker.random.number(),
        endTime: faker.random.number(),
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });

      await trimTaskRepository['collection'].insertOne({
        userId,
        startTime: faker.random.number(),
        endTime: faker.random.number(),
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });

      foundRecords = await trimTaskRepository.find({
        userId
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        userId
      });
    });

    it('should find records', () => {
      assert.deepEqual(foundRecords.length, 2);
    });
  });

  describe('#updateOne', () => {
    let userId;
    let foundRecord;
    let status;

    before(async () => {
      userId = new ObjectID();
      status = TrimTaskStatusEnum.COMPLETED;

      await trimTaskRepository['collection'].insertOne({
        userId,
        startTime: faker.random.number(),
        endTime: faker.random.number(),
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null
      });

      await trimTaskRepository.updateOne(
        {
          userId
        },
        {
          status
        }
      );

      foundRecord = await trimTaskRepository['collection'].findOne({
        userId
      });
    });

    after(async () => {
      await trimTaskRepository['collection'].deleteMany({
        userId
      });
    });

    it('should update record', () => {
      assert.deepEqual(foundRecord.status, status);
    });
  });
});
