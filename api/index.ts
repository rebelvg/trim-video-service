import { app } from './app';

import { config } from '../config';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

export const server = app.listen(config.server.port, config.server.host, () => {
  console.log('server is running...');
});
