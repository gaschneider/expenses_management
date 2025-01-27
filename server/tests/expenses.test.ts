import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";
import "../src/seeders/seedDemoData";
import ExpenseStatus from "../src/models/ExpenseStatus";
import Expense from "../src/models/Expense";
import { Category } from "../src/models/Category";
import { CurrencyEnum, ExpenseStatusEnum } from "../src/types/expense";
import { Rule, RuleStep } from "../src/models/Rule";

describe("Expense Endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const expensesBaseEndpoint = "/api/expenses";

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await Expense.destroy({ where: {} });
    await RuleStep.destroy({ where: {} });
    await Rule.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Department.destroy({ where: {} });
    await User.destroy({ where: {} });

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
      password: "admin123"
    };

    let adminUser: User | null;

    beforeAll(async () => {
      // Create admin user
      adminUser = await User.findOne({ where: { email: adminUserInfo.email } });
      if (!adminUser) {
        return fail("Admin user not found");
      }
      await adminUser.addUserPermissionString(SystemPermission.ADMIN);

      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
    });

    afterEach(async () => {
      // Clean up
      await ExpenseStatus.destroy({ where: {} });
      await Expense.destroy({ where: {} });
    });

    describe("POST /expense", () => {
      it("should create a new draft expense with valid data", async () => {
        const itDepartment = await Department.findOne({ where: { name: "IT" } });
        if (!itDepartment || !itDepartment.id) {
          return fail("IT department not found");
        }
        const travelCategory = await Category.findOne({
          where: { name: "Travel", departmentId: itDepartment.id }
        });
        if (!travelCategory) {
          return fail("Travel category not found");
        }

        const expenseData = {
          categoryId: travelCategory.id,
          departmentId: itDepartment.id,
          amount: 95.0,
          title: "Flight to conference",
          justification: "Attending conference to learn new technologies",
          date: new Date(),
          currency: CurrencyEnum.CAD,
          isDraft: true
        };

        const response = await agent
          .post(`${expensesBaseEndpoint}/${itDepartment.id}`)
          .send(expenseData)
          .expect(201);

        expect(response.body).toHaveProperty("message", "Expense created successfully");

        // Verify rule steps were created
        const createdExpense = await Expense.findByPk(response.body.expenseId, {
          include: ["expenseStatuses"]
        });

        expect(createdExpense?.departmentId).toBe(expenseData.departmentId);
        expect(createdExpense?.requesterId).toBe(adminUser?.id);
        expect(createdExpense?.currentStatus).toBe(ExpenseStatusEnum.DRAFT);
        expect(createdExpense?.expenseStatuses).toHaveLength(1);
      });
    });
  });
});
