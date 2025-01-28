import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";
import ExpenseStatus from "../src/models/ExpenseStatus";
import Expense from "../src/models/Expense";
import { Category } from "../src/models/Category";
import { CurrencyEnum, ExpenseStatusEnum, NextApproverType } from "../src/types/expense";
import { Rule, RuleStep } from "../src/models/Rule";
import { seedDemoData } from "../src/seeders/demoDataHelper";

const createExpenseForITLeaderApproval = async (draft = false) => {
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
    isDraft: draft
  };

  return { itDepartment, expenseData };
};

describe("Expense Endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const expensesBaseEndpoint = "/api/expenses";

  beforeAll(async () => {
    server = await startServer();

    await seedDemoData();
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

  afterEach(async () => {
    // Clean up
    await ExpenseStatus.destroy({ where: {} });
    await Expense.destroy({ where: {} });
  });

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
        const { itDepartment, expenseData } = await createExpenseForITLeaderApproval(true);

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

      it("should create a new expense with valid data - should go to leader approval", async () => {
        const { itDepartment, expenseData } = await createExpenseForITLeaderApproval();

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
        expect(createdExpense?.currentStatus).toBe(ExpenseStatusEnum.WAITING_WORKFLOW);
        expect(createdExpense?.expenseStatuses).toHaveLength(1);

        // wait 500 ms for the rule to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        const itLeader = await User.findOne({ where: { email: "it_leader@example.com" } });

        const updatedExpense = await Expense.findByPk(response.body.expenseId, {
          include: ["expenseStatuses"]
        });

        expect(updatedExpense?.nextApproverType).toBe(NextApproverType.USER);
        expect(updatedExpense?.nextApproverId).toBe(itLeader?.id);
        expect(updatedExpense?.expenseStatuses).toHaveLength(2);
      });
    });
  });
  describe("Validate approval flow", () => {
    const adminUserInfo = {
      firstName: "Admin",
      lastName: "Example",
      email: "admin@example.com",
      password: "admin123"
    };

    const itLeaderUserInfo = {
      firstName: "IT",
      lastName: "Leader",
      email: "it_leader@example.com",
      password: "ITLeader123"
    };

    let adminUser: User | null;
    let itLeaderUser: User | null;

    it("Should create and approve new expense", async () => {
      adminUser = await User.findOne({ where: { email: adminUserInfo.email } });
      if (!adminUser) {
        return fail("Admin user not found");
      }

      itLeaderUser = await User.findOne({ where: { email: itLeaderUserInfo.email } });
      if (!itLeaderUser) {
        return fail("IT Leader user not found");
      }
      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(adminUserInfo).expect(200);

      const { itDepartment, expenseData } = await createExpenseForITLeaderApproval();

      const response = await agent
        .post(`${expensesBaseEndpoint}/${itDepartment.id}`)
        .send(expenseData)
        .expect(201);

      const expenseIdToApprove = response.body.expenseId;

      await agent.post("/api/auth/logout").expect(200);

      // wait 500 ms for the rule to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      await agent.post("/api/auth/login").send(itLeaderUserInfo).expect(200);

      const approveResponse = await agent
        .put(`${expensesBaseEndpoint}/${itDepartment.id}/approve/${expenseIdToApprove}`)
        .send({ comment: "Approved" })
        .expect(200);

      expect(approveResponse.body).toHaveProperty("message", "Expense approved successfully");

      // wait 500 ms for expense to be approved(need to process if there is another step for approval or not)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const approvedExpense = await Expense.findByPk(expenseIdToApprove, {
        include: ["expenseStatuses"]
      });

      expect(approvedExpense?.requesterId).toBe(adminUser?.id);
      expect(approvedExpense?.currentStatus).toBe(ExpenseStatusEnum.APPROVED);
      expect(approvedExpense?.expenseStatuses).toHaveLength(3);

      const approvedStatus = approvedExpense?.expenseStatuses?.find(
        (s) => s.status === ExpenseStatusEnum.APPROVED
      );
      expect(approvedStatus?.userId).toBe(itLeaderUser?.id);
      expect(approvedStatus?.comment).toBe("Approved");
    });
  });
});
