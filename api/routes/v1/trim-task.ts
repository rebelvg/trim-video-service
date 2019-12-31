import * as Router from 'koa-router';
import { trimTaskService } from '../../../common/services/trim-task';
import { isLoggedIn } from '../../middleware/is-logged-in';
import { validationMiddleware, postSchema } from './validation/trim-task';

export const trimTasks = new Router();

trimTasks.post(
  '/',
  isLoggedIn,
  validationMiddleware(postSchema, 'request.body'),
  async (ctx: Router.IRouterContext, next) => {
    const {
      request: { body },
      state: { user }
    } = ctx;

    const task = await trimTaskService.create({
      ...body,
      userId: user._id
    });

    ctx.body = {
      taskId: task._id
    };
  }
);

trimTasks.put('/:id/upload-video', isLoggedIn, async (ctx: Router.IRouterContext, next) => {
  const {
    params: { id: taskId },
    state: { user }
  } = ctx;

  await trimTaskService.uploadFile(taskId, user._id, ctx.req);

  ctx.status = 204;
});

trimTasks.get('/', isLoggedIn, async (ctx: Router.IRouterContext, next) => {
  const {
    state: { user }
  } = ctx;

  const trimTasks = await trimTaskService.findByUserId(user._id);

  ctx.body = {
    tasks: trimTasks
  };
});

trimTasks.put('/:id/restart', isLoggedIn, async (ctx: Router.IRouterContext, next) => {
  const {
    params: { id: taskId },
    state: { user }
  } = ctx;

  await trimTaskService.restartTask(taskId, user._id);

  ctx.status = 204;
});

trimTasks.get('/:id', isLoggedIn, async (ctx: Router.IRouterContext, next) => {
  const {
    params: { id: taskId },
    state: { user }
  } = ctx;

  const trimmedVideoFile = await trimTaskService.getVideoFile(taskId, user._id);

  ctx.set({
    'Content-Type': 'video/mp4'
  });

  ctx.body = trimmedVideoFile;
});
