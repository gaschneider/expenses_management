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

  const departmentsBaseEndpoint = "/api/departments";

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await sequelize.close(); // Close connection after tests
    if (server) {
      server.close();
    }
  });

  describe("Authenticated admin", () => {
    const adminUserInfo = {
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      const adminUser = await User.create(adminUserInfo);
      await adminUser.addUserPermissionString(SystemPermission.ADMIN);

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      const testDepartment = {
        name: "Finance",
        description: "Finance department"
      };
      let createdDepartment: Department;

      beforeAll(async () => {
        createdDepartment = await Department.create(testDepartment);
      });

      afterAll(async () => {
        await Department.destroy({ where: {}, cascade: true });
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

    describe("POST /departments", () => {
      const validDepartment = {
        name: "Finance",
        description: "Finance department"
      };

      afterAll(async () => {
        // Clear database before each test
        await Department.destroy({ where: {}, cascade: true });
      });

      it("should register a new department successfully", async () => {
        const response = await agent
          .post(departmentsBaseEndpoint)
          .send(validDepartment)
          .expect(201);

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

        const response = await agent
          .post(departmentsBaseEndpoint)
          .send(validDepartment)
          .expect(400);

        expect(response.body).toHaveProperty("error", "Department already exists");
      });
    });

    describe("PATCH /departments", () => {
      let validDepartment: Department;

      beforeEach(async () => {
        validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });
      });

      afterEach(async () => {
        await Department.destroy({ where: {}, cascade: true });
      });

      it("should update an existing department successfully", async () => {
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(200);

        expect(response.body).toHaveProperty("message", "Department updated successfully");

        // Verify department was created in database
        const department = await Department.findOne({ where: { id: validDepartment.id } });
        expect(department).not.toBeNull();
        expect(department?.name).toBe("Finance");
        expect(department?.description).toBe("New finance department");
      });

      it("should update an existing department name successfully", async () => {
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "New Finance",
            description: "Finance department"
          })
          .expect(200);

        expect(response.body).toHaveProperty("message", "Department updated successfully");

        // Verify department was created in database
        const department = await Department.findOne({ where: { id: validDepartment.id } });
        expect(department).not.toBeNull();
        expect(department?.name).toBe("New Finance");
        expect(department?.description).toBe("Finance department");
      });

      it("should return 400 for invalid id", async () => {
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/abc`)
          .send({
            name: validDepartment.name,
            description: "New finance department"
          })
          .expect(400);

        expect(response.body).toHaveProperty("error", "Invalid department id");
      });

      it("should return 400 for invalid name", async () => {
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "",
            description: validDepartment.description
          })
          .expect(400);

        expect(response.body).toHaveProperty("error", "Name is required");
      });

      it("should return 400 for name existing in another department", async () => {
        await Department.create({
          name: "IT",
          description: "IT Department"
        });
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "IT",
            description: validDepartment.description
          })
          .expect(400);

        expect(response.body).toHaveProperty("error", "Department already exists");
      });

      it("should return 404 for department not found", async () => {
        const response = await agent
          .patch(`${departmentsBaseEndpoint}/100`)
          .send({
            name: "IT2",
            description: "IT Department"
          })
          .expect(404);

        expect(response.body).toHaveProperty("error", "Department not found");
      });
    });

    describe("DELETE /departments", () => {
      let validDepartment: Department;

      beforeAll(async () => {
        validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });
      });

      afterAll(async () => {
        await Department.destroy({ where: {}, cascade: true });
      });

      it("should delete an existing department successfully", async () => {
        const response = await agent
          .delete(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send()
          .expect(200);

        expect(response.body).toHaveProperty("message", "Department deleted successfully");

        // Verify department was created in database
        const department = await Department.findOne({ where: { id: validDepartment.id } });
        expect(department).toBeNull();
      });

      it("should return 400 for invalid id", async () => {
        const response = await agent.delete(`${departmentsBaseEndpoint}/abc`).send().expect(400);

        expect(response.body).toHaveProperty("error", "Invalid department id");
      });

      it("should return 404 for department not found", async () => {
        const response = await agent.delete(`${departmentsBaseEndpoint}/100`).send().expect(404);

        expect(response.body).toHaveProperty("error", "Department not found");
      });
    });
  });

  describe("User not authenticated", () => {
    beforeAll(async () => {
      agent = request.agent(app);
    });

    describe("GET /departments", () => {
      it("should retrieve all departments", async () => {
        await agent.get(departmentsBaseEndpoint).expect(401);
      });

      it("should retrieve specific department", async () => {
        await agent.get(`${departmentsBaseEndpoint}/1`).expect(401);
      });
    });

    describe("POST /departments", () => {
      it("should register a new department successfully", async () => {
        const validDepartment = {
          name: "Finance",
          description: "Finance department"
        };

        await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(401);
      });
    });

    describe("PATCH /departments", () => {
      it("should not update department due to unathorized", async () => {
        await agent
          .patch(`${departmentsBaseEndpoint}/1`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(401);
      });
    });

    describe("DELETE /departments", () => {
      it("should not delete department due to unathorized", async () => {
        await agent.delete(`${departmentsBaseEndpoint}/1`).send().expect(401);
      });
    });
  });

  describe("No permissions user", () => {
    const noPermissionUserInfo = {
      firstName: "No",
      lastName: "Permission",
      email: "no_permission@example.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      await User.create(noPermissionUserInfo);

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(noPermissionUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      it("should retrieve all departments", async () => {
        await agent.get(departmentsBaseEndpoint).expect(403);
      });

      it("should retrieve specific department", async () => {
        await agent.get(`${departmentsBaseEndpoint}/1`).expect(403);
      });
    });

    describe("POST /departments", () => {
      it("should register a new department successfully", async () => {
        const validDepartment = {
          name: "Finance",
          description: "Finance department"
        };

        await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(403);
      });
    });

    describe("PATCH /departments", () => {
      it("should not update department due to unathorized", async () => {
        await agent
          .patch(`${departmentsBaseEndpoint}/1`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(403);
      });
    });

    describe("DELETE /departments", () => {
      it("should not delete department due to unathorized", async () => {
        await agent.delete(`${departmentsBaseEndpoint}/1`).send().expect(403);
      });
    });
  });

  describe("Authenticated Create Department user", () => {
    const createDepartmentUserInfo = {
      firstName: "Create",
      lastName: "Department",
      email: "create_department@example.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      const createDepartmentUser = await User.create(createDepartmentUserInfo);
      await createDepartmentUser.addUserPermissionString(SystemPermission.CREATE_DEPARTMENT);

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(createDepartmentUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      const testDepartment = {
        name: "Finance",
        description: "Finance department"
      };
      let createdDepartment: Department;

      beforeAll(async () => {
        createdDepartment = await Department.create(testDepartment);
      });

      afterAll(async () => {
        // Clear database before each test
        await Department.destroy({ where: {}, cascade: true });
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
    });

    describe("POST /departments", () => {
      const validDepartment = {
        name: "Finance",
        description: "Finance department"
      };

      it("should register a new department successfully", async () => {
        const response = await agent
          .post(departmentsBaseEndpoint)
          .send(validDepartment)
          .expect(201);

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
    });

    describe("PATCH /departments", () => {
      it("should not update department due to unathorized", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });

    describe("DELETE /departments", () => {
      it("should not delete department due to unathorized", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent.delete(`${departmentsBaseEndpoint}/${validDepartment.id}`).send().expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });
  });

  describe("Authenticated edit Department user", () => {
    const editDepartmentUserInfo = {
      firstName: "Edit",
      lastName: "Department",
      email: "edit_department@example.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      const editDepartmentUser = await User.create(editDepartmentUserInfo);
      await editDepartmentUser.addUserPermissionString(SystemPermission.EDIT_DEPARTMENT);

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(editDepartmentUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      const testDepartment = {
        name: "Finance",
        description: "Finance department"
      };
      let createdDepartment: Department;

      beforeAll(async () => {
        createdDepartment = await Department.create(testDepartment);
      });

      afterAll(async () => {
        // Clear database before each test
        await Department.destroy({ where: {}, cascade: true });
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
    });

    describe("POST /departments", () => {
      it("should not create a new department due to unauthorized", async () => {
        const validDepartment = {
          name: "Finance",
          description: "Finance department"
        };

        await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(403);
      });
    });

    describe("PATCH /departments", () => {
      it("should update a department successfully", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        const response = await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(200);

        expect(response.body).toHaveProperty("message", "Department updated successfully");

        // Verify department was created in database
        const department = await Department.findOne({ where: { id: validDepartment.id } });
        expect(department).not.toBeNull();
        expect(department?.name).toBe("Finance");
        expect(department?.description).toBe("New finance department");

        await Department.destroy({ where: {}, cascade: true });
      });
    });

    describe("DELETE /departments", () => {
      it("should not delete department due to unauthorized", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent.delete(`${departmentsBaseEndpoint}/${validDepartment.id}`).send().expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });
  });

  describe("Authenticated delete Department user", () => {
    const deleteDepartmentUserInfo = {
      firstName: "Delete",
      lastName: "Department",
      email: "deletedepartment@example.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      const deleteDepartmentUser = await User.create(deleteDepartmentUserInfo);
      await deleteDepartmentUser.addUserPermissionString(SystemPermission.DELETE_DEPARTMENT);

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(deleteDepartmentUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      const testDepartment = {
        name: "Finance",
        description: "Finance department"
      };
      let createdDepartment: Department;

      beforeAll(async () => {
        createdDepartment = await Department.create(testDepartment);
      });

      afterAll(async () => {
        // Clear database before each test
        await Department.destroy({ where: {}, cascade: true });
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
    });

    describe("POST /departments", () => {
      it("should not create a new department due to forbidden", async () => {
        const validDepartment = {
          name: "Finance",
          description: "Finance department"
        };

        await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(403);
      });
    });

    describe("PATCH /departments", () => {
      it("should not update department due to forbidden", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });

    describe("DELETE /departments", () => {
      it("should be able to delete department successfully", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        const response = await agent
          .delete(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send()
          .expect(200);

        expect(response.body).toHaveProperty("message", "Department deleted successfully");

        // Verify department was created in database
        const department = await Department.findOne({ where: { id: validDepartment.id } });
        expect(department).toBeNull();

        await Department.destroy({ where: {}, cascade: true });
      });
    });
  });

  describe("Authenticated manage permissions user", () => {
    const managePermissionsUserInfo = {
      firstName: "Manage",
      lastName: "Permissions",
      email: "Manage@permissions.com",
      password: "Password123!"
    };

    beforeAll(async () => {
      const managePermissionsUser = await User.create(managePermissionsUserInfo);
      await managePermissionsUser.addUserPermissionString(
        SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS
      );

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(managePermissionsUserInfo).expect(200);
    });

    afterAll(async () => {
      await User.destroy({ where: {}, cascade: true });
    });

    describe("GET /departments", () => {
      const testDepartment = {
        name: "Finance",
        description: "Finance department"
      };
      let createdDepartment: Department;

      beforeAll(async () => {
        createdDepartment = await Department.create(testDepartment);
      });

      afterAll(async () => {
        // Clear database before each test
        await Department.destroy({ where: {}, cascade: true });
      });

      it("should retrieve all departments", async () => {
        const response = await agent.get(departmentsBaseEndpoint).expect(200);

        expect(response.body).toHaveLength(1);
        const department: Department = response.body[0];
        expect(department.id).toBe(createdDepartment.id);
        expect(department.name).toBe(createdDepartment.name);
        expect(department.description).toBe(createdDepartment.description);
      });

      it("should not retrieve specific department", async () => {
        const response = await agent
          .get(`${departmentsBaseEndpoint}/${createdDepartment.id}`)
          .expect(403);

        expect(response.body).toHaveProperty("error", "Insufficient permissions");
      });
    });

    describe("POST /departments", () => {
      it("should not create a new department due to forbidden", async () => {
        const validDepartment = {
          name: "Finance",
          description: "Finance department"
        };

        await agent.post(departmentsBaseEndpoint).send(validDepartment).expect(403);
      });
    });

    describe("PATCH /departments", () => {
      it("should not update department due to forbidden", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent
          .patch(`${departmentsBaseEndpoint}/${validDepartment.id}`)
          .send({
            name: "Finance",
            description: "New finance department"
          })
          .expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });

    describe("DELETE /departments", () => {
      it("should not delete department due to unathorized", async () => {
        const validDepartment = await Department.create({
          name: "Finance",
          description: "Finance department"
        });

        await agent.delete(`${departmentsBaseEndpoint}/${validDepartment.id}`).send().expect(403);

        await Department.destroy({ where: {}, cascade: true });
      });
    });
  });
});
