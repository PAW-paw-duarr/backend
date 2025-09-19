import mongoose from "mongoose";
import { afterEach, assert, beforeEach, describe, expect, it } from "vitest";
import type { components } from "~/lib/api/schema.js";
import { ConfigModel } from "~/models/config.js";
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
import { configData, teamsData, titleData, userData } from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("TitleService", () => {
  const prevPeriod = titleData.filter((t) => t.period === configData.current_period - 1).length;

  beforeEach(async () => {
    await ConfigModel.create(configData);
    for (const user of userData) {
      await UserModel.create(user);
    }
    for (const team of teamsData) {
      await TeamModel.create(team);
    }
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("get all titles", () => {
    beforeEach(async () => {
      for (const i in titleData) {
        await TitleModel.create(titleData[i]);
      }
    });
    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should return titles from previous period", async () => {
      const result = await serviceGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);

      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(prevPeriod);

      const expectedTitle: components["schemas"]["data-title-short"] = {
        id: titleData[0]._id?.toString(),
        title: titleData[0].title,
        desc: titleData[0].desc,
        photo_url: titleData[0].photo_url,
      };
      expect(data[0]).toEqual(expectedTitle);
    });
  });

  describe("get title by ID", () => {
    beforeEach(async () => {
      for (const title of titleData) {
        await TitleModel.create(title);
      }
    });

    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should return title for owner team", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const result = await serviceGetTitleByID(titleData[0]._id!.toString(), user!);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.proposal_url).toBeDefined();
    });

    it("should return 400 for invalid ID", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const result = await serviceGetTitleByID("invalid-id", user!);

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for non-existent title", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const result = await serviceGetTitleByID(new mongoose.Types.ObjectId().toString(), user!);

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });
  });

  describe("create title", () => {
    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should create title for team leader", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const newTitle = {
        title: "New Title",
        desc: "New desc",
        description: "New description",
        photo_url: "https://example.com/photo.png",
        proposal_url: "https://example.com/proposal.pdf",
        period: 1,
      };

      const result = await serviceCreateTitle(user!, newTitle);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.title).toBe(newTitle.title);
    });

    it("should return 401 for non-team leader", async () => {
      const user = await UserModel.findById(userData[2]._id);
      const newTitle = {
        title: "New Title",
        desc: "New desc",
        description: "New description",
        photo_url: "https://example.com/photo.png",
        proposal_url: "https://example.com/proposal.pdf",
        period: 1,
      };

      const result = await serviceCreateTitle(user!, newTitle);

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Only team leader can create title");
    });
  });

  describe("update title", () => {
    beforeEach(async () => {
      for (const title of titleData) {
        await TitleModel.create(title);
      }
    });

    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should update title for owner team leader", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const updateData = { title: "Updated Title" };

      const result = await serviceUpdateTitle(titleData[0]._id!.toString(), user!, updateData);

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.title).toBe("Updated Title");
    });

    it("should return 400 for invalid ID", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const result = await serviceUpdateTitle("invalid-id", user!, { title: "Updated" });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for non-existent title", async () => {
      const user = await UserModel.findById(userData[0]._id);
      const result = await serviceUpdateTitle(new mongoose.Types.ObjectId().toString(), user!, {
        title: "Updated",
      });

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });
  });

  describe("admin get all titles", () => {
    beforeEach(async () => {
      for (const i in titleData) {
        await TitleModel.create(titleData[i]);
      }
    });

    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should return all titles with all details", async () => {
      const result = await serviceAdminGetAllTitles();

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      const data = result.data!;
      expect(data).toHaveLength(titleData.length);

      const expectedTitle: components["schemas"]["data-title-short"] = {
        id: titleData[0]._id?.toString(),
        title: titleData[0].title,
        desc: titleData[0].desc,
        photo_url: titleData[0].photo_url,
      };
      expect(data[0]).toEqual(expectedTitle);
    });
  });

  describe("admin delete title", () => {
    beforeEach(async () => {
      for (const title of titleData) {
        await TitleModel.create(title);
      }
    });

    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should delete title successfully", async () => {
      const result = await serviceAdminDeleteTitleByID(titleData[0]._id!.toString());

      expect(result.success).toBe(204);

      const deletedTitle = await TitleModel.findById(titleData[0]._id);
      expect(deletedTitle).toBeNull();
    });

    it("should return 400 for invalid ID", async () => {
      const result = await serviceAdminDeleteTitleByID("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid title ID");
    });

    it("should return 404 for non-existent title", async () => {
      const result = await serviceAdminDeleteTitleByID(new mongoose.Types.ObjectId().toString());

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });
  });

  describe("admin get title by ID", () => {
    beforeEach(async () => {
      for (const title of titleData) {
        await TitleModel.create(title);
      }
    });

    afterEach(async () => {
      await TitleModel.deleteMany({});
    });

    it("should return title with all details", async () => {
      const result = await serviceAdminGetTitleByID(titleData[0]._id!.toString());

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.proposal_url).toBeDefined();
      expect(result.data!.description).toBeDefined();
    });

    it("should return 400 for invalid ID", async () => {
      const result = await serviceAdminGetTitleByID("invalid-id");

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid Title ID");
    });

    it("should return 404 for non-existent title", async () => {
      const result = await serviceAdminGetTitleByID(new mongoose.Types.ObjectId().toString());

      expect(result.error?.status).toBe(404);
      expect(result.data).toBe("Title not found");
    });
  });
});
