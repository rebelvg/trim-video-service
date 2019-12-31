import { ObjectID } from 'mongodb';

export interface IUser {
  _id?: ObjectID;
  token: string;
}
