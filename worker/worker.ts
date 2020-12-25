import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

import { trimTaskService, UPLOAD_FOLDER } from '../common/services/trim-task';
import { sleep } from '../common/utils';
import { TrimTaskStatusEnum, ITrimTask } from '../common/models/trim-task';

class TrimVideoWorker {
  public async processTasks() {
    const trimTasks = await trimTaskService.findNextTasks(10);

    await Promise.all(trimTasks.map((trimTask) => this.processTask(trimTask)));
  }

  public async processTask(trimTask: ITrimTask) {
    await trimTaskService.setStatus(trimTask._id, {
      status: TrimTaskStatusEnum.IN_PROGRESS,
    });

    let outputFilePath;

    try {
      outputFilePath = await this.trimVideo(trimTask);
    } catch (error) {
      await trimTaskService.setStatus(trimTask._id, {
        status: TrimTaskStatusEnum.FAILED,
        processingError: error.message,
      });

      return;
    }

    await trimTaskService.setStatus(trimTask._id, {
      status: TrimTaskStatusEnum.COMPLETED,
      processedFilePath: outputFilePath,
    });
  }

  public async trimVideo(trimTask: ITrimTask): Promise<string> {
    const outputFilePath = `${UPLOAD_FOLDER}/trim_task_${trimTask._id.toHexString()}_${Date.now()}_done.mp4`;

    return new Promise((resolve, reject) => {
      ffmpeg(fs.createReadStream(trimTask.filePath))
        .seekInput(trimTask.startTime)
        .duration(trimTask.endTime - trimTask.startTime)
        .output(outputFilePath)
        .on('error', reject)
        .on('end', () => {
          resolve(outputFilePath);
        })
        .run();
    });
  }

  public async start() {
    while (true) {
      await this.processTasks();

      await sleep(100);
    }
  }
}

export const trimTaskWorker = new TrimVideoWorker();
