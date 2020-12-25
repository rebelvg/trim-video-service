import * as sinon from 'sinon';
import { assert } from 'chai';
import * as faker from 'faker';
import * as fs from 'fs';

import { trimTaskRepository } from '../repositories/trim-task';
import { trimTaskService, UPLOAD_FOLDER } from './trim-task';
import { ObjectID } from 'mongodb';
import { TrimTaskStatusEnum } from '../models/trim-task';
import { Readable, Writable } from 'stream';

describe('TrimTaskService unit test', () => {
  describe('#create', () => {
    let sandbox: sinon.SinonSandbox;

    let createStub: sinon.SinonStub;
    let findOneStub: sinon.SinonStub;

    let params;

    let createResult;

    before(async () => {
      sandbox = sinon.createSandbox();

      createStub = sandbox.stub(trimTaskRepository, 'create');
      findOneStub = sandbox.stub(trimTaskRepository, 'findOne');

      params = {
        startTime: faker.random.uuid(),
        endTime: faker.random.uuid(),
        userId: new ObjectID(),
      };

      createResult = faker.random.uuid();

      createStub.resolves(createResult);

      await trimTaskService.create(params);
    });

    after(() => {
      sandbox.restore();
    });

    it('should call create once', () => {
      assert.isTrue(createStub.calledOnce);

      sinon.assert.calledWithExactly(createStub, {
        ...params,
        status: TrimTaskStatusEnum.CREATED,
        filePath: null,
        processedFilePath: null,
        processingError: null,
      });
    });

    it('should call findOne once', () => {
      assert.isTrue(findOneStub.calledOnce);

      sinon.assert.calledWithExactly(findOneStub, {
        _id: createResult,
      });
    });
  });

  describe('#findByUserId', () => {
    let sandbox: sinon.SinonSandbox;

    let findStub: sinon.SinonStub;

    let findResult;

    let userId;

    let actualResult;

    before(async () => {
      sandbox = sinon.createSandbox();

      findStub = sandbox.stub(trimTaskRepository, 'find');

      findResult = [
        {
          _id: new ObjectID(),
          startTime: 0,
          endTime: 0,
        },
      ];

      findStub.resolves(findResult);

      userId = faker.random.uuid();

      actualResult = await trimTaskService.findByUserId(userId);
    });

    after(() => {
      sandbox.restore();
    });

    it('should call find once', () => {
      assert.isTrue(findStub.calledOnce);

      sinon.assert.calledWithExactly(findStub, {
        userId,
      });
    });

    it('should return expected result', () => {
      const expectedResult = {
        ...findResult[0],
      };

      assert.include(actualResult[0], expectedResult);
    });
  });

  describe('#restartTask', () => {
    let sandbox: sinon.SinonSandbox;

    let taskId;
    let userId;

    let findOneStub: sinon.SinonStub;
    let updateOneStub: sinon.SinonStub;

    before(() => {
      sandbox = sinon.createSandbox();

      taskId = new ObjectID().toHexString();
      userId = new ObjectID();

      findOneStub = sandbox.stub(trimTaskRepository, 'findOne');
      updateOneStub = sandbox.stub(trimTaskRepository, 'updateOne');
    });

    after(() => {
      sandbox.restore();
    });

    context('when task does not exist', () => {
      before(async () => {
        try {
          await trimTaskService.restartTask(taskId, userId);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWith(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call updateOne', () => {
        assert.isTrue(updateOneStub.notCalled);
      });
    });

    context('when task does not have status failed', () => {
      let findOneResult;

      before(async () => {
        findOneResult = {};

        findOneStub.resolves(findOneResult);

        try {
          await trimTaskService.restartTask(taskId, userId);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWith(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call updateOne', () => {
        assert.isTrue(updateOneStub.notCalled);
      });
    });

    context('when task can be restarted', () => {
      let findOneResult;

      before(async () => {
        findOneResult = {
          status: TrimTaskStatusEnum.FAILED,
        };

        findOneStub.resolves(findOneResult);

        await trimTaskService.restartTask(taskId, userId);
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWith(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should call updateOne once', () => {
        assert.isTrue(updateOneStub.calledOnce);

        sinon.assert.calledWithExactly(
          updateOneStub,
          {
            _id: new ObjectID(taskId),
          },
          {
            status: TrimTaskStatusEnum.READY,
          },
        );
      });
    });
  });

  describe('#uploadFile', () => {
    let sandbox: sinon.SinonSandbox;

    let taskId;
    let userId;
    let readStream;

    let findOneStub: sinon.SinonStub;
    let storeFileStub: sinon.SinonStub;
    let updateOneStub: sinon.SinonStub;

    before(() => {
      sandbox = sinon.createSandbox();

      taskId = new ObjectID().toHexString();
      userId = new ObjectID();
      readStream = {};

      findOneStub = sandbox.stub(trimTaskRepository, 'findOne');
      storeFileStub = sandbox.stub(trimTaskService, 'storeFile');
      updateOneStub = sandbox.stub(trimTaskRepository, 'updateOne');
    });

    after(() => {
      sandbox.restore();
    });

    context('when task does not exist', () => {
      before(async () => {
        try {
          await trimTaskService.uploadFile(taskId, userId, readStream);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call storeFile', () => {
        assert.isTrue(storeFileStub.notCalled);
      });

      it('should not call updateOne', () => {
        assert.isTrue(updateOneStub.notCalled);
      });
    });

    context('when task filePath exists', () => {
      let findOneResult;

      before(async () => {
        findOneResult = {
          filePath: faker.random.uuid(),
        };

        findOneStub.resolves(findOneResult);

        try {
          await trimTaskService.uploadFile(taskId, userId, readStream);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call storeFile', () => {
        assert.isTrue(storeFileStub.notCalled);
      });

      it('should not call updateOne', () => {
        assert.isTrue(updateOneStub.notCalled);
      });
    });

    context('when can upload file', () => {
      let findOneResult;
      let storeFileResult;

      before(async () => {
        findOneResult = {};

        findOneStub.resolves(findOneResult);

        storeFileResult = faker.random.uuid();

        storeFileStub.resolves(storeFileResult);

        try {
          await trimTaskService.uploadFile(taskId, userId, readStream);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should call storeFile once', () => {
        assert.isTrue(storeFileStub.calledOnce);

        sinon.assert.calledWithExactly(storeFileStub, taskId, readStream);
      });

      it('should call updateOne once', () => {
        assert.isTrue(updateOneStub.calledOnce);

        sinon.assert.calledWithExactly(
          updateOneStub,
          {
            _id: new ObjectID(taskId),
          },
          {
            filePath: storeFileResult,
            status: TrimTaskStatusEnum.READY,
          },
        );
      });
    });
  });

  describe('#storeFile', () => {
    let sandbox: sinon.SinonSandbox;

    let taskId;
    let readStream;

    let createWriteStreamStub: sinon.SinonStub;

    let filePath;

    let actualResult;

    before(async () => {
      sandbox = sinon.createSandbox();

      sandbox.useFakeTimers();

      taskId = faker.random.uuid();
      readStream = {
        pipe: sandbox.stub(),
        on: (eventName, cb) => {
          if (eventName === 'end') {
            cb();
          }
        },
      };

      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream');

      createWriteStreamStub.returns(new Writable());

      filePath = `${UPLOAD_FOLDER}/trim_task_${taskId}_${Date.now()}`;

      actualResult = await trimTaskService.storeFile(taskId, readStream);
    });

    after(() => {
      sandbox.restore();
    });

    it('should call createWriteStream once', () => {
      assert.isTrue(createWriteStreamStub.calledOnce);

      sinon.assert.calledWithExactly(createWriteStreamStub, filePath);
    });

    it('should return expected result', () => {
      assert.deepEqual(actualResult, filePath);
    });
  });

  describe('#findNextTasks', () => {
    let sandbox: sinon.SinonSandbox;

    let findStub: sinon.SinonStub;

    let limit;

    before(async () => {
      sandbox = sinon.createSandbox();

      findStub = sandbox.stub(trimTaskRepository, 'find');

      limit = faker.random.number();

      await trimTaskService.findNextTasks(limit);
    });

    after(() => {
      sandbox.restore();
    });

    it('should call findOne once', () => {
      assert.isTrue(findStub.calledOnce);

      sinon.assert.calledWithExactly(
        findStub,
        {
          status: TrimTaskStatusEnum.READY,
        },
        limit,
      );
    });
  });

  describe('#setStatus', () => {
    let sandbox: sinon.SinonSandbox;

    let updateOneStub: sinon.SinonStub;

    let taskId;
    let status;

    before(async () => {
      sandbox = sinon.createSandbox();

      taskId = new ObjectID();
      status = TrimTaskStatusEnum.COMPLETED;

      updateOneStub = sandbox.stub(trimTaskRepository, 'updateOne');

      await trimTaskService.setStatus(taskId, { status });
    });

    after(() => {
      sandbox.restore();
    });

    it('should call updateOne once', () => {
      assert.isTrue(updateOneStub.calledOnce);

      sinon.assert.calledWithExactly(
        updateOneStub,
        {
          _id: taskId,
        },
        {
          status,
        },
      );
    });
  });

  describe('#getVideoFile', () => {
    let sandbox: sinon.SinonSandbox;

    let taskId;
    let userId;

    let findOneStub: sinon.SinonStub;
    let createReadStreamStub: sinon.SinonStub;

    before(() => {
      sandbox = sinon.createSandbox();

      taskId = new ObjectID().toHexString();
      userId = new ObjectID();

      findOneStub = sandbox.stub(trimTaskRepository, 'findOne');
      createReadStreamStub = sandbox.stub(fs, 'createReadStream');
    });

    after(() => {
      sandbox.restore();
    });

    context('when task not found', () => {
      before(async () => {
        try {
          await trimTaskService.getVideoFile(taskId, userId);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call createReadStream', () => {
        assert.isTrue(createReadStreamStub.notCalled);
      });
    });

    context('when file not found', () => {
      let findOneResult;

      before(async () => {
        findOneResult = {};
        findOneStub.resolves(findOneResult);

        try {
          await trimTaskService.getVideoFile(taskId, userId);
        } catch (error) {}
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should not call createReadStream', () => {
        assert.isTrue(createReadStreamStub.notCalled);
      });
    });

    context('when can get video file', () => {
      let findOneResult;

      before(async () => {
        findOneResult = {
          processedFilePath: faker.random.uuid(),
        };
        findOneStub.resolves(findOneResult);

        await trimTaskService.getVideoFile(taskId, userId);
      });

      after(() => {
        sandbox.reset();
      });

      it('should call findOne once', () => {
        assert.isTrue(findOneStub.calledOnce);

        sinon.assert.calledWithExactly(findOneStub, {
          _id: new ObjectID(taskId),
          userId,
        });
      });

      it('should call createReadStream once', () => {
        assert.isTrue(createReadStreamStub.calledOnce);

        sinon.assert.calledWithExactly(
          createReadStreamStub,
          findOneResult.processedFilePath,
        );
      });
    });
  });
});
