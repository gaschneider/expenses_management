import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";

describe("Departments Endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const departmentsBaseEndpoint = "/api/departments/";
  const adminUserInfo = {
    firstName: "Admin",
    lastName: "User",
    email: "test@example.com",
    password: "Password123!"
  };

  beforeAll(async () => {
    server = await startServer();
    const adminUser = await User.create(adminUserInfo);
    await adminUser.addUserPermissionString(SystemPermission.ADMIN);

    agent = request.agent(app);
    await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
  });

  afterAll(async () => {
    await User.destroy({ where: {}, cascade: true });
    await sequelize.close(); // Close connection after tests
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await Department.destroy({ where: {}, cascade: true });
  });

  describe("POST /departments", () => {
    const validDepartment = {
      name: "Finance",
      description: "Finance department"
    };

    it("should register a new department successfully", async () => {
      const response = await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(201);

      expect(response.body).toHaveProperty("message", "Department created successfully");
      expect(response.body).toHaveProperty("department");
      expect(response.body.department).toHaveProperty("id");
      expect(response.body.department.name).toBe(validDepartment.name);
      expect(response.body.department.description).toBe(validDepartment.description);
      expect(response.body.department).not.toHaveProperty("users");

      // Verify department was created in database
      const department = await Department.findOne({ where: { name: validDepartment.name } });
      expect(department).not.toBeNull();
    });

    it("should return 400 for invalid name", async () => {
      const response = await agent
        .post(departmentsBaseEndpoint)
        .send({ ...validDepartment, name: "" })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Name is required");
    });

    it("should return 400 for existing name", async () => {
      await Department.create(validDepartment);

      const response = await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(400);

      expect(response.body).toHaveProperty("error", "Department already exists");
    });
  });

  describe("GET /departments", () => {
    const testDepartment = {
      name: "Finance",
      description: "Finance department"
    };
    let createdDepartment: Department;

    beforeEach(async () => {
      createdDepartment = await Department.create(testDepartment);
    });

    it("should retrieve all departments", async () => {
      const response = await agent.get(departmentsBaseEndpoint).expect(200);

      expect(response.body).toHaveLength(1);
      const department: Department = response.body[0];
      expect(department.id).toBe(createdDepartment.id);
      expect(department.name).toBe(createdDepartment.name);
      expect(department.description).toBe(createdDepartment.description);
    });

    it("should retrieve specific department", async () => {
      const response = await agent
        .get(`${departmentsBaseEndpoint}/${createdDepartment.id}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", createdDepartment.id);
      expect(response.body).toHaveProperty("name", createdDepartment.name);
      expect(response.body).toHaveProperty("description", createdDepartment.description);
    });

    it("should not find department", async () => {
      const response = await agent.get(`${departmentsBaseEndpoint}/0`).expect(404);

      expect(response.body).toHaveProperty("error", "Department not found");
    });

    it("should throw invalid id", async () => {
      const response = await agent.get(`${departmentsBaseEndpoint}/abc`).expect(400);

      expect(response.body).toHaveProperty("error", "Invalid department id");
    });
  });

  // describe("POST /auth/logout", () => {
  //   it("should logout successfully", async () => {
  //     // First login to get a session
  //     const agent = request.agent(app);
  //     await agent.post(`${authBaseEndpoint}/login`).send({
  //       email: "test@example.com",
  //       password: "Password123!"
  //     });

  //     // Then test logout
  //     const response = await agent.post(`${authBaseEndpoint}/logout`).expect(200);

  //     expect(response.body).toHaveProperty("message", "Logout successful");
  //   });
  // });

  // describe("GET /auth/status", () => {
  //   const testUser = {
  //     firstName: "Test",
  //     lastName: "User",
  //     email: "test@example.com",
  //     password: "Password123!"
  //   };

  //   it("should return authenticated status for logged in user", async () => {
  //     const agent = request.agent(app);

  //     // Create and login user
  //     await User.create(testUser);

  //     await agent.post(`${authBaseEndpoint}/login`).send(testUser);

  //     const response = await agent.get(`${authBaseEndpoint}/status`).expect(200);

  //     expect(response.body).toHaveProperty("isAuthenticated", true);
  //     expect(response.body).toHaveProperty("user");
  //     expect(response.body.user.email).toBe(testUser.email);
  //   });

  //   it("should return unauthenticated status for non-logged in user", async () => {
  //     const response = await request(app).get(`${authBaseEndpoint}/status`).expect(200);

  //     expect(response.body).toHaveProperty("isAuthenticated", false);
  //     expect(response.body).not.toHaveProperty("user");
  //   });
  // });
});
