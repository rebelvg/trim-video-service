import * as Router from 'koa-router';

import { users } from './users';
import { trimTasks } from './trim-task';

export const router_v1 = new Router();

router_v1.use('/users', users.routes());
router_v1.use('/trim-tasks', trimTasks.routes());
