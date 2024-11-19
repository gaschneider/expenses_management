import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { DepartmentPermission, SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";
import { UserWithPermissionsDTO } from "../src/helpers/userToWithPermissionsDTO";
import PermissionAuditLog from "../src/models/PermissionAuditLog";
import { PermissionAuditService } from "../src/services/permissionAuditService";

describe("Manage user permissions endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const usersBaseEndpoint = "/api/users";
  const usersSystemPermissionsEndpoint = "/api/users/system-permissions";
  const usersDepartmentPermissionsEndpoint = "/api/users/department-permissions";

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

    let adminUser: User;
    let userToUpdatePermissions: User;
    let itDepartment: Department;
    let financeDepartment: Department;

    beforeAll(async () => {
      adminUser = await User.create(adminUserInfo);
      await adminUser.addUserPermissionString(SystemPermission.ADMIN);

      userToUpdatePermissions = await User.create({
        firstName: "Manage",
        lastName: "Permissions",
        email: "manage@permissions.com",
        password: "Password123!"
      });

      itDepartment = await Department.create({
        name: "IT",
        description: "IT Department"
      });

      financeDepartment = await Department.create({
        name: "Finance",
        description: "Finance Department"
      });

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
    });

    afterAll(async () => {
      await PermissionAuditLog.destroy({ where: {} });
      await User.destroy({ where: {}, cascade: true });
      await Department.destroy({ where: {}, cascade: true });
    });

    describe("GET /users", () => {
      it("should retrieve all users", async () => {
        const response = await agent.get(usersBaseEndpoint).expect(200);

        // User to manage permissions and admin
        expect(response.body).toHaveLength(2);
        const user: UserWithPermissionsDTO = response.body.find(
          (u: User) => u.id == userToUpdatePermissions.id
        );
        expect(user).not.toBeNull();
        expect(user.id).toBe(userToUpdatePermissions.id);
        expect(user.email).toBe(userToUpdatePermissions.email);
        expect(user.systemPermissions).toHaveLength(0);
        expect(user.departments).toHaveLength(0);
      });
    });

    describe("PUT /users", () => {
      it("should update specific user system permission", async () => {
        const response = await agent
          .put(`${usersSystemPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            systemPermissions: [
              SystemPermission.CREATE_DEPARTMENT,
              SystemPermission.DELETE_DEPARTMENT
            ]
          })
          .expect(200);

        expect(response.body).toHaveProperty("message", "System permissions updated successfully");

        const userWithPermissions = await User.findByPk(userToUpdatePermissions.id);
        expect(userWithPermissions).not.toBeNull();
        const userSystemPermissions = await userWithPermissions?.getUserPermissionStrings();
        expect(userSystemPermissions).toHaveLength(2);
        expect(userSystemPermissions).toContain(SystemPermission.CREATE_DEPARTMENT);
        expect(userSystemPermissions).toContain(SystemPermission.DELETE_DEPARTMENT);

        const auditLog = await PermissionAuditService.getAuditHistory({
          performedByUserId: adminUser.id
        });
        expect(auditLog).toHaveLength(1);
        await PermissionAuditLog.destroy({ where: {} });
      });

      it("should update specific user department permission", async () => {
        const response = await agent
          .put(`${usersDepartmentPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            departments: [
              {
                departmentId: itDepartment.id,
                departmentName: itDepartment.name,
                permissions: [DepartmentPermission.APPROVE_EXPENSES]
              },
              {
                departmentId: financeDepartment.id,
                departmentName: financeDepartment.name,
                permissions: [DepartmentPermission.VIEW_EXPENSES]
              }
            ]
          })
          .expect(200);

        expect(response.body).toHaveProperty(
          "message",
          "Department permissions updated successfully"
        );

        const userWithPermissions = await User.findByPk(userToUpdatePermissions.id);
        expect(userWithPermissions).not.toBeNull();

        if (itDepartment.id) {
          const userDepartmentPermissions =
            await userWithPermissions?.getDepartmentPermissionsStrings(itDepartment.id);
          expect(userDepartmentPermissions).toHaveLength(1);
          expect(userDepartmentPermissions).toContain(DepartmentPermission.APPROVE_EXPENSES);
        }
        if (financeDepartment.id) {
          const userDepartmentPermissions =
            await userWithPermissions?.getDepartmentPermissionsStrings(financeDepartment.id);
          expect(userDepartmentPermissions).toHaveLength(1);
          expect(userDepartmentPermissions).toContain(DepartmentPermission.VIEW_EXPENSES);
        }

        const auditLog = await PermissionAuditService.getAuditHistory({
          performedByUserId: adminUser.id
        });
        expect(auditLog).toHaveLength(2);
        await PermissionAuditLog.destroy({ where: {} });
      });

      it("should not find user", async () => {
        const response = await agent.put(`${usersSystemPermissionsEndpoint}/100`).expect(404);

        expect(response.body).toHaveProperty("error", "User not found");
      });

      it("should throw invalid id", async () => {
        const response = await agent.put(`${usersSystemPermissionsEndpoint}/abc`).expect(400);

        expect(response.body).toHaveProperty("error", "Invalid user id");
      });

      it("should not find user", async () => {
        const response = await agent.put(`${usersDepartmentPermissionsEndpoint}/100`).expect(404);

        expect(response.body).toHaveProperty("error", "User not found");
      });

      it("should throw invalid id", async () => {
        const response = await agent.put(`${usersDepartmentPermissionsEndpoint}/abc`).expect(400);

        expect(response.body).toHaveProperty("error", "Invalid user id");
      });
    });
  });

  describe("Authenticated manage permissions user", () => {
    const permissionsManagerUserInfo = {
      firstName: "Permissions",
      lastName: "manager",
      email: "permissions@manager.com",
      password: "Password123!"
    };

    let permissionsManagerUser: User;
    let userToUpdatePermissions: User;
    let itDepartment: Department;
    let financeDepartment: Department;

    beforeAll(async () => {
      permissionsManagerUser = await User.create(permissionsManagerUserInfo);
      await permissionsManagerUser.addUserPermissionString(
        SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS
      );

      userToUpdatePermissions = await User.create({
        firstName: "Manage",
        lastName: "Permissions",
        email: "manage@permissions.com",
        password: "Password123!"
      });

      itDepartment = await Department.create({
        name: "IT",
        description: "IT Department"
      });

      financeDepartment = await Department.create({
        name: "Finance",
        description: "Finance Department"
      });

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(permissionsManagerUserInfo).expect(200);
    });

    afterAll(async () => {
      await PermissionAuditLog.destroy({ where: {} });
      await User.destroy({ where: {}, cascade: true });
      await Department.destroy({ where: {}, cascade: true });
    });

    describe("GET /users", () => {
      it("should retrieve all users", async () => {
        const response = await agent.get(usersBaseEndpoint).expect(200);

        // User to manage permissions and admin
        expect(response.body).toHaveLength(2);
        const user: UserWithPermissionsDTO = response.body.find(
          (u: User) => u.id == userToUpdatePermissions.id
        );
        expect(user).not.toBeNull();
        expect(user.id).toBe(userToUpdatePermissions.id);
        expect(user.email).toBe(userToUpdatePermissions.email);
        expect(user.systemPermissions).toHaveLength(0);
        expect(user.departments).toHaveLength(0);
      });
    });

    describe("PUT /users", () => {
      it("should not update specific user system permission", async () => {
        await agent
          .put(`${usersSystemPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            systemPermissions: [
              SystemPermission.CREATE_DEPARTMENT,
              SystemPermission.DELETE_DEPARTMENT
            ]
          })
          .expect(403);
      });

      it("should not update specific user system permission", async () => {
        const response = await agent
          .put(`${usersDepartmentPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            departments: [
              {
                departmentId: itDepartment.id,
                departmentName: itDepartment.name,
                permissions: [DepartmentPermission.APPROVE_EXPENSES]
              },
              {
                departmentId: financeDepartment.id,
                departmentName: financeDepartment.name,
                permissions: [DepartmentPermission.VIEW_EXPENSES]
              }
            ]
          })
          .expect(200);

        expect(response.body).toHaveProperty(
          "message",
          "Department permissions updated successfully"
        );

        const userWithPermissions = await User.findByPk(userToUpdatePermissions.id);
        expect(userWithPermissions).not.toBeNull();

        if (itDepartment.id) {
          const userDepartmentPermissions =
            await userWithPermissions?.getDepartmentPermissionsStrings(itDepartment.id);
          expect(userDepartmentPermissions).toHaveLength(1);
          expect(userDepartmentPermissions).toContain(DepartmentPermission.APPROVE_EXPENSES);
        }
        if (financeDepartment.id) {
          const userDepartmentPermissions =
            await userWithPermissions?.getDepartmentPermissionsStrings(financeDepartment.id);
          expect(userDepartmentPermissions).toHaveLength(1);
          expect(userDepartmentPermissions).toContain(DepartmentPermission.VIEW_EXPENSES);
        }

        const auditLog = await PermissionAuditService.getAuditHistory({
          performedByUserId: permissionsManagerUser.id
        });
        expect(auditLog).toHaveLength(2);
      });

      it("should not have permissions", async () => {
        await agent.put(`${usersSystemPermissionsEndpoint}/100`).expect(403);
      });

      it("should not throw invalid id due to forbidden", async () => {
        await agent.put(`${usersSystemPermissionsEndpoint}/abc`).expect(403);
      });

      it("should not find user", async () => {
        const response = await agent.put(`${usersDepartmentPermissionsEndpoint}/100`).expect(404);

        expect(response.body).toHaveProperty("error", "User not found");
      });

      it("should throw invalid id", async () => {
        const response = await agent.put(`${usersDepartmentPermissionsEndpoint}/abc`).expect(400);

        expect(response.body).toHaveProperty("error", "Invalid user id");
      });
    });
  });

  describe("Authenticated manage system permissions user", () => {
    const permissionsManagerUserInfo = {
      firstName: "Permissions",
      lastName: "manager",
      email: "permissions@manager.com",
      password: "Password123!"
    };

    let permissionsManagerUser: User;
    let userToUpdatePermissions: User;
    let itDepartment: Department;
    let financeDepartment: Department;

    beforeAll(async () => {
      permissionsManagerUser = await User.create(permissionsManagerUserInfo);
      await permissionsManagerUser.addUserPermissionString(
        SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS
      );

      userToUpdatePermissions = await User.create({
        firstName: "Manage",
        lastName: "Permissions",
        email: "manage@permissions.com",
        password: "Password123!"
      });

      itDepartment = await Department.create({
        name: "IT",
        description: "IT Department"
      });

      financeDepartment = await Department.create({
        name: "Finance",
        description: "Finance Department"
      });

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(permissionsManagerUserInfo).expect(200);
    });

    afterAll(async () => {
      await PermissionAuditLog.destroy({ where: {} });
      await User.destroy({ where: {}, cascade: true });
      await Department.destroy({ where: {}, cascade: true });
    });

    describe("GET /users", () => {
      it("should retrieve all users", async () => {
        const response = await agent.get(usersBaseEndpoint).expect(200);

        // User to manage permissions and admin
        expect(response.body).toHaveLength(2);
        const user: UserWithPermissionsDTO = response.body.find(
          (u: User) => u.id == userToUpdatePermissions.id
        );
        expect(user).not.toBeNull();
        expect(user.id).toBe(userToUpdatePermissions.id);
        expect(user.email).toBe(userToUpdatePermissions.email);
        expect(user.systemPermissions).toHaveLength(0);
        expect(user.departments).toHaveLength(0);
      });
    });

    describe("PUT /users", () => {
      it("should update specific user system permission", async () => {
        const response = await agent
          .put(`${usersSystemPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            systemPermissions: [
              SystemPermission.CREATE_DEPARTMENT,
              SystemPermission.DELETE_DEPARTMENT
            ]
          })
          .expect(200);

        expect(response.body).toHaveProperty("message", "System permissions updated successfully");

        const userWithPermissions = await User.findByPk(userToUpdatePermissions.id);
        expect(userWithPermissions).not.toBeNull();
        const userSystemPermissions = await userWithPermissions?.getUserPermissionStrings();
        expect(userSystemPermissions).toHaveLength(2);
        expect(userSystemPermissions).toContain(SystemPermission.CREATE_DEPARTMENT);
        expect(userSystemPermissions).toContain(SystemPermission.DELETE_DEPARTMENT);

        const auditLog = await PermissionAuditService.getAuditHistory({
          performedByUserId: permissionsManagerUser.id
        });
        expect(auditLog).toHaveLength(1);
        await PermissionAuditLog.destroy({ where: {} });
      });

      it("should not update specific user department permission", async () => {
        await agent
          .put(`${usersDepartmentPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            departments: [
              {
                departmentId: itDepartment.id,
                departmentName: itDepartment.name,
                permissions: [DepartmentPermission.APPROVE_EXPENSES]
              },
              {
                departmentId: financeDepartment.id,
                departmentName: financeDepartment.name,
                permissions: [DepartmentPermission.VIEW_EXPENSES]
              }
            ]
          })
          .expect(403);
      });

      it("should not find user", async () => {
        const response = await agent.put(`${usersSystemPermissionsEndpoint}/100`).expect(404);

        expect(response.body).toHaveProperty("error", "User not found");
      });

      it("should throw invalid id", async () => {
        const response = await agent.put(`${usersSystemPermissionsEndpoint}/abc`).expect(400);

        expect(response.body).toHaveProperty("error", "Invalid user id");
      });

      it("should throw forbidden", async () => {
        await agent.put(`${usersDepartmentPermissionsEndpoint}/100`).expect(403);
      });

      it("should not throw invalid id due to forbidden", async () => {
        await agent.put(`${usersDepartmentPermissionsEndpoint}/abc`).expect(403);
      });
    });
  });

  describe("Authenticated no permission user", () => {
    const noPermissionsUserInfo = {
      firstName: "No",
      lastName: "Permissions",
      email: "no@permissions.com",
      password: "Password123!"
    };

    let userToUpdatePermissions: User;
    let itDepartment: Department;
    let financeDepartment: Department;

    beforeAll(async () => {
      await User.create(noPermissionsUserInfo);

      userToUpdatePermissions = await User.create({
        firstName: "Manage",
        lastName: "Permissions",
        email: "manage@permissions.com",
        password: "Password123!"
      });

      itDepartment = await Department.create({
        name: "IT",
        description: "IT Department"
      });

      financeDepartment = await Department.create({
        name: "Finance",
        description: "Finance Department"
      });

      agent = request.agent(app);
      await agent.post("/api/auth/login").send(noPermissionsUserInfo).expect(200);
    });

    afterAll(async () => {
      await PermissionAuditLog.destroy({ where: {} });
      await User.destroy({ where: {}, cascade: true });
      await Department.destroy({ where: {}, cascade: true });
    });

    describe("GET /users", () => {
      it("should not retrieve all users", async () => {
        await agent.get(usersBaseEndpoint).expect(403);
      });
    });

    describe("PUT /users", () => {
      it("should not update specific user system permission", async () => {
        await agent
          .put(`${usersSystemPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            systemPermissions: [
              SystemPermission.CREATE_DEPARTMENT,
              SystemPermission.DELETE_DEPARTMENT
            ]
          })
          .expect(403);
      });

      it("should not update specific user department permission", async () => {
        await agent
          .put(`${usersDepartmentPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            departments: [
              {
                departmentId: itDepartment.id,
                departmentName: itDepartment.name,
                permissions: [DepartmentPermission.APPROVE_EXPENSES]
              },
              {
                departmentId: financeDepartment.id,
                departmentName: financeDepartment.name,
                permissions: [DepartmentPermission.VIEW_EXPENSES]
              }
            ]
          })
          .expect(403);
      });

      it("should not throw invalid id due to forbidden", async () => {
        await agent.put(`${usersSystemPermissionsEndpoint}/abc`).expect(403);
      });

      it("should not throw invalid id due to forbidden", async () => {
        await agent.put(`${usersDepartmentPermissionsEndpoint}/abc`).expect(403);
      });
    });
  });

  describe("User not authenticated", () => {
    let userToUpdatePermissions: User;
    let itDepartment: Department;
    let financeDepartment: Department;

    beforeAll(async () => {
      userToUpdatePermissions = await User.create({
        firstName: "Manage",
        lastName: "Permissions",
        email: "manage@permissions.com",
        password: "Password123!"
      });

      itDepartment = await Department.create({
        name: "IT",
        description: "IT Department"
      });

      financeDepartment = await Department.create({
        name: "Finance",
        description: "Finance Department"
      });

      agent = request.agent(app);
    });

    afterAll(async () => {
      await PermissionAuditLog.destroy({ where: {} });
      await User.destroy({ where: {}, cascade: true });
      await Department.destroy({ where: {}, cascade: true });
    });

    describe("GET /users", () => {
      it("should not retrieve all users", async () => {
        await agent.get(usersBaseEndpoint).expect(401);
      });
    });

    describe("PUT /users", () => {
      it("should not update specific user system permission", async () => {
        await agent
          .put(`${usersSystemPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            systemPermissions: [
              SystemPermission.CREATE_DEPARTMENT,
              SystemPermission.DELETE_DEPARTMENT
            ]
          })
          .expect(401);
      });
    });

    describe("PUT /users", () => {
      it("should not update specific user system permission", async () => {
        await agent
          .put(`${usersDepartmentPermissionsEndpoint}/${userToUpdatePermissions.id}`)
          .send({
            departments: [
              {
                departmentId: itDepartment.id,
                departmentName: itDepartment.name,
                permissions: [DepartmentPermission.APPROVE_EXPENSES]
              },
              {
                departmentId: financeDepartment.id,
                departmentName: financeDepartment.name,
                permissions: [DepartmentPermission.VIEW_EXPENSES]
              }
            ]
          })
          .expect(401);
      });

      it("should not throw invalid id due to unauthorized", async () => {
        await agent.put(`${usersSystemPermissionsEndpoint}/abc`).expect(401);
      });

      it("should not throw invalid id due to unauthorized", async () => {
        await agent.put(`${usersDepartmentPermissionsEndpoint}/abc`).expect(401);
      });
    });
  });
});
