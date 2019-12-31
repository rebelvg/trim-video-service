import Router = require('koa-router');

import { users } from './users';
import { trimTasks } from './trim-task';

export const routerV1 = new Router();

routerV1.use('/users', users.routes());
routerV1.use('/trim-tasks', trimTasks.routes());
