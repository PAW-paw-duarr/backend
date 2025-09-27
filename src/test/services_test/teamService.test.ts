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
  serviceGetTeamById,
  serviceJoinTeam,
  serviceKickMemberTeam,
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

    it("should return team details with title and code when user is team member", async () => {
      const currentUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeDefined();
      expect(result.data!.id).toBe(teamsData.teamWithTitleCurrentPeriod._id!.toString());
      expect(result.data!.code).toBeDefined(); // Code should be visible to team members
      expect(result.data!.member).toBeDefined();
      expect(Array.isArray(result.data!.member)).toBe(true);
    });

    it("should return team details with title and code when user is admin", async () => {
      const currentUser = await UserModel.findById(userData.adminUser._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeDefined();
      expect(result.data!.id).toBe(teamsData.teamWithTitleCurrentPeriod._id!.toString());
      expect(result.data!.code).toBeDefined(); // Code should be visible to team members
      expect(result.data!.member).toBeDefined();
      expect(Array.isArray(result.data!.member)).toBe(true);
    });

    it("should return team details without code when user is not team member", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeDefined();
      expect(result.data!.id).toBe(teamsData.teamWithTitleCurrentPeriod._id!.toString());
      expect(result.data!.code).toBeUndefined(); // Code should be hidden from non-members
      expect(result.data!.member).toBeDefined();
    });

    it("should return team details without title when team has no title", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithoutTitle._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.title_id).toBeUndefined();
      expect(result.data!.id).toBe(teamsData.teamWithoutTitle._id!.toString());
      expect(result.data!.member).toBeDefined();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceGetTeamById("invalid-id", currentUser!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid team ID");
    });

    it("should return 404 for valid ObjectId but non-existent team", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceGetTeamById(
        new mongoose.Types.ObjectId().toString(),
        currentUser!,
      );

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });

    it("should include member list in team details", async () => {
      const currentUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.member).toBeDefined();
      expect(Array.isArray(result.data!.member)).toBe(true);

      if (result.data!.member!.length > 0) {
        const firstMember = result.data!.member![0];
        expect(firstMember).toHaveProperty("id");
        expect(firstMember).toHaveProperty("name");
      }
    });

    it("should return team details with all required fields populated", async () => {
      const currentUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      const team = result.data!;

      expect(team.id).toBeDefined();
      expect(team.name).toBeDefined();
      expect(team.leader_email).toBeDefined();
      expect(team.category).toBeDefined();
      expect(team.period).toBeDefined();
      expect(team.code).toBeDefined();
      expect(team.member).toBeDefined();
    });

    it("should handle teams with multiple members correctly", async () => {
      const additionalMember = await UserModel.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Additional Member",
        email: "additional@test.com",
        team: teamsData.teamWithTitleCurrentPeriod._id,
        is_admin: false,
      });

      const currentUser = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.member).toHaveLength(3);

      result.data!.member!.forEach((member) => {
        expect(member).toHaveProperty("id");
        expect(member).toHaveProperty("name");
        expect(typeof member.id).toBe("string");
        expect(typeof member.name).toBe("string");
      });

      await UserModel.findByIdAndDelete(additionalMember._id);
    });

    it("should handle team with no members gracefully", async () => {
      const emptyTeam = await TeamModel.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Empty Team",
        leader_email: "empty@test.com",
        category: CategoryCapstone.Kesehatan,
        period: configData.current_period,
        code: "EMPTY123",
      });

      const currentUser = await UserModel.findById(userData.adminUser._id);
      const result = await serviceGetTeamById(emptyTeam._id.toString(), currentUser!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.member).toEqual([]);
    });

    it("should handle malformed ObjectId that passes validation", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const malformedId = "123456789012345678901234"; // Valid length but non-existent

      const result = await serviceGetTeamById(malformedId, currentUser!);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Team not found");
    });

    it("should properly hide code field for non-members and non-admins", async () => {
      const currentUser = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceGetTeamById(
        teamsData.teamWithTitleCurrentPeriod._id!.toString(),
        currentUser!,
      );

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.code).toBeUndefined();
      expect("code" in result.data!).toBe(false);
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

    it("should return complete team data after successful join", async () => {
      const user = await UserModel.findById(userData.userWithoutTeam._id);
      const result = await serviceJoinTeam(teamsData.teamWithoutTitle.code, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const teamData = result.data;
      expect(teamData.id).toBe(teamsData.teamWithoutTitle._id!.toString());
      expect(teamData.name).toBe(teamsData.teamWithoutTitle.name);
      expect(teamData.leader_email).toBe(teamsData.teamWithoutTitle.leader_email);
      expect(teamData.category).toBe(teamsData.teamWithoutTitle.category);
      expect(teamData.period).toBe(teamsData.teamWithoutTitle.period);
      expect(teamData.code).toBe(teamsData.teamWithoutTitle.code);
    });

    it("should verify user team assignment persists", async () => {
      const user = await UserModel.findById(userData.userWithoutTeam._id);
      const teamCode = teamsData.teamWithoutTitle.code;

      await serviceJoinTeam(teamCode, user!);

      const updatedUser = await UserModel.findById(user!._id);
      expect(updatedUser!.team!.toString()).toBe(teamsData.teamWithoutTitle._id!.toString());
    });
  });

  describe("serviceKickMemberTeam", () => {
    beforeEach(async () => {
      for (const team of Object.values(teamsData)) {
        await TeamModel.create(team);
      }
    });

    it("should return 400 for invalid user ID format", async () => {
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceKickMemberTeam("invalid-id", leader!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid user ID");
    });

    it("should return 401 when user tries to kick themselves", async () => {
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceKickMemberTeam(leader!._id.toString(), leader!);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("You cannot kick this member");
    });

    it("should return 401 when non-leader tries to kick a member", async () => {
      const nonLeader = await UserModel.findById(userData.teamMemberWithTitle._id);
      const targetUser = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceKickMemberTeam(targetUser!._id.toString(), nonLeader!);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("You cannot kick this member");
    });

    it("should return 404 when trying to kick non-existent user", async () => {
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const result = await serviceKickMemberTeam(nonExistentId, leader!);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Member Not Found");
    });

    it("should successfully kick a team member", async () => {
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const memberToKick = await UserModel.findById(userData.teamMemberWithTitle._id);

      expect(memberToKick!.team).toBeDefined();

      const result = await serviceKickMemberTeam(memberToKick!._id.toString(), leader!);

      expect(result.success).toBe(204);

      const updatedMember = await UserModel.findById(memberToKick!._id);
      expect(updatedMember!.team).toBeUndefined();
    });

    it("should handle user with no team trying to kick", async () => {
      const userWithoutTeam = await UserModel.findById(userData.userWithoutTeam._id);
      const targetUser = await UserModel.findById(userData.teamMemberWithTitle._id);

      const result = await serviceKickMemberTeam(targetUser!._id.toString(), userWithoutTeam!);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("You cannot kick this member");
    });

    it("should handle kicking user from different team", async () => {
      const anotherTeam = await TeamModel.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Another Team",
        leader_email: "another@test.com",
        category: CategoryCapstone.SmartCity,
        period: configData.current_period,
        code: "ANOTHER123",
      });

      const anotherLeader = await UserModel.create({
        _id: new mongoose.Types.ObjectId(),
        name: "Another Leader",
        email: "another@test.com",
        team: anotherTeam._id,
        is_admin: false,
      });

      const memberToKick = await UserModel.findById(userData.teamMemberWithTitle._id);
      const result = await serviceKickMemberTeam(memberToKick!._id.toString(), anotherLeader);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("You cannot kick this member");
    });

    it("should verify team reference removal persists", async () => {
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const memberToKick = await UserModel.findById(userData.teamMemberWithTitle._id);

      await serviceKickMemberTeam(memberToKick!._id.toString(), leader!);

      const updatedMember1 = await UserModel.findById(memberToKick!._id);
      expect(updatedMember1!.team).toBeUndefined();

      const updatedMember2 = await UserModel.findById(memberToKick!._id);
      expect(updatedMember2!.team).toBeUndefined();
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

    it("should validate all team fields are properly formatted", async () => {
      const result = await serviceAdminGetAllTeams();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      result.data!.forEach((team) => {
        expect(team.id).toBeDefined();
        expect(team.name).toBeDefined();
        expect(team.leader_email).toBeDefined();
        expect(team.category).toBeDefined();
        expect(team.period).toBeDefined();
        expect(team.code).toBeDefined();
      });
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

    it("should remove team reference from users when team is deleted", async () => {
      const teamId = teamsData.teamWithTitleCurrentPeriod._id!.toString();
      const leader = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const member = await UserModel.findById(userData.teamMemberWithTitle._id);

      // Ensure users are part of the team before deletion
      expect(leader!.team!.toString()).toBe(teamId);
      expect(member!.team!.toString()).toBe(teamId);

      await serviceAdminDeleteTeamById(teamId);

      const updatedLeader = await UserModel.findById(leader!._id);
      const updatedMember = await UserModel.findById(member!._id);

      expect(updatedLeader!.team).toBeUndefined();
      expect(updatedMember!.team).toBeUndefined();
    });

    it("should verify complete team removal from database", async () => {
      const teamId = teamsData.teamWithoutTitle._id!.toString();

      const teamBefore = await TeamModel.findById(teamId);
      expect(teamBefore).toBeDefined();

      await serviceAdminDeleteTeamById(teamId);

      const teamAfter = await TeamModel.findById(teamId);
      expect(teamAfter).toBeNull();

      const allTeams = await TeamModel.find({});
      expect(allTeams.find((t) => t._id.toString() === teamId)).toBeUndefined();
    });

    it("should preserve database integrity after deletion", async () => {
      const teamId = teamsData.teamWithoutTitle._id!.toString();
      const initialTeamCount = await TeamModel.countDocuments();
      const initialUserCount = await UserModel.countDocuments();

      await serviceAdminDeleteTeamById(teamId);

      const finalTeamCount = await TeamModel.countDocuments();
      const finalUserCount = await UserModel.countDocuments();

      expect(finalTeamCount).toBe(initialTeamCount - 1);
      expect(finalUserCount).toBe(initialUserCount); // Users should not be deleted
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

    it("should handle mixed success and error scenarios", async () => {
      const mixedPayload = [
        ...createTeamPayload, // Valid teams
        {
          name: "", // Invalid - empty name
          leader_email: "invalid-email", // Invalid email format
          category: CategoryCapstone.Kesehatan,
        },
        {
          name: "Valid Team",
          leader_email: "valid@test.com",
          // biome-ignore lint/suspicious/noExplicitAny: test
          category: "InvalidCategory" as any, // Invalid category
        },
      ];

      const result = await serviceAdminCreateTeams(mixedPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.success_count + result.data!.error_count).toBe(4);
      expect(result.data!.success_count).toBeGreaterThan(0);
      expect(result.data!.error_count).toBeGreaterThan(0);
      expect(result.data!.data).toBeDefined();
      expect(result.data!.error_data).toBeDefined();
    });

    it("should generate unique codes for all teams", async () => {
      const largePayload = Array(50)
        .fill(null)
        .map((_, i) => ({
          name: `Team ${i}`,
          leader_email: `leader${i}@test.com`,
          category: CategoryCapstone.Kesehatan,
        }));

      const result = await serviceAdminCreateTeams(largePayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);

      if (result.data!.data) {
        const codes = result.data!.data.map((team) => team.code);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length); // All codes should be unique

        // Verify code format (UUID without dashes)
        codes.forEach((code) => {
          expect(code).toMatch(/^[a-f0-9]{32}$/);
        });
      }
    });

    it("should handle all teams failing validation", async () => {
      const invalidPayload = [
        {
          name: "",
          leader_email: "invalid",
          // biome-ignore lint/suspicious/noExplicitAny: test
          category: "invalid" as any,
        },
        {
          name: "",
          leader_email: "also-invalid",
          // biome-ignore lint/suspicious/noExplicitAny: test
          category: "also-invalid" as any,
        },
      ];

      const result = await serviceAdminCreateTeams(invalidPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.success_count).toBe(0);
      expect(result.data!.error_count).toBe(2);
      expect(result.data!.data).toBeUndefined();
      expect(result.data!.error_data).toBeDefined();
      expect(result.data!.error_data).toHaveLength(2);
    });

    it("should maintain period consistency across all created teams", async () => {
      const result = await serviceAdminCreateTeams(createTeamPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);

      if (result.data!.data) {
        const periods = result.data!.data.map((team) => team.period);
        const uniquePeriods = new Set(periods);
        expect(uniquePeriods.size).toBe(1); // All teams should have same period
        expect(periods[0]).toBe(configData.current_period);
      }
    });

    it("should validate error data structure", async () => {
      const invalidPayload = [
        {
          name: "",
          leader_email: "invalid-email",
          category: CategoryCapstone.Kesehatan,
        },
      ];

      const result = await serviceAdminCreateTeams(invalidPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);

      if (result.data!.error_data) {
        const errorItem = result.data!.error_data[0];
        expect(errorItem).toHaveProperty("name");
        expect(errorItem).toHaveProperty("leader_email");
        expect(errorItem).toHaveProperty("category");
        expect(errorItem).toHaveProperty("error");
        expect(typeof errorItem.error).toBe("string");
      }
    });
  });
});
