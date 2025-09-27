import mongoose from "mongoose";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import type { components } from "~/lib/api/schema.js";
import { ConfigModel } from "~/models/config.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import { TitleModel } from "~/models/titles.js";
import { UserModel } from "~/models/users.js";
import {
  serviceAdminDeleteTitleByID,
  serviceAdminGetAllTitles,
  serviceAdminGetTitleByID,
  serviceCreateTitle,
  serviceGetAllTitles,
  serviceGetTitleByID,
  serviceUpdateTitle,
} from "~/services/titleService.js";
import {
  configData,
  createTitlePayload,
  teamsData,
  titleData,
  userData,
} from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("TitleService", () => {
  const lengthTitleData = Object.keys(titleData).length;
  const lengthTitlePrevPeriod = Object.values(titleData).filter(
    (t) => t.period === configData.current_period - 1,
  ).length;

  beforeEach(async () => {
    await ConfigModel.create(configData);
    for (const user of Object.values(userData)) {
      await UserModel.create(user);
    }
    for (const team of Object.values(teamsData)) {
      await TeamModel.create(team);
    }
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("serviceGetAllTitles", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should return titles from previous period only", async () => {
      const result = await serviceGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(lengthTitlePrevPeriod);

      const expectedTitle: components["schemas"]["data-title-short"] = {
        id: titleData.previousPeriodTitle._id?.toString(),
        title: titleData.previousPeriodTitle.title,
        desc: titleData.previousPeriodTitle.desc,
        photo_url: titleData.previousPeriodTitle.photo_url,
      };
      expect(data[0]).toEqual(expectedTitle);
    });

    it("should return empty array when no titles from previous period exist", async () => {
      await TitleModel.deleteMany({ period: configData.current_period - 1 });

      const result = await serviceGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });

    it("should not include current period titles", async () => {
      const result = await serviceGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const currentPeriodTitles = result.data!.filter(
        (title) => title.id === titleData.currentPeriodTitle._id?.toString(),
      );
      expect(currentPeriodTitles).toHaveLength(0);
    });
  });

  describe("serviceGetTitleByID", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should return title with proposal_url for owner team member", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTitleByID(titleData.currentPeriodTitle._id!.toString(), user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.proposal_url).toBeDefined();
      expect(result.data!.id).toBe(titleData.currentPeriodTitle._id!.toString());
    });

    it("should return title without proposal_url for non-owner", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const result = await serviceGetTitleByID(titleData.currentPeriodTitle._id!.toString(), user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.proposal_url).toBeUndefined();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTitleByID("invalid-id", user!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for valid ObjectId but non-existent title", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const result = await serviceGetTitleByID(new mongoose.Types.ObjectId().toString(), user!);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });

    it("should handle user with accepted submission correctly", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const titleId = titleData.currentPeriodTitle._id!.toString();

      await SubmissionModel.create({
        team: user!.team?._id,
        team_target: teamsData.teamWithTitleCurrentPeriod._id,
        accepted: true,
        grand_design_url: "https://example.com/design.pdf",
        period: configData.current_period,
      });

      const result = await serviceGetTitleByID(titleId, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.proposal_url).toBeDefined();
    });

    it("should not show proposal_url for user with non-accepted submission", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);
      const titleId = titleData.currentPeriodTitle._id!.toString();

      await SubmissionModel.create({
        team: user!.team?._id,
        team_target: teamsData.teamWithTitleCurrentPeriod._id,
        accepted: false,
        grand_design_url: "https://example.com/design.pdf",
        period: configData.current_period,
      });

      const result = await serviceGetTitleByID(titleId, user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.proposal_url).toBeUndefined();
    });

    it("should handle malformed ObjectId variations", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const invalidIds = ["", "123", "invalid-id-format", "61234567890123456789012g"];

      for (const invalidId of invalidIds) {
        const result = await serviceGetTitleByID(invalidId, user!);
        expect(result.error?.status).toBe(400);
      }
    });
  });

  describe("serviceCreateTitle", () => {
    it("should create title successfully for team leader without existing title", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);

      const result = await serviceCreateTitle(user!, createTitlePayload);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data).toEqual({ id: result.data.id, ...createTitlePayload });

      const savedTitle = await TitleModel.findById(result.data.id);
      expect(savedTitle).toBeDefined();
      expect(savedTitle!.title).toBe(createTitlePayload.title);
    });

    it("should return 401 for team member (non-leader)", async () => {
      const user = await UserModel.findById(userData.teamMemberWithoutTitle._id);

      const result = await serviceCreateTitle(user!, createTitlePayload);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Only team leader can create title");
    });

    it("should return 400 if team already has a title for current period", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithoutTitle._id);

      const firstResult = await serviceCreateTitle(user!, createTitlePayload);
      expect(firstResult.success).toBe(201);

      const secondResult = await serviceCreateTitle(user!, createTitlePayload);
      expect(secondResult.error?.status).toBe(400);
      expect(secondResult.data).toBe("Team already has a title");
    });

    it("should handle user without team", async () => {
      const userWithoutTeam = await UserModel.create({
        ...userData.teamMemberWithoutTitle,
        _id: new mongoose.Types.ObjectId(),
        username: "userWithoutTeam",
        email: "noteam@example.com",
        team_id: null,
      });

      const result = await serviceCreateTitle(userWithoutTeam, createTitlePayload);

      expect(result.error).toBeDefined();
    });
  });

  describe("serviceUpdateTitle", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should update title successfully for owner team leader", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const updateData = { title: "Updated Title", desc: "Updated description" };

      const result = await serviceUpdateTitle(user!, updateData);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.title).toBe("Updated Title");
      expect(result.data!.desc).toBe("Updated description");
    });

    it("should return 401 for non-owner team leader", async () => {
      const user = await UserModel.findById(userData.teamMemberWithTitle._id);
      const updateData = { title: "Updated Title" };

      const result = await serviceUpdateTitle(user!, updateData);

      expect(result.error?.status).toBe(401);
    });

    it("should prevent update when title has submissions", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);

      await SubmissionModel.create({
        team: user!.team?._id,
        team_target: teamsData.teamWithTitleCurrentPeriod._id,
        accepted: false,
        grand_design_url: "https://example.com/design.pdf",
        period: configData.current_period,
      });

      const result = await serviceUpdateTitle(user!, { title: "Updated Title" });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Cannot update title after submission");
    });

    it("should handle partial updates correctly", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);
      const partialUpdate = { desc: "Only description updated" };

      const result = await serviceUpdateTitle(user!, partialUpdate);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.desc).toBe("Only description updated");
      expect(result.data!.title).toBe(titleData.currentPeriodTitle.title);
    });

    it("should handle empty update payload", async () => {
      const user = await UserModel.findById(userData.teamLeaderWithTitle._id);

      const result = await serviceUpdateTitle(user!, {});

      expect(result.success).toBe(200);
      assert(result.success === 200);
    });
  });

  describe("serviceAdminGetAllTitles", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should return all titles regardless of period", async () => {
      const result = await serviceAdminGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(lengthTitleData);
    });

    it("should return titles in correct format", async () => {
      const result = await serviceAdminGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const firstTitle = result.data![0];
      expect(firstTitle).toHaveProperty("id");
      expect(firstTitle).toHaveProperty("title");
      expect(firstTitle).toHaveProperty("desc");
      expect(firstTitle).toHaveProperty("photo_url");
    });

    it("should return empty array when no titles exist", async () => {
      await TitleModel.deleteMany({});

      const result = await serviceAdminGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toEqual([]);
    });

    it("should include all periods without filtering", async () => {
      const result = await serviceAdminGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const titleIds = result.data!.map((t) => t.id);
      expect(titleIds).toContain(titleData.currentPeriodTitle._id!.toString());
      expect(titleIds).toContain(titleData.previousPeriodTitle._id!.toString());
    });
  });

  describe("serviceAdminDeleteTitleByID", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should delete title successfully and return 204", async () => {
      const titleId = titleData.currentPeriodTitle._id!.toString();

      const result = await serviceAdminDeleteTitleByID(titleId);

      expect(result.success).toBe(204);

      const deletedTitle = await TitleModel.findById(titleId);
      expect(deletedTitle).toBeNull();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminDeleteTitleByID("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for valid ObjectId but non-existent title", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminDeleteTitleByID(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });

    it("should not affect other titles when deleting one", async () => {
      const titleToDelete = titleData.currentPeriodTitle._id!.toString();
      const titleToKeep = titleData.previousPeriodTitle._id!.toString();

      await serviceAdminDeleteTitleByID(titleToDelete);

      const remainingTitle = await TitleModel.findById(titleToKeep);
      expect(remainingTitle).toBeDefined();
    });
  });

  describe("serviceAdminGetTitleByID", () => {
    beforeEach(async () => {
      for (const title of Object.values(titleData)) {
        await TitleModel.create(title);
      }
    });

    it("should return title with all details including proposal_url and description", async () => {
      const result = await serviceAdminGetTitleByID(titleData.currentPeriodTitle._id!.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.proposal_url).toBeDefined();
      expect(result.data!.description).toBeDefined();
      expect(result.data!.id).toBe(titleData.currentPeriodTitle._id!.toString());
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const result = await serviceAdminGetTitleByID("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for valid ObjectId but non-existent title", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await serviceAdminGetTitleByID(nonExistentId);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });

    it("should return complete title data structure", async () => {
      const result = await serviceAdminGetTitleByID(titleData.currentPeriodTitle._id!.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);

      const title = result.data!;
      expect(title).toHaveProperty("id");
      expect(title).toHaveProperty("title");
      expect(title).toHaveProperty("desc");
      expect(title).toHaveProperty("description");
      expect(title).toHaveProperty("photo_url");
      expect(title).toHaveProperty("proposal_url");
    });
  });
});
