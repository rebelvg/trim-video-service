import * as sinon from 'sinon';
import { assert } from 'chai';
import * as faker from 'faker';

import { userService } from './user';
import { userRepository } from '../repositories/user';

describe('UserService unit test', () => {
  describe('#create', () => {
    let sandbox: sinon.SinonSandbox;

    let createStub: sinon.SinonStub;
    let findOneStub: sinon.SinonStub;

    let createResult;

    before(async () => {
      sandbox = sinon.createSandbox();

      createStub = sandbox.stub(userRepository, 'create');
      findOneStub = sandbox.stub(userRepository, 'findOne');

      createResult = faker.random.uuid();

      createStub.resolves(createResult);

      await userService.create();
    });

    after(() => {
      sandbox.restore();
    });

    it('should call create once', () => {
      assert.isTrue(createStub.calledOnce);
    });

    it('should call findOne once', () => {
      assert.isTrue(findOneStub.calledOnce);

      sinon.assert.calledWithExactly(findOneStub, {
        _id: createResult,
      });
    });
  });

  describe('#findByToken', () => {
    let sandbox: sinon.SinonSandbox;

    let findOneStub: sinon.SinonStub;

    let token;

    before(async () => {
      sandbox = sinon.createSandbox();

      findOneStub = sandbox.stub(userRepository, 'findOne');

      token = faker.random.uuid();

      await userService.findByToken(token);
    });

    after(() => {
      sandbox.restore();
    });

    it('should call findOne once', () => {
      assert.isTrue(findOneStub.calledOnce);

      sinon.assert.calledWithExactly(findOneStub, {
        token,
      });
    });
  });
});
