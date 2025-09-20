import argon2 from "argon2";
import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";
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
    for (const user of Object.values(userData)) {
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

  describe("serviceSigninPassword", () => {
    it("should signin successfully with valid credentials", async () => {
      const result = await serviceSigninPassword({
        email: userData.teamLeaderWithTitle.email,
        password: userData.teamLeaderWithTitle.password!,
      });

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(userData.teamLeaderWithTitle.email);
      expect(result.data!.name).toBe(userData.teamLeaderWithTitle.name);
    });

    it("should return 400 for non-existent email", async () => {
      const result = await serviceSigninPassword({
        email: "nonexistent@mail.com",
        password: "password",
      });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should return 401 for incorrect password", async () => {
      const result = await serviceSigninPassword({
        email: userData.teamLeaderWithTitle.email,
        password: "wrongpassword",
      });

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should return 400 for user without password (OAuth user)", async () => {
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

  describe("serviceSignupPassword", () => {
    it("should create new user successfully with all required fields", async () => {
      const password = "aaa";
      const newUser = {
        name: "New User",
        email: "newuser@mail.com",
        password: password,
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(newUser.email);
      expect(result.data!.name).toBe(newUser.name);

      // Verify user was created in database with hashed password
      const createdUser = await UserModel.findOne({ email: newUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser!.password).toBeTruthy();
      expect(createdUser!.password).not.toBe(password); // Should be hashed
    });

    it("should return 400 for duplicate email address", async () => {
      const duplicateUser = {
        name: "Duplicate User",
        email: userData.teamLeaderWithTitle.email,
        password: "password",
      };

      const result = await serviceSignupPassword(duplicateUser);

      expect(result.error?.status).toBe(400);
      expect(result.data).toContain("email");
    });

    it("should handle case-insensitive email uniqueness", async () => {
      const duplicateUser = {
        name: "Duplicate User",
        email: userData.teamLeaderWithTitle.email.toUpperCase(),
        password: "password",
      };

      const result = await serviceSignupPassword(duplicateUser);

      expect(result.error?.status).toBe(400);
    });

    it("should trim whitespace from inputs", async () => {
      const newUser = {
        name: "  Test User  ",
        email: "  test@mail.com  ",
        password: "password",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.name).toBe("Test User");
      expect(result.data!.email).toBe("test@mail.com");
    });
  });

  describe("serviceFindOrCreateGoogleUser", () => {
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
      picture: "https://example.com/avatar.jpg",
    };

    beforeEach(() => {
      mocks.getToken.mockClear();
      mocks.verifyIdToken.mockClear();
      mocks.setCredentials.mockClear();
    });

    it("should create new Google user successfully with complete profile", async () => {
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
      expect(createdUser!.password).toBeUndefined();
    });

    it("should return existing Google user without creating duplicate", async () => {
      // Create existing user first
      const existingUser = await UserModel.create({
        google_id: mockUserInfo.sub,
        name: mockUserInfo.name,
        email: mockUserInfo.email,
        is_admin: false,
      });

      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(mockUserInfo.email);
      expect(result.data!.google_id).toBe(mockUserInfo.sub);
      expect(result.data!.id).toBe(existingUser._id.toString());

      // Verify only one user exists with this email
      const userCount = await UserModel.countDocuments({ email: mockUserInfo.email });
      expect(userCount).toBe(1);
    });

    it("should return 500 for invalid token verification", async () => {
      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      const result = await serviceFindOrCreateGoogleUser("invalid_code");

      expect(result.error?.status).toBe(500);
    });

    it("should handle missing user information from Google", async () => {
      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: "google123",
          // Missing name and email
        }),
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.error?.status).toBe(500);
    });
  });
});
