// src/services/userService.ts
import UserModel from "../models/users.js";
import { isValidObjectId, type Types } from "mongoose";

type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  google_id?: string;
  password?: string;
  cv_url?: string;
  is_admin: boolean;
  team?: Types.ObjectId;
};

export async function getUserById(id: string) {
  if (!isValidObjectId(id)) return null;
  return UserModel.findById(id).lean<UserLean>().exec();
}

export async function updateUser(id: string, data: Partial<UserLean>) {
  if (!isValidObjectId(id)) return null;
  return UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .lean<UserLean>()
    .exec();
}

export async function deleteUser(id: string) {
  if (!isValidObjectId(id)) return null;
  return UserModel.findByIdAndDelete(id).lean<UserLean>().exec();
}

export async function getAllUsersShort() {
  return UserModel.find({}, { name: 1, email: 1 })
    .lean<Pick<UserLean, "_id" | "name" | "email">>()
    .exec();
}
