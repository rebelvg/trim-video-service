import { assert } from 'chai';
import * as faker from 'faker';

import { userRepository } from './user';

describe('UserRepository integration test', () => {
  before(async () => {
    await userRepository['connect']();
  });

  describe('#create', () => {
    let createdRecordId;
    let foundRecord;

    before(async () => {
      createdRecordId = await userRepository.create();

      foundRecord = await userRepository['collection'].findOne({
        _id: createdRecordId,
      });
    });

    after(async () => {
      await userRepository['collection'].deleteMany({
        _id: createdRecordId,
      });
    });

    it('should create record', () => {
      assert.isOk(foundRecord);
    });
  });

  describe('#findOne', () => {
    let token;
    let foundRecord;

    before(async () => {
      token = faker.random.uuid();

      await userRepository['collection'].insertOne({
        token,
      });

      foundRecord = await userRepository.findOne({
        token,
      });
    });

    after(async () => {
      await userRepository['collection'].deleteMany({
        token,
      });
    });

    it('should find record', () => {
      assert.deepEqual(foundRecord.token, token);
    });
  });
});
