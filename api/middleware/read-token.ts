import { Context } from 'koa';
import { IUser } from '../../common/models/user';
import { userService } from '../../common/services/user';

/* tslint:disable:interface-name */
declare module 'koa' {
  interface Context {
    state: {
      user: IUser;
      [key: string]: any;
    };
  }
}

declare module 'koa-router' {
  interface IRouterContext {
    state: {
      user: IUser;
      [key: string]: any;
    };
  }
}

export async function readToken(ctx: Context, next) {
  const { token } = ctx.headers;

  if (token) {
    const user = await userService.findByToken(token);

    if (user) {
      ctx.state.user = user;
    }
  }

  await next();
}
