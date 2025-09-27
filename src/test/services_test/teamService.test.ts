import mongoose from "mongoose";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { ConfigModel } from "~/models/config.js";
import { TeamModel } from "~/models/teams.js";
import { TitleModel } from "~/models/titles.js";
import { UserModel } from "~/models/users.js";
import {
  serviceAdminCreateTeams,
  serviceAdminDeleteTeamById,
  serviceAdminGetAllTeams,
  serviceAdminGetTeamById,
  serviceGetTeamById,
  serviceJoinTeam,
} from "~/services/teamService.js";
import { CategoryCapstone } from "~/utils/constants.js";
import { configData, createTeamPayload, teamsData, titleData, userData } from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("TeamService", () => {
  const lengthTeamsData = Object.keys(teamsData).length;

  beforeEach(async () => {
    await ConfigModel.create(configData);
    for (const user of Object.values(userData)) {
      await UserModel.create(user);
    }
    for (const title of Object.values(titleData)) {
      await TitleModel.create(title);
    }
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("serviceGetTeamById", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should return team details with title when team has title", async () => {
      const result = await serviceGetTeamById(teamsData.teamWithTitleCurrentPeriod._id!.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeDefined();
      expect(result.data!.id).toBe(teamsData.teamWithTitleCurrentPeriod._id!.toString());
    });

    it("should return team details without title when team has no title", async () => {
      const result = await serviceGetTeamById(teamsData.teamWithoutTitle._id!.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeUndefined();
      expect(result.data!.id).toBe(teamsData.teamWithoutTitle._id!.toString());
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceGetTeamById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid team ID");
    });

    it("should return 404 for valid ObjectId but non-existent team", async () => {
      const result = await serviceGetTeamById(new mongoose.Types.ObjectId().toString());

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });
  });

  describe("serviceJoinTeam", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should join team successfully for user without team", async () => {
      const user = await UserModel.findById(userData.userWithoutTeam._id);

      const result = await serviceJoinTeam(teamsData.teamWithoutTitle.code, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data.id).toBe(teamsData.teamWithoutTitle._id!.toString());

      const updatedUser = await UserModel.findById(user!._id);
      expect(updatedUser!.team!.toString()).toBe(teamsData.teamWithoutTitle._id!.toString());
    });

    it("should return 400 if user already has a team", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceJoinTeam(teamsData.teamWithoutTitle.code, user!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("User already has a team");
    });

    it("should return 404 if team code does not exist", async () => {
      const user = await UserModel.findById(userData.userWithoutTeam._id);

      const result = await serviceJoinTeam("invalid", user!);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });
  });

  describe("serviceAdminGetAllTeams", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should return all teams regardless of period", async () => {
      const result = await serviceAdminGetAllTeams();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(lengthTeamsData);
    });

    it("should return teams in correct format", async () => {
      const result = await serviceAdminGetAllTeams();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const firstTeam = result.data![0];
      expect(firstTeam).toHaveProperty("id");
      expect(firstTeam).toHaveProperty("name");
      expect(firstTeam).toHaveProperty("category");
      expect(firstTeam).toHaveProperty("code");
      expect(firstTeam).toHaveProperty("period");
    });

    it("should return empty array when no teams exist", async () => {
      await TeamModel.deleteMany({});

      const result = await serviceAdminGetAllTeams();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });
  });

  describe("serviceAdminGetTeamById", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should return team with complete details", async () => {
      const result = await serviceAdminGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.id).toBe(teamsData.teamWithTitleCurrentPeriod._id!.toString());
      expect(result.data!.title_id).toBeDefined();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminGetTeamById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid team ID");
    });

    it("should return 404 for valid ObjectId but non-existent team", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminGetTeamById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });

    it("should return complete team data structure", async () => {
      const result = await serviceAdminGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const team = result.data!;
      expect(team).toHaveProperty("id");
      expect(team).toHaveProperty("name");
      expect(team).toHaveProperty("category");
      expect(team).toHaveProperty("code");
      expect(team).toHaveProperty("period");
      expect(team).toHaveProperty("leader_email");
    });
  });

  describe("serviceAdminDeleteTeamById", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should delete team successfully and return 204", async () => {
      const teamId = teamsData.teamWithoutTitle._id!.toString();

      const result = await serviceAdminDeleteTeamById(teamId);

      expect(result.success).toBe(204);

      const deletedTeam = await TeamModel.findById(teamId);
      expect(deletedTeam).toBeNull();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminDeleteTeamById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid team ID");
    });

    it("should return 404 for valid ObjectId but non-existent team", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminDeleteTeamById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });

    it("should not affect other teams when deleting one", async () => {
      const teamToDelete = teamsData.teamWithoutTitle._id!.toString();
      const teamToKeep = teamsData.teamWithTitleCurrentPeriod._id!.toString();

      await serviceAdminDeleteTeamById(teamToDelete);

      const remainingTeam = await TeamModel.findById(teamToKeep);
      expect(remainingTeam).toBeDefined();
    });
  });

  describe("serviceAdminCreateTeams", () => {
    it("should create teams successfully with valid payload", async () => {
      const result = await serviceAdminCreateTeams(createTeamPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data).toBeDefined();
      expect(result.data!.success_count).toBe(2);
      expect(result.data!.error_count).toBe(0);
      expect(result.data!.data).toBeDefined();
      expect(result.data!.data).toHaveLength(2);
      expect(result.data!.error_data).toBeUndefined();

      const firstTeam = result.data!.data![0];
      expect(firstTeam.name).toBe(createTeamPayload[0].name);
      expect(firstTeam.leader_email).toBe(createTeamPayload[0].leader_email);
      expect(firstTeam.category).toBe(createTeamPayload[0].category);
      expect(firstTeam.code).toBeDefined();
      expect(firstTeam.period).toBe(configData.current_period);

      const createdTeam1 = await TeamModel.findById(firstTeam.id);
      expect(createdTeam1).toBeDefined();
      expect(createdTeam1!.name).toBe(createTeamPayload[0].name);

      const createdTeam2 = await TeamModel.findById(result.data!.data![1].id);
      expect(createdTeam2).toBeDefined();
      expect(createdTeam2!.name).toBe(createTeamPayload[1].name);
    });

    it("should create teams with new period when new_period is true", async () => {
      const result = await serviceAdminCreateTeams(createTeamPayload, true);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.success_count).toBe(2);
      expect(result.data!.data![0].period).toBe(configData.current_period + 1);

      const updatedConfig = await ConfigModel.findOne({ config_id: 1 });
      expect(updatedConfig!.current_period).toBe(configData.current_period + 1);
    });

    it("should use current period when new_period is false or undefined", async () => {
      const result = await serviceAdminCreateTeams(createTeamPayload, false);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.data![0].period).toBe(configData.current_period);

      const config = await ConfigModel.findOne({ config_id: 1 });
      expect(config!.current_period).toBe(configData.current_period);
    });

    it("should handle duplicate team names gracefully", async () => {
      await TeamModel.create({
        name: "Duplicate Team",
        leader_email: userData.teamLeaderWithTitle.email,
        category: CategoryCapstone.Kesehatan,
        period: configData.current_period,
        code: "DUPLICATE123",
      });

      const duplicatePayload = [
        {
          name: "Duplicate Team",
          leader_email: userData.userWithoutTeam.email,
          category: CategoryCapstone.Kesehatan,
        },
        {
          name: "Unique Team",
          leader_email: userData.adminUser.email,
          category: CategoryCapstone.SmartCity,
        },
      ];

      const result = await serviceAdminCreateTeams(duplicatePayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.success_count + result.data!.error_count).toBe(2);
    });

    it("should handle empty payload array", async () => {
      const result = await serviceAdminCreateTeams([]);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.success_count).toBe(0);
      expect(result.data!.error_count).toBe(0);
      expect(result.data!.data).toBeUndefined();
      expect(result.data!.error_data).toBeUndefined();
    });
  });
});
