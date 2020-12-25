import * as sinon from 'sinon';
import { assert } from 'chai';
import * as faker from 'faker';
import * as fs from 'fs';
import { ObjectID } from 'mongodb';

import { trimTaskWorker } from './worker';
import { trimTaskService } from '../common/services/trim-task';
import { TrimTaskStatusEnum } from '../common/models/trim-task';

describe('TrimVideoWorker unit test', () => {
  describe('#processTasks', () => {
    let sandbox: sinon.SinonSandbox;

    let findNextTasksStub: sinon.SinonStub;
    let processTaskStub: sinon.SinonStub;

    let findNextTasksResult;

    before(async () => {
      sandbox = sinon.createSandbox();

      findNextTasksStub = sandbox.stub(trimTaskService, 'findNextTasks');
      processTaskStub = sandbox.stub(trimTaskWorker, 'processTask');

      findNextTasksResult = Array.from(
        {
          length: 10,
        },
        () => {
          return faker.random.uuid();
        },
      );

      findNextTasksStub.resolves(findNextTasksResult);

      await trimTaskWorker.processTasks();
    });

    after(() => {
      sandbox.restore();
    });

    it('should call findNextTasks once', () => {
      assert.isTrue(findNextTasksStub.calledOnce);

      sinon.assert.calledWithExactly(findNextTasksStub, 10);
    });

    it('should call processTask N times', () => {
      assert.strictEqual(processTaskStub.callCount, findNextTasksResult.length);

      sinon.assert.calledWithExactly(processTaskStub, findNextTasksResult[0]);
    });
  });

  describe('#processTask', () => {
    let sandbox: sinon.SinonSandbox;

    let setStatusStub: sinon.SinonStub;
    let trimVideoStub: sinon.SinonStub;

    before(() => {
      sandbox = sinon.createSandbox();

      setStatusStub = sandbox.stub(trimTaskService, 'setStatus');
      trimVideoStub = sandbox.stub(trimTaskWorker, 'trimVideo');
    });

    after(() => {
      sandbox.restore();
    });

    context('when trim video failed', () => {
      let trimTask;

      before(async () => {
        trimTask = {
          _id: new ObjectID(),
        };

        trimVideoStub.rejects();

        await trimTaskWorker.processTask(trimTask);
      });

      after(() => {
        sandbox.reset();
      });

      it('should call trimVideo once', () => {
        assert.isTrue(trimVideoStub.calledOnce);
      });

      it('should call setStatus twice', () => {
        assert.isTrue(setStatusStub.calledTwice);

        sinon.assert.calledWithExactly(setStatusStub, trimTask._id, {
          status: TrimTaskStatusEnum.IN_PROGRESS,
        });

        sinon.assert.calledWithExactly(setStatusStub, trimTask._id, {
          status: TrimTaskStatusEnum.FAILED,
          processingError: 'Error',
        });
      });
    });

    context('when trim video completed', () => {
      let trimTask;
      let trimVideoResult;

      before(async () => {
        trimTask = {
          _id: new ObjectID(),
        };

        trimVideoResult = faker.random.uuid();

        trimVideoStub.resolves(trimVideoResult);

        await trimTaskWorker.processTask(trimTask);
      });

      after(() => {
        sandbox.reset();
      });

      it('should call trimVideo once', () => {
        assert.isTrue(trimVideoStub.calledOnce);
      });

      it('should call setStatus twice', () => {
        assert.isTrue(setStatusStub.calledTwice);

        sinon.assert.calledWithExactly(setStatusStub, trimTask._id, {
          status: TrimTaskStatusEnum.IN_PROGRESS,
        });

        sinon.assert.calledWithExactly(setStatusStub, trimTask._id, {
          status: TrimTaskStatusEnum.COMPLETED,
          processedFilePath: trimVideoResult,
        });
      });
    });
  });

  describe('#trimVideo', () => {
    let trimTask;

    let actualResult;

    before(async () => {
      trimTask = {
        _id: new ObjectID(),
        startTime: 0,
        endTime: 0,
        filePath: 'test.flv',
      };

      actualResult = await trimTaskWorker.trimVideo(trimTask);
    });

    after(() => {
      fs.unlinkSync(actualResult);
    });

    it('should create new file', () => {
      assert.isTrue(fs.existsSync(actualResult));
    });
  });
});
