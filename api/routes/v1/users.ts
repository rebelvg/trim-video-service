import * as Router from 'koa-router';
import { userService } from '../../../common/services/user';

export const users = new Router();

users.post('/', async (ctx: Router.RouterContext, next) => {
  const user = await userService.create();

  ctx.body = {
    token: user.token,
  };
});
