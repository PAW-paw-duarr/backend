import argon2 from "argon2";
import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";
import { oauth2Client } from "~/lib/auth.js";
import { UserModel } from "~/models/users.js";
import {
  serviceFindOrCreateGoogleUser,
  serviceSigninPassword,
  serviceSignupPassword,
} from "~/services/authService.js";
import { userData } from "../database/data.js";
import { clearDatabase } from "../database/helper.js";

describe("AuthService", () => {
  beforeEach(async () => {
    // Create test users with hashed passwords
    for (const user of userData) {
      const hashedPassword = user.password ? await argon2.hash(user.password) : undefined;
      await UserModel.create({
        ...user,
        password: hashedPassword,
      });
    }
  });

  afterEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  describe("signin with password", () => {
    it("should signin with valid credentials", async () => {
      const result = await serviceSigninPassword({
        email: userData[0].email,
        password: userData[0].password!,
      });

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(userData[0].email);
      expect(result.data!.name).toBe(userData[0].name);
    });

    it("should return 400 for invalid email", async () => {
      const result = await serviceSigninPassword({
        email: "nonexistent@mail.com",
        password: "password",
      });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should return 401 for invalid password", async () => {
      const result = await serviceSigninPassword({
        email: userData[0].email,
        password: "wrongpassword",
      });

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should return 400 for user without password", async () => {
      // Create a user without password (Google OAuth user)
      await UserModel.create({
        name: "Google User",
        email: "google@mail.com",
        google_id: "google123",
        is_admin: false,
      });

      const result = await serviceSigninPassword({
        email: "google@mail.com",
        password: "anypassword",
      });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid email or password");
    });
  });

  describe("signup with password", () => {
    it("should create new user successfully", async () => {
      const newUser = {
        name: "New User",
        email: "newuser@mail.com",
        password: "newpassword",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(newUser.email);
      expect(result.data!.name).toBe(newUser.name);

      // Verify user was created in database
      const createdUser = await UserModel.findOne({ email: newUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser!.password).toBeTruthy();
    });

    it("should return 400 for duplicate email", async () => {
      const duplicateUser = {
        name: "Duplicate User",
        email: userData[0].email,
        password: "password",
      };

      const result = await serviceSignupPassword(duplicateUser);

      expect(result.error?.status).toBe(400);
      expect(result.data).toContain("email");
    });
  });

  describe("Google OAuth signin", () => {
    const mocks = vi.hoisted(() => ({
      verifyIdToken: vi.fn(),
      getToken: vi.fn(),
      setCredentials: vi.fn(),
    }));
    vi.mock("google-auth-library", () => ({
      OAuth2Client: class {
        verifyIdToken = mocks.verifyIdToken;
        getToken = mocks.getToken;
        setCredentials = mocks.setCredentials;
      },
    }));
    const mockTokens = { id_token: "mock_id_token" };
    const mockUserInfo = {
      name: "Google User",
      email: "googleuser@gmail.com",
      sub: "google123",
    };

    it("should create new Google user successfully", async () => {
      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(mockUserInfo.email);
      expect(result.data!.name).toBe(mockUserInfo.name);
      expect(result.data!.google_id).toBe(mockUserInfo.sub);

      // Verify user was created in database
      const createdUser = await UserModel.findOne({ email: mockUserInfo.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser!.google_id).toBe(mockUserInfo.sub);
    });

    it("should return existing Google user", async () => {
      await UserModel.create({ google_id: mockUserInfo.sub, ...mockUserInfo });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(mockUserInfo.email);
      expect(result.data!.google_id).toBe(mockUserInfo.sub);

      // Verify only one user exists with this email
      const userCount = await UserModel.countDocuments({ email: mockUserInfo.email });
      expect(userCount).toBe(1);
    });

    it("should return 500 for invalid Google token", async () => {
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      const result = await serviceFindOrCreateGoogleUser("invalid_code");

      expect(result.error?.status).toBe(500);
    });

    it("should handle OAuth getToken errors", async () => {
      vi.mocked(oauth2Client.getToken).mockRejectedValue(new Error("Invalid authorization code"));

      try {
        await serviceFindOrCreateGoogleUser("invalid_code");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Invalid authorization code");
      }
    });

    it("should handle OAuth verifyIdToken errors", async () => {
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      try {
        await serviceFindOrCreateGoogleUser("mock_auth_code");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Invalid authorization code");
      }
    });
  });
});
