import { MongoClient, Db } from 'mongodb';

import { config } from './config';

let mongoClientDb: Db;

async function getMongoClient(): Promise<MongoClient> {
  return new Promise(resolve => {
    MongoClient.connect(
      'mongodb://localhost/',
      { useNewUrlParser: true, useUnifiedTopology: true },
      async (err, client) => {
        if (err) {
          throw err;
        }

        return resolve(client);
      }
    );
  });
}

export async function getMongoDb(): Promise<Db> {
  if (mongoClientDb) {
    return mongoClientDb;
  }

  const mongoClient = await getMongoClient();

  mongoClientDb = mongoClient.db(config.db.name);

  return mongoClientDb;
}
