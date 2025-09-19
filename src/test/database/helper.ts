import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ConfigModel } from "~/models/config.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import { TitleModel } from "~/models/titles.js";
import { UserModel } from "~/models/users.js";

let mongod: MongoMemoryServer;

export async function connect(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function closeDatabase(): Promise<void> {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod?.stop();
  }
}

export async function clearDatabase(): Promise<void> {
  await ConfigModel.deleteMany({});
  await SubmissionModel.deleteMany({});
  await TeamModel.deleteMany({});
  await TitleModel.deleteMany({});
  await UserModel.deleteMany({});
}
