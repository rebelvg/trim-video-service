import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as koaQs from 'koa-qs';

import { routerV1 } from './routes/v1';
import { readToken } from './middleware/read-token';

export const app = new Koa();

koaQs(app);

app.use(bodyParser({ enableTypes: ['json'] }));
app.use(readToken);

app.proxy = true;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = [error.message];
  }
});

const router = new Router();

router.use('/v1', routerV1.routes());

app.use(router.routes());

app.use(ctx => {
  ctx.throw(404, 'Not Found.');
});
