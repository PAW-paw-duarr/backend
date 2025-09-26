import mongoose from "mongoose";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import { ConfigModel } from "~/models/config.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import { TitleModel } from "~/models/titles.js";
import { UserModel } from "~/models/users.js";
import {
  serviceAdminDeleteSubmissionById,
  serviceAdminGetAllSubmissions,
  serviceAdminGetSubmissionById,
  serviceCreateASubmission,
  serviceGetAllSubmissions,
  serviceGetSubmissionById,
  serviceResponseSubmission,
} from "~/services/submissionService.js";
import {
  configData,
  createSubmissionPayload,
  submissionData,
  teamsData,
  titleData,
  userData,
} from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("SubmissionService", () => {
  const lengthSubmissionData = Object.keys(submissionData).length;

  beforeEach(async () => {
    await ConfigModel.create(configData);
    for (const user of Object.values(userData)) {
      await UserModel.create(user);
    }
    for (const team of Object.values(teamsData)) {
      await TeamModel.create(team);
    }
    for (const title of Object.values(titleData)) {
      await TitleModel.create(title);
    }
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("serviceGetAllSubmissions", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should return submissions where user's team is submitter or target", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetAllSubmissions(user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const data = result.data!;
      expect(data.length).toBeGreaterThan(0);

      // All returned submissions should involve the user's team
      for (const submission of data) {
        const isInvolved =
          submission.team_id === user!.team?.toString() ||
          submission.team_target_id === user!.team?.toString();
        expect(isInvolved).toBe(true);
      }
    });

    it("should return empty array when user has no related submissions", async () => {
      await SubmissionModel.deleteMany({});

      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetAllSubmissions(user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });

    it("should handle user without team", async () => {
      const userWithoutTeam = await UserModel.create({
        ...userData.teamMemberWithoutTitle,
        _id: new mongoose.Types.ObjectId(),
        username: "userWithoutTeam",
        email: "noteam@example.com",
        team: null,
      });

      const result = await serviceGetAllSubmissions(userWithoutTeam);
      expect(result.error).toBeDefined();
    });
  });

  describe("serviceGetSubmissionById", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should return submission when user's team is the submitter", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceGetSubmissionById(submissionId, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.id).toBe(submissionId);
      expect(result.data!.grand_design_url).toBe(
        submissionData.submissionFromTeamA.grand_design_url,
      );
    });

    it("should return submission when user's team is the target", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceGetSubmissionById(submissionId, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.id).toBe(submissionId);
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetSubmissionById("invalid-id", user!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid submission ID");
    });

    it("should return 404 for valid ObjectId but non-existent submission", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetSubmissionById(
        new mongoose.Types.ObjectId().toString(),
        user!,
      );

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Submission not found");
    });
  });

  describe("serviceCreateASubmission", () => {
    it("should create submission successfully for team leader", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceCreateASubmission(user!, createSubmissionPayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.grand_design_url).toBe(createSubmissionPayload.grand_design_url);
      expect(result.data!.accepted).toBeUndefined();

      // Verify submission was actually saved to database
      const savedSubmission = await SubmissionModel.findById(result.data!.id);
      expect(savedSubmission).toBeDefined();
      expect(savedSubmission!.grand_design_url).toBe(createSubmissionPayload.grand_design_url);
    });

    it("should return 401 for team member (non-leader)", async () => {
      const user = await UserModel.findById(userData.teamMemberWithoutTitle._id);

      const result = await serviceCreateASubmission(user!, createSubmissionPayload);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Only team leader can create submissions");
    });

    it("should return 400 when submitting to own team", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const payload = {
        ...createSubmissionPayload,
        team_target_id: user!.team!._id.toString(),
      };

      const result = await serviceCreateASubmission(user!, payload);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Cannot submit to your own team");
    });

    it("should return 400 for invalid target team ID", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const payload = {
        ...createSubmissionPayload,
        team_target_id: "invalid-id",
      };

      const result = await serviceCreateASubmission(user!, payload);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid target team ID");
    });

    it("should return 404 for non-existent target team", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const payload = {
        ...createSubmissionPayload,
        team_target_id: "68d609a45b5aff66b927d66c",
      };

      const result = await serviceCreateASubmission(user!, payload);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Target team not found");
    });

    it("should handle user without team", async () => {
      const userWithoutTeam = await UserModel.create({
        ...userData.teamMemberWithoutTitle,
        _id: new mongoose.Types.ObjectId(),
        username: "userWithoutTeam",
        email: "noteam@example.com",
        team: "68d60c2b8db55bb1adb15cbe",
      });

      const result = await serviceCreateASubmission(userWithoutTeam, createSubmissionPayload);
      expect(result.error).toBeDefined();
    });
  });

  describe("serviceResponseSubmission", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should accept submission successfully when user is target team leader", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceResponseSubmission(submissionId, user!, true);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.accepted).toBe(true);

      // Verify in database
      const updatedSubmission = await SubmissionModel.findById(submissionId);
      expect(updatedSubmission!.accepted).toBe(true);
    });

    it("should reject submission successfully when user is target team leader", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceResponseSubmission(submissionId, user!, false);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.accepted).toBe(false);
    });

    it("should return 401 when user is not target team leader", async () => {
      const user = await UserModel.findById(userData.teamMemberWithoutTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceResponseSubmission(submissionId, user!, true);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Only team leader can respond to submissions");
    });

    it("should return 401 for team member (non-leader) of target team", async () => {
      const user = await UserModel.findById(userData.teamMemberWithoutTitle._id);
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceResponseSubmission(submissionId, user!, true);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Only team leader can respond to submissions");
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);

      const result = await serviceResponseSubmission("invalid-id", user!, true);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid submission ID");
    });

    it("should return 404 for non-existent submission", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);

      const result = await serviceResponseSubmission(
        new mongoose.Types.ObjectId().toString(),
        user!,
        true,
      );

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Submission not found");
    });
  });

  describe("serviceAdminGetAllSubmissions", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should return all submissions regardless of team", async () => {
      const result = await serviceAdminGetAllSubmissions();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(lengthSubmissionData);
    });

    it("should return submissions in correct format", async () => {
      const result = await serviceAdminGetAllSubmissions();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const firstSubmission = result.data![0];
      expect(firstSubmission).toHaveProperty("id");
      expect(firstSubmission).toHaveProperty("team_id");
      expect(firstSubmission).toHaveProperty("team_target_id");
    });

    it("should return empty array when no submissions exist", async () => {
      await SubmissionModel.deleteMany({});

      const result = await serviceAdminGetAllSubmissions();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });
  });

  describe("serviceAdminGetSubmissionById", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should return submission with all details", async () => {
      const submissionId = submissionData.submissionFromTeamA._id!.toString();
      const result = await serviceAdminGetSubmissionById(submissionId);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.grand_design_url).toBeDefined();
      expect(result.data!.accepted).toBeDefined();
      expect(result.data!.id).toBe(submissionId);
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminGetSubmissionById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid submission ID");
    });

    it("should return 404 for valid ObjectId but non-existent submission", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminGetSubmissionById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Submission not found");
    });

    it("should return complete submission data structure", async () => {
      const submissionId = submissionData.submissionFromTeamA._id!.toString();
      const result = await serviceAdminGetSubmissionById(submissionId);

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const submission = result.data!;
      expect(submission.id).toBe(submissionData.submissionFromTeamA._id!.toString());
      expect(submission.team_id).toBe(submissionData.submissionFromTeamA.team.toString());
      expect(submission.team_target_id).toBe(
        submissionData.submissionFromTeamA.team_target.toString(),
      );
      expect(submission.grand_design_url).toBe(submissionData.submissionFromTeamA.grand_design_url);
      expect(submission.accepted).toBe(submissionData.submissionFromTeamA.accepted);
    });
  });

  describe("serviceAdminDeleteSubmissionById", () => {
    beforeEach(async () => {
      for (const submission of Object.values(submissionData)) {
        await SubmissionModel.create(submission);
      }
    });

    it("should delete submission successfully and return 204", async () => {
      const submissionId = submissionData.submissionFromTeamA._id!.toString();

      const result = await serviceAdminDeleteSubmissionById(submissionId);

      expect(result.success).toBe(204);

      // Verify submission was actually deleted
      const deletedSubmission = await SubmissionModel.findById(submissionId);
      expect(deletedSubmission).toBeNull();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminDeleteSubmissionById("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid submission ID");
    });

    it("should return 404 for valid ObjectId but non-existent submission", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminDeleteSubmissionById(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Submission not found");
    });

    it("should not affect other submissions when deleting one", async () => {
      const submissionToDelete = submissionData.submissionFromTeamA._id!.toString();
      const submissionToKeep = submissionData.submissionFromTeamB._id!.toString();

      await serviceAdminDeleteSubmissionById(submissionToDelete);

      const remainingSubmission = await SubmissionModel.findById(submissionToKeep);
      expect(remainingSubmission).toBeDefined();
    });
  });
});
