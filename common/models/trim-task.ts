import { ObjectID } from 'mongodb';

export enum TrimTaskStatusEnum {
  CREATED = 'created',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ITrimTask {
  _id?: ObjectID;
  userId: ObjectID;
  startTime: number;
  endTime: number;
  status: TrimTaskStatusEnum;
  filePath: string;
  processedFilePath: string;
  processingError: string;
}
