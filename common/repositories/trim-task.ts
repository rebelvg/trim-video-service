import { getMongoDb } from '../../mongo';
import { Collection, ObjectID } from 'mongodb';
import { ITrimTask, TrimTaskStatusEnum } from '../models/trim-task';

// add indexes

class TrimTaskRepository {
  private collection: Collection<ITrimTask>;

  private async connect() {
    if (this.collection) {
      return;
    }

    const mongoDb = await getMongoDb();

    this.collection = mongoDb.collection<ITrimTask>('trim_tasks');

    await this.collection.createIndex('userId');
  }

  public async create(params: ITrimTask): Promise<ObjectID> {
    await this.connect();

    const result = await this.collection.insertOne(params);

    return result.insertedId;
  }

  public async findOne(params: Partial<ITrimTask>): Promise<ITrimTask> {
    await this.connect();

    return this.collection.findOne(params);
  }

  public async find(
    params: Partial<ITrimTask>,
    limit: number = 0,
  ): Promise<ITrimTask[]> {
    await this.connect();

    return this.collection
      .find(params)
      .limit(limit)
      .toArray();
  }

  public async updateOne(params: Partial<ITrimTask>, data: Partial<ITrimTask>) {
    await this.connect();

    await this.collection.updateOne(params, {
      $set: data,
    });
  }
}

export const trimTaskRepository = new TrimTaskRepository();
