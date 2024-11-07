import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/user";

describe("Authentication Endpoints", () => {
  let server: Server;
  const authBaseEndpoint = "/api/auth/";

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await sequelize.close(); // Close connection after tests
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.destroy({ where: {}, truncate: true });
  });

  describe("POST /auth/register", () => {
    const validUser = {
      email: "test@example.com",
      password: "Password123!"
    };

    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post(`${authBaseEndpoint}/register`)
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty("message", "Registration successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body).not.toHaveProperty("password");

      // Verify user was created in database
      const user = await User.findOne({ where: { email: validUser.email } });
      expect(user).not.toBeNull();
      expect(await user?.validatePassword(validUser.password)).toBe(true);
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post(`${authBaseEndpoint}/register`)
        .send({ ...validUser, email: "invalid-email" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for existing email", async () => {
      await User.create(validUser);

      const response = await request(app)
        .post(`${authBaseEndpoint}/register`)
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /auth/login", () => {
    const testUser = {
      email: "test@example.com",
      password: "Password123!"
    };

    beforeEach(async () => {
      await User.create(testUser);
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post(`${authBaseEndpoint}/login`)
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 401 for invalid password", async () => {
      await request(app)
        .post(`${authBaseEndpoint}/login`)
        .send({ ...testUser, password: "wrongpassword" })
        .expect(401);
    });

    it("should return 401 for non-existent user", async () => {
      await request(app)
        .post(`${authBaseEndpoint}/login`)
        .send({ email: "nonexistent@example.com", password: "test123" })
        .expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully", async () => {
      // First login to get a session
      const agent = request.agent(app);
      await agent.post(`${authBaseEndpoint}/login`).send({
        email: "test@example.com",
        password: "Password123!"
      });

      // Then test logout
      const response = await agent.post(`${authBaseEndpoint}/logout`).expect(200);

      expect(response.body).toHaveProperty("message", "Logout successful");
    });
  });

  describe("GET /auth/status", () => {
    const testUser = {
      email: "test@example.com",
      password: "Password123!"
    };

    it("should return authenticated status for logged in user", async () => {
      const agent = request.agent(app);

      // Create and login user
      await User.create(testUser);

      await agent.post(`${authBaseEndpoint}/login`).send(testUser);

      const response = await agent.get(`${authBaseEndpoint}/status`).expect(200);

      expect(response.body).toHaveProperty("isAuthenticated", true);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testUser.email);
    });

    it("should return unauthenticated status for non-logged in user", async () => {
      const response = await request(app).get(`${authBaseEndpoint}/status`).expect(200);

      expect(response.body).toHaveProperty("isAuthenticated", false);
      expect(response.body).not.toHaveProperty("user");
    });
  });
});
