import { app } from './app';
import { API } from '../config';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

export const server = app.listen(API.PORT, () => {
  console.log('server_running');
});
