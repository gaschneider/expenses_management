import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { Rule, RuleStep } from "../src/models/Rule";
import { SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";
import { RuleToCreateDTO } from "../src/controllers/ruleController";

describe("Rule Management Endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const rulesBaseEndpoint = "/api/rules";

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await sequelize.close();
    if (server) {
      server.close();
    }
  }, 60000);

  describe("Authenticated admin", () => {
    const adminUserInfo = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "Password123!"
    };

    let adminUser: User;
    let testDepartment: Department;

    beforeAll(async () => {
      // Create admin user with MANAGE_RULES permission
      adminUser = await User.create(adminUserInfo);
      await adminUser.addUserPermissionString(SystemPermission.ADMIN);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Rule Testing"
      });

      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
    });

    afterAll(async () => {
      // Clean up
      await User.destroy({ where: {} });
      await Department.destroy({ where: {} });
    });

    afterEach(async () => {
      // Clean up
      await Rule.destroy({ where: {} });
      await RuleStep.destroy({ where: {} });
    });

    describe("POST /rules", () => {
      it("should create a new rule with valid data", async () => {
        const ruleData: RuleToCreateDTO = {
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 1000.0,
          canBeSingleApproved: false,
          ruleSteps: [
            {
              approvingDepartmentId: testDepartment.id!,
              approvingUserId: null
            }
          ]
        };

        const response = await agent.post(rulesBaseEndpoint).send(ruleData).expect(201);

        expect(response.body).toHaveProperty("message", "Rule created successfully");

        // Verify rule steps were created
        const createdRule = await Rule.findByPk(response.body.ruleId, { include: ["ruleSteps"] });

        expect(createdRule?.departmentId).toBe(testDepartment.id);
        expect(createdRule?.minValue).toBe("100.00");
        expect(createdRule?.maxValue).toBe("1000.00");
        expect(createdRule?.canBeSingleApproved).toBe(false);
        expect(createdRule?.ruleSteps).toHaveLength(1);
      });

      it("should fail to create rule with invalid data", async () => {
        const invalidRuleData = {
          departmentId: testDepartment.id,
          minValue: 1000.0,
          maxValue: 100.0, // Invalid: min > max
          canBeSingleApproved: false
        };

        await agent.post(rulesBaseEndpoint).send(invalidRuleData).expect(400);
      });
    });

    describe("GET /rules", () => {
      let existingRules: Rule[];

      beforeAll(async () => {
        // Create some rules for testing
        existingRules = await Rule.bulkCreate([
          {
            departmentId: testDepartment.id!,
            minValue: 100.0,
            maxValue: 500.0,
            canBeSingleApproved: false
          },
          {
            departmentId: testDepartment.id!,
            minValue: 500.01,
            maxValue: 1000.0,
            canBeSingleApproved: true
          }
        ]);
      });

      it("should retrieve all rules", async () => {
        const response = await agent.get(rulesBaseEndpoint).expect(200);

        expect(response.body).toHaveLength(existingRules.length);
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("departmentId", testDepartment.id);
      });
    });

    describe("GET /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 200.0,
          maxValue: 600.0,
          canBeSingleApproved: true
        });
      });

      it("should retrieve a specific rule by id", async () => {
        const response = await agent.get(`${rulesBaseEndpoint}/${existingRule.id}`).expect(200);

        expect(response.body.id).toBe(existingRule.id);
        expect(response.body.minValue).toBe("200.00");
        expect(response.body.maxValue).toBe("600.00");
      });

      it("should return 404 for non-existent rule", async () => {
        await agent.get(`${rulesBaseEndpoint}/999999`).expect(404);
      });
    });

    describe("PUT /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 500.0,
          canBeSingleApproved: false
        });
      });

      it("should update an existing rule", async () => {
        const updateData = {
          departmentId: testDepartment.id,
          minValue: 150.0,
          maxValue: 600.0,
          canBeSingleApproved: true,
          ruleSteps: [
            {
              step: 1,
              approvingDepartmentId: testDepartment.id,
              approvingUserId: null
            }
          ]
        };

        const response = await agent
          .put(`${rulesBaseEndpoint}/${existingRule.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("message", "Rule updated successfully");

        // Verify rule steps were updated
        const updatedRule = await Rule.findByPk(existingRule.id, { include: ["ruleSteps"] });
        expect(updatedRule?.minValue).toBe("150.00");
        expect(updatedRule?.maxValue).toBe("600.00");
        expect(updatedRule?.canBeSingleApproved).toBe(true);
        expect(updatedRule?.ruleSteps).toHaveLength(1);
      });

      it("should fail to update rule with invalid data", async () => {
        const invalidUpdateData = {
          minValue: 1000.0,
          maxValue: 100.0 // Invalid: min > max
        };

        await agent
          .put(`${rulesBaseEndpoint}/${existingRule.id}`)
          .send(invalidUpdateData)
          .expect(400);
      });
    });

    describe("DELETE /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 500.0,
          canBeSingleApproved: false
        });
      });

      it("should delete an existing rule", async () => {
        await agent.delete(`${rulesBaseEndpoint}/${existingRule.id}`).expect(200);

        const deletedRule = await Rule.findByPk(existingRule.id);
        expect(deletedRule).toBeNull();
      });

      it("should return 404 when deleting non-existent rule", async () => {
        await agent.delete(`${rulesBaseEndpoint}/999999`).expect(404);
      });
    });
  });

  describe("Authenticated user with MANAGE_RULES permission", () => {
    const manageRulesUserInfo = {
      firstName: "User",
      lastName: "Manage",
      email: "user-manage@example.com",
      password: "Password123!"
    };

    let manageRulesUser: User;
    let testDepartment: Department;

    beforeAll(async () => {
      // Create admin user with MANAGE_RULES permission
      manageRulesUser = await User.create(manageRulesUserInfo);
      await manageRulesUser.addUserPermissionString(SystemPermission.MANAGE_RULES);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Rule Testing"
      });

      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(manageRulesUserInfo).expect(200);
    });

    afterAll(async () => {
      // Clean up
      await User.destroy({ where: {} });
      await Department.destroy({ where: {} });
    });

    afterEach(async () => {
      // Clean up
      await Rule.destroy({ where: {} });
      await RuleStep.destroy({ where: {} });
    });

    describe("POST /rules", () => {
      it("should create a new rule with valid data", async () => {
        const ruleData: RuleToCreateDTO = {
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 1000.0,
          canBeSingleApproved: false,
          ruleSteps: [
            {
              approvingDepartmentId: testDepartment.id!,
              approvingUserId: null
            }
          ]
        };

        const response = await agent.post(rulesBaseEndpoint).send(ruleData).expect(201);

        expect(response.body).toHaveProperty("message", "Rule created successfully");

        // Verify rule steps were created
        const createdRule = await Rule.findByPk(response.body.ruleId, { include: ["ruleSteps"] });

        expect(createdRule?.departmentId).toBe(testDepartment.id);
        expect(createdRule?.minValue).toBe("100.00");
        expect(createdRule?.maxValue).toBe("1000.00");
        expect(createdRule?.canBeSingleApproved).toBe(false);
        expect(createdRule?.ruleSteps).toHaveLength(1);
      });

      it("should fail to create rule with invalid data", async () => {
        const invalidRuleData = {
          departmentId: testDepartment.id,
          minValue: 1000.0,
          maxValue: 100.0, // Invalid: min > max
          canBeSingleApproved: false
        };

        await agent.post(rulesBaseEndpoint).send(invalidRuleData).expect(400);
      });
    });

    describe("GET /rules", () => {
      let existingRules: Rule[];

      beforeAll(async () => {
        // Create some rules for testing
        existingRules = await Rule.bulkCreate([
          {
            departmentId: testDepartment.id!,
            minValue: 100.0,
            maxValue: 500.0,
            canBeSingleApproved: false
          },
          {
            departmentId: testDepartment.id!,
            minValue: 500.01,
            maxValue: 1000.0,
            canBeSingleApproved: true
          }
        ]);
      });

      it("should retrieve all rules", async () => {
        const response = await agent.get(rulesBaseEndpoint).expect(200);

        expect(response.body).toHaveLength(existingRules.length);
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("departmentId", testDepartment.id);
      });
    });

    describe("GET /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 200.0,
          maxValue: 600.0,
          canBeSingleApproved: true
        });
      });

      it("should retrieve a specific rule by id", async () => {
        const response = await agent.get(`${rulesBaseEndpoint}/${existingRule.id}`).expect(200);

        expect(response.body.id).toBe(existingRule.id);
        expect(response.body.minValue).toBe("200.00");
        expect(response.body.maxValue).toBe("600.00");
      });

      it("should return 404 for non-existent rule", async () => {
        await agent.get(`${rulesBaseEndpoint}/999999`).expect(404);
      });
    });

    describe("PUT /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 500.0,
          canBeSingleApproved: false
        });
      });

      it("should update an existing rule", async () => {
        const updateData = {
          departmentId: testDepartment.id,
          minValue: 150.0,
          maxValue: 600.0,
          canBeSingleApproved: true,
          ruleSteps: [
            {
              step: 1,
              approvingDepartmentId: testDepartment.id,
              approvingUserId: null
            }
          ]
        };

        const response = await agent
          .put(`${rulesBaseEndpoint}/${existingRule.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("message", "Rule updated successfully");

        // Verify rule steps were updated
        const updatedRule = await Rule.findByPk(existingRule.id, { include: ["ruleSteps"] });
        expect(updatedRule?.minValue).toBe("150.00");
        expect(updatedRule?.maxValue).toBe("600.00");
        expect(updatedRule?.canBeSingleApproved).toBe(true);
        expect(updatedRule?.ruleSteps).toHaveLength(1);
      });

      it("should fail to update rule with invalid data", async () => {
        const invalidUpdateData = {
          minValue: 1000.0,
          maxValue: 100.0 // Invalid: min > max
        };

        await agent
          .put(`${rulesBaseEndpoint}/${existingRule.id}`)
          .send(invalidUpdateData)
          .expect(400);
      });
    });

    describe("DELETE /rules/:id", () => {
      let existingRule: Rule;

      beforeAll(async () => {
        existingRule = await Rule.create({
          departmentId: testDepartment.id!,
          minValue: 100.0,
          maxValue: 500.0,
          canBeSingleApproved: false
        });
      });

      it("should delete an existing rule", async () => {
        await agent.delete(`${rulesBaseEndpoint}/${existingRule.id}`).expect(200);

        const deletedRule = await Rule.findByPk(existingRule.id);
        expect(deletedRule).toBeNull();
      });

      it("should return 404 when deleting non-existent rule", async () => {
        await agent.delete(`${rulesBaseEndpoint}/999999`).expect(404);
      });
    });
  });

  describe("Authenticated user without MANAGE_RULES permission", () => {
    const userWithoutPermission = {
      firstName: "No",
      lastName: "Permission",
      email: "no-permission@example.com",
      password: "Password123!"
    };

    let testDepartment: Department;

    beforeAll(async () => {
      // Create user without MANAGE_RULES permission
      await User.create(userWithoutPermission);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Rule Testing"
      });

      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(userWithoutPermission).expect(200);
    });

    afterAll(async () => {
      // Clean up
      await User.destroy({ where: {} });
      await Department.destroy({ where: {} });
    });

    it("should not allow creating a rule", async () => {
      const ruleData = {
        departmentId: testDepartment.id,
        minValue: 100.0,
        maxValue: 1000.0,
        canBeSingleApproved: false
      };

      await agent.post(rulesBaseEndpoint).send(ruleData).expect(403);
    });

    it("should not allow retrieving rules", async () => {
      await agent.get(rulesBaseEndpoint).expect(403);
    });

    it("should not allow updating a rule", async () => {
      await agent.put(`${rulesBaseEndpoint}/1`).send({ minValue: 200.0 }).expect(403);
    });

    it("should not allow deleting a rule", async () => {
      await agent.delete(`${rulesBaseEndpoint}/1`).expect(403);
    });
  });

  describe("Unauthenticated user", () => {
    beforeAll(async () => {
      agent = request.agent(app);
    });

    it("should not allow creating a rule", async () => {
      await agent.post(rulesBaseEndpoint).send({}).expect(401);
    });

    it("should not allow retrieving rules", async () => {
      await agent.get(rulesBaseEndpoint).expect(401);
    });

    it("should not allow updating a rule", async () => {
      await agent.put(`${rulesBaseEndpoint}/1`).send({}).expect(401);
    });

    it("should not allow deleting a rule", async () => {
      await agent.delete(`${rulesBaseEndpoint}/1`).expect(401);
    });
  });
});
