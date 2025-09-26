import mongoose from "mongoose";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import type { components } from "~/lib/api/schema.js";
import { ConfigModel } from "~/models/config.js";
import { TeamModel } from "~/models/teams.js";
import { UserModel } from "~/models/users.js";
import {
  serviceAdminGetAllUsers,
  serviceDeleteUserById,
  serviceGetUserById,
  serviceUpdateUser,
} from "~/services/userService.js";
import { configData, teamsData, updateUserPayload, userData } from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("UserService", () => {
  const lengthUserData = Object.keys(userData).length;

  beforeEach(async () => {
    await ConfigModel.create(configData);
    for (const team of Object.values(teamsData)) {
      await TeamModel.create(team);
    }
    for (const user of Object.values(userData)) {
      await UserModel.create(user);
    }
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("serviceGetUserById", () => {
    it("should return user data when valid ID is provided", async () => {
      const userId = userData.teamLeaderWithTitle._id!.toString();
      const result = await serviceGetUserById(userId);

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const expectedUser: components["schemas"]["data-user"] = {
        id: userData.teamLeaderWithTitle._id!.toString(),
        email: userData.teamLeaderWithTitle.email!,
        name: userData.teamLeaderWithTitle.name,
        cv_url: userData.teamLeaderWithTitle.cv_url,
        google_id: userData.teamLeaderWithTitle.google_id,
        team_id: userData.teamLeaderWithTitle.team!.toString(),
      };

      expect(result.data).toEqual(expectedUser);
    });

    it("should return user without team_id when user has no team", async () => {
      const userId = userData.userWithoutTeam._id!.toString();
      const result = await serviceGetUserById(userId);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.team_id).toBeUndefined();
      expect(result.data!.id).toBe(userId);
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceGetUserById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid user ID");
    });

    it("should return 404 for valid ObjectId but non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceGetUserById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("User not found");
    });

    it("should handle user with google_id", async () => {
      // Create user with google_id
      const userWithGoogle = await UserModel.create({
        ...userData.userWithoutTeam,
        _id: new mongoose.Types.ObjectId(),
        email: "google@mail.com",
        google_id: "google_123456",
      });

      const result = await serviceGetUserById(userWithGoogle._id.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.google_id).toBe("google_123456");
    });
  });

  describe("serviceUpdateUser", () => {
    it("should update user successfully with valid data", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceUpdateUser(user!, updateUserPayload);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.name).toBe(updateUserPayload.name);
      expect(result.data!.email).toBe(updateUserPayload.email);
      expect(result.data!.cv_url).toBe(updateUserPayload.cv_url);

      // Verify user was actually updated in database
      const updatedUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      expect(updatedUser!.name).toBe(updateUserPayload.name);
      expect(updatedUser!.email).toBe(updateUserPayload.email);
    });

    it("should partially update user fields", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const partialUpdate = { name: "Partially Updated Name" };

      const result = await serviceUpdateUser(user!, partialUpdate);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.name).toBe("Partially Updated Name");
      expect(result.data!.email).toBe(userData.teamLeaderWithTitle.email); // Should remain unchanged
    });

    it("should update password field", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const passwordUpdate = { password: "newPassword123" };

      const result = await serviceUpdateUser(user!, passwordUpdate);

      expect(result.success).toBe(200);
      assert(result.success === 200);

      // Verify password was updated in database
      const updatedUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      expect(updatedUser!.password).toBe("newPassword123");
    });

    it("should handle empty update payload", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceUpdateUser(user!, {});

      expect(result.success).toBe(200);
      assert(result.success === 200);
      // Data should remain unchanged
      expect(result.data!.name).toBe(userData.teamLeaderWithTitle.name);
      expect(result.data!.email).toBe(userData.teamLeaderWithTitle.email);
    });
  });

  describe("serviceDeleteUserById", () => {
    it("should delete user successfully and return 204", async () => {
      const userId = userData.userWithoutTeam._id!.toString();

      const result = await serviceDeleteUserById(userId);

      expect(result.success).toBe(204);

      // Verify user was actually deleted
      const deletedUser = await UserModel.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceDeleteUserById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid user ID");
    });

    it("should return 404 for valid ObjectId but non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceDeleteUserById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("User not found");
    });

    it("should not affect other users when deleting one", async () => {
      const userToDelete = userData.userWithoutTeam._id!.toString();
      const userToKeep = userData.teamLeaderWithTitle._id!.toString();

      await serviceDeleteUserById(userToDelete);

      const remainingUser = await UserModel.findById(userToKeep);
      expect(remainingUser).toBeDefined();
      expect(remainingUser!.name).toBe(userData.teamLeaderWithTitle.name);
    });

    it("should delete user with team association", async () => {
      const userId = userData.teamLeaderWithTitle._id!.toString();

      const result = await serviceDeleteUserById(userId);

      expect(result.success).toBe(204);

      // Verify user was deleted
      const deletedUser = await UserModel.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe("serviceAdminGetAllUsers", () => {
    it("should return all users in short format", async () => {
      const result = await serviceAdminGetAllUsers();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(lengthUserData);
    });

    it("should return users in correct short format", async () => {
      const result = await serviceAdminGetAllUsers();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const firstUser = result.data![0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).not.toHaveProperty("email");
      expect(firstUser).not.toHaveProperty("password");
      expect(firstUser).not.toHaveProperty("cv_url");
    });

    it("should return empty array when no users exist", async () => {
      await UserModel.deleteMany({});

      const result = await serviceAdminGetAllUsers();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });

    it("should include all user types (admin, team members, users without teams)", async () => {
      const result = await serviceAdminGetAllUsers();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const userIds = result.data!.map((user) => user.id);
      expect(userIds).toContain(userData.adminUser._id!.toString());
      expect(userIds).toContain(userData.teamLeaderWithTitle._id!.toString());
      expect(userIds).toContain(userData.userWithoutTeam._id!.toString());
    });

    it("should return users with correct names", async () => {
      const result = await serviceAdminGetAllUsers();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const adminUserData = result.data!.find(
        (user) => user.id === userData.adminUser._id!.toString(),
      );
      expect(adminUserData?.name).toBe(userData.adminUser.name);

      const teamLeaderData = result.data!.find(
        (user) => user.id === userData.teamLeaderWithTitle._id!.toString(),
      );
      expect(teamLeaderData?.name).toBe(userData.teamLeaderWithTitle.name);
    });
  });
});
