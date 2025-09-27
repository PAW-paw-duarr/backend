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
      const result = await serviceSigninPassword({
        email: userData.userWithGoogleAuth.email,
        password: "anypassword",
      });

      expect(result.error?.status).toBe(400);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should handle empty password", async () => {
      const result = await serviceSigninPassword({
        email: userData.teamLeaderWithTitle.email,
        password: "",
      });

      expect(result.error?.status).toBe(401);
      expect(result.data).toBe("Invalid email or password");
    });

    it("should handle email with different casing", async () => {
      const result = await serviceSigninPassword({
        email: userData.teamLeaderWithTitle.email.toUpperCase(),
        password: userData.teamLeaderWithTitle.password!,
      });

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.email).toBe(userData.teamLeaderWithTitle.email);
    });

    it("should return user data with all fields", async () => {
      const result = await serviceSigninPassword({
        email: userData.teamLeaderWithTitle.email,
        password: userData.teamLeaderWithTitle.password!,
      });

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.name).toBe(userData.teamLeaderWithTitle.name);
      expect(result.data!.email).toBe(userData.teamLeaderWithTitle.email);
      expect(result.data!.cv_url).toBe(userData.teamLeaderWithTitle.cv_url);
      expect(result.data!.team_id).toBeDefined();
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

    it("should create user with minimal required fields only", async () => {
      const newUser = {
        name: "Minimal User",
        email: "minimal@mail.com",
        password: "password123",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe(newUser.name);
      expect(result.data!.email).toBe(newUser.email.toLowerCase());
      expect(result.data!.id).toBeDefined();

      // Optional fields should be undefined
      expect(result.data!.cv_url).toBeUndefined();
      expect(result.data!.team_id).toBeUndefined();
      expect(result.data!.google_id).toBeUndefined();
    });

    it("should handle special characters in name", async () => {
      const newUser = {
        name: "José María O'Connor-Smith",
        email: "special@mail.com",
        password: "password123",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.name).toBe(newUser.name);
    });

    it("should convert email to lowercase", async () => {
      const newUser = {
        name: "Test User",
        email: "TEST@MAIL.COM",
        password: "password123",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.email).toBe("test@mail.com");
    });

    it("should handle very long password", async () => {
      const longPassword = "a".repeat(1000);
      const newUser = {
        name: "Long Password User",
        email: "longpass@mail.com",
        password: longPassword,
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);

      // Verify password was hashed correctly
      const createdUser = await UserModel.findOne({ email: newUser.email });
      expect(createdUser!.password).toBeTruthy();
      expect(createdUser!.password!.length).toBeLessThan(longPassword.length);
    });

    it("should handle unicode characters in name and email", async () => {
      const newUser = {
        name: "测试用户",
        email: "unicode-test@mail.com",
        password: "password123",
      };

      const result = await serviceSignupPassword(newUser);

      expect(result.success).toBe(201);
      assert(result.success === 201);
      expect(result.data!.name).toBe(newUser.name);
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

    it("should handle Google user with existing email but different auth method", async () => {
      // Create a password-based user with the same email
      await UserModel.create({
        name: "Existing User",
        email: mockUserInfo.email,
        password: await argon2.hash("password123"),
        is_admin: false,
      });

      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);

      // Should find the existing user and update with Google ID
      const updatedUser = await UserModel.findOne({ email: mockUserInfo.email });
      expect(updatedUser!.google_id).toBe(mockUserInfo.sub);
      expect(updatedUser!.password).toBeTruthy(); // Password should remain
    });

    it("should return complete user data with all fields", async () => {
      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();
      expect(result.data!.name).toBe(mockUserInfo.name);
      expect(result.data!.email).toBe(mockUserInfo.email);
      expect(result.data!.google_id).toBe(mockUserInfo.sub);
      expect(result.data!.cv_url).toBeUndefined();
      expect(result.data!.team_id).toBeUndefined();
    });

    it("should handle Google user info with extra fields", async () => {
      const extendedUserInfo = {
        ...mockUserInfo,
        given_name: "Google",
        family_name: "User",
        locale: "en",
        email_verified: true,
      };

      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => extendedUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.name).toBe(extendedUserInfo.name);
      expect(result.data!.email).toBe(extendedUserInfo.email);
    });

    it("should handle multiple calls with same Google user", async () => {
      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => mockUserInfo,
      });

      // First call
      const result1 = await serviceFindOrCreateGoogleUser("mock_auth_code");
      expect(result1.success).toBe(200);
      assert(result1.success === 200);

      // Second call with same user
      const result2 = await serviceFindOrCreateGoogleUser("mock_auth_code");
      expect(result2.success).toBe(200);
      assert(result2.success === 200);

      // Should return same user ID
      expect(result1.data!.id).toBe(result2.data!.id);

      // Verify only one user exists
      const userCount = await UserModel.countDocuments({ email: mockUserInfo.email });
      expect(userCount).toBe(1);
    });

    it("should handle Google user with long name", async () => {
      const longNameUserInfo = {
        ...mockUserInfo,
        name: "Very Long Google User Name That Exceeds Normal Length".repeat(3),
      };

      mocks.getToken.mockResolvedValue({ tokens: mockTokens });
      mocks.verifyIdToken.mockResolvedValue({
        getPayload: () => longNameUserInfo,
      });

      const result = await serviceFindOrCreateGoogleUser("mock_auth_code");

      expect(result.success).toBe(200);
      assert(result.success === 200);
      expect(result.data!.name).toBe(longNameUserInfo.name);
    });
  });
});
