import { Context } from 'koa';

import { BadRequest } from '../errors';

export async function isLoggedIn(ctx: Context, next) {
  const { user } = ctx.state;

  if (!user) {
    throw new BadRequest('Not logged in.');
  }

  await next();
}
