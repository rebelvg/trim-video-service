import * as uuid from 'uuid/v4';

import { IUser } from '../models/user';
import { getMongoDb } from '../../mongo';
import { Collection, ObjectID } from 'mongodb';

class UserRepository {
  private collection: Collection<IUser>;

  private async connect() {
    if (this.collection) {
      return;
    }

    const mongoDb = await getMongoDb();

    this.collection = mongoDb.collection<IUser>('users');

    await this.collection.createIndex('token');
  }

  public async create(): Promise<ObjectID> {
    await this.connect();

    const result = await this.collection.insertOne({
      token: uuid(),
    });

    return result.insertedId;
  }

  public async findOne(params: Partial<IUser>): Promise<IUser> {
    await this.connect();

    return this.collection.findOne(params);
  }
}

export const userRepository = new UserRepository();
