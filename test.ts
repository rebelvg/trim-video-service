import axios from 'axios';
import * as fs from 'fs';

import { userService } from './common/services/user';

(async () => {
  const user = await userService.create();

  const { data } = await axios.post(
    'http://localhost:8000/v1/trim-tasks',
    {
      startTime: 0,
      endTime: 1,
    },
    {
      headers: { token: user.token },
    },
  );

  console.log(data);

  await axios.put(
    `http://localhost:8000/v1/trim-tasks/${data.taskId}/upload-video`,
    fs.readFileSync('test.flv'),
    {
      headers: { token: user.token },
    },
  );

  console.log('upload done...');
})();
