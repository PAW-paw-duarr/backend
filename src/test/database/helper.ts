import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

export const connect = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log("Test MongoDB connected");
};

export const closeDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod?.stop();
    console.log("Test MongoDB connection closed");
  }
};

export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  console.log("Test MongoDB collections cleared");
};
