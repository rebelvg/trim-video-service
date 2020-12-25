import { ObjectID } from 'mongodb';
import { Readable } from 'stream';
import * as fs from 'fs';

import { trimTaskRepository } from '../repositories/trim-task';
import { TrimTaskStatusEnum, ITrimTask } from '../models/trim-task';
import { NotFound, BadRequest } from '../../api/errors';
import { API } from '../../config';

export const UPLOAD_FOLDER = 'uploads';

if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER);
}

interface ITrimTaskCreateParams {
  startTime: number;
  endTime: number;
  userId: ObjectID;
}

class TrimTaskService {
  public async create(params: ITrimTaskCreateParams): Promise<ITrimTask> {
    const trimTaskId = await trimTaskRepository.create({
      startTime: params.startTime,
      endTime: params.endTime,
      userId: params.userId,
      status: TrimTaskStatusEnum.CREATED,
      filePath: null,
      processedFilePath: null,
      processingError: null,
    });

    return trimTaskRepository.findOne({
      _id: trimTaskId,
    });
  }

  public async findByUserId(userId: ObjectID): Promise<ITrimTask[]> {
    const trimTasks = await trimTaskRepository.find({
      userId,
    });

    return Promise.all(
      trimTasks.map(trimTask => {
        return {
          ...trimTask,
          duration: trimTask.endTime - trimTask.startTime,
          link: `${
            API.EXTERNAL_URL
          }/v1/trim-task/${trimTask._id.toHexString()}`,
        };
      }),
    );
  }

  public async getVideoFile(
    taskId: string,
    userId: ObjectID,
  ): Promise<Readable> {
    const trimTask = await trimTaskRepository.findOne({
      _id: new ObjectID(taskId),
      userId,
    });

    if (!trimTask) {
      throw new NotFound('Task not found.');
    }

    if (!trimTask.processedFilePath) {
      throw new NotFound('File not found.');
    }

    return fs.createReadStream(trimTask.processedFilePath);
  }

  public async findNextTasks(limit: number) {
    return trimTaskRepository.find(
      {
        status: TrimTaskStatusEnum.READY,
      },
      limit,
    );
  }

  public async setStatus(taskId: ObjectID, data: Partial<ITrimTask>) {
    return trimTaskRepository.updateOne(
      {
        _id: taskId,
      },
      data,
    );
  }

  public async restartTask(taskId: string, userId: ObjectID) {
    const trimTask = await trimTaskRepository.findOne({
      _id: new ObjectID(taskId),
      userId,
    });

    if (!trimTask) {
      throw new NotFound('Task not found.');
    }

    if (trimTask.status !== TrimTaskStatusEnum.FAILED) {
      throw new BadRequest('Can restart failed tasks only.');
    }

    await trimTaskRepository.updateOne(
      {
        _id: new ObjectID(taskId),
      },
      {
        status: TrimTaskStatusEnum.READY,
      },
    );
  }

  public async uploadFile(
    taskId: string,
    userId: ObjectID,
    readStream: Readable,
  ) {
    const trimTask = await trimTaskRepository.findOne({
      _id: new ObjectID(taskId),
      userId,
    });

    if (!trimTask) {
      throw new NotFound('Task not found.');
    }

    if (trimTask.filePath) {
      throw new BadRequest('File already exists.');
    }

    const filePath = await this.storeFile(taskId, readStream);

    await trimTaskRepository.updateOne(
      {
        _id: new ObjectID(taskId),
      },
      {
        filePath,
        status: TrimTaskStatusEnum.READY,
      },
    );
  }

  public async storeFile(
    taskId: string,
    readStream: Readable,
  ): Promise<string> {
    const filePath = `${UPLOAD_FOLDER}/trim_task_${taskId}_${Date.now()}`;

    const writeStream = fs.createWriteStream(filePath);

    readStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('error', reject);

      writeStream.on('close', resolve);

      readStream.on('error', reject);

      readStream.on('end', resolve);
    });

    return filePath;
  }
}

export const trimTaskService = new TrimTaskService();
