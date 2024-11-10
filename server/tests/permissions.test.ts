import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import { SystemPermission } from "../src/types/auth";
import { checkPermission, userHasPermission } from "../src/middlewares/checkPermission";
import UserPermission from "../src/models/UserPermission";
import UserDepartmentPermission from "../src/models/UserDepartmentPermission";

describe("Permissions validation", () => {
  let server: Server;
  let user: User;

  beforeAll(async () => {
    server = await startServer();

    await User.destroy({ where: {}, cascade: true });

    const validUser = {
      firstName: "Valid",
      lastName: "User",
      email: "test@example.com",
      password: "Password123!"
    };

    user = await User.create(validUser);
  });

  afterAll(async () => {
    await sequelize.close(); // Close connection after tests
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    await UserPermission.destroy({ where: {} });
    await UserDepartmentPermission.destroy({ where: {} });
  });

  describe("Has Permission string", () => {
    it("should have create department permissions", async () => {
      await user.addUserPermissionString(SystemPermission.CREATE_DEPARTMENT);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(true);
    });

    it("should not have create department permission", async () => {
      await user.addUserPermissionString(SystemPermission.DELETE_DEPARTMENT);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(false);
    });

    it("even being admin, has permission should check permission string explicitly", async () => {
      await user.addUserPermissionString(SystemPermission.ADMIN);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(false);
    });
  });

  describe("Remove permissions string", () => {
    beforeEach(async () => {
      await user.addUserPermissionString(SystemPermission.CREATE_DEPARTMENT);
    });

    it("should remove create department permissions properly", async () => {
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(true);
      await user.removeUserPermissionString(SystemPermission.CREATE_DEPARTMENT);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(false);
    });

    it("should not remove create department permission", async () => {
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(true);
      await user.removeUserPermissionString(SystemPermission.ADMIN);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(true);
    });

    it("should remove all permissions", async () => {
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(true);
      await user.setUserPermissionStrings([]);
      expect(await user.hasPermissionString(SystemPermission.CREATE_DEPARTMENT)).toBe(false);
    });
  });

  describe("Check permissions", () => {
    it("should allow permission if permission set", async () => {
      await user.addUserPermissionString(SystemPermission.CREATE_DEPARTMENT);
      expect(await userHasPermission(user, SystemPermission.CREATE_DEPARTMENT)).toBe(true);
    });

    it("should not allow permission if different permission set", async () => {
      await user.addUserPermissionString(SystemPermission.DELETE_DEPARTMENT);
      expect(await userHasPermission(user, SystemPermission.CREATE_DEPARTMENT)).toBe(false);
    });

    it("should allow permission if admin", async () => {
      await user.addUserPermissionString(SystemPermission.ADMIN);
      expect(await userHasPermission(user, SystemPermission.CREATE_DEPARTMENT)).toBe(true);
    });
  });
});
