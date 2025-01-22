import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import TestAgent from "supertest/lib/agent";
import {
    ExpenseStatusEnum,
    CurrencyEnum
} from "../src/types/expense";
import { Category } from "../src/models/Category";
import Department from "../src/models/Department";
import Expenense from "../src/models/Expense";
import User from "../src/models/User";
import { SystemPermission } from "../src/types/auth";
import Expense from "../src/models/Expense";

describe("Data Analysis Endpoints", () => {
    let server: Server;
    let agent: TestAgent;

    const dataAnalysisBaseEndpoint = "/api/dataAnalysis";

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

        beforeAll(async () => {
            // Create admin user with ADMIN permission
            adminUser = await User.create(adminUserInfo);
            await adminUser.addUserPermissionString(SystemPermission.ADMIN);

            // Login
            agent = request.agent(app);
            await agent.post("/api/auth/login").send(adminUserInfo).expect(200);
        });

        afterAll(async () => {
            // Clean up
            await User.destroy({ where: {} });
        });

        describe("First test round", () => {

            let categoryOne: Category;
            let categoryTwo: Category;
            let testDepartmentOne: Department;
            let testDepartmentTwo: Department;

            beforeAll(async () => {

                // Create a test department
                testDepartmentOne = await Department.create({
                    name: "Test Department 01",
                    description: "Department for Category Testing"
                });
                testDepartmentTwo = await Department.create({
                    name: "Test Department 02",
                    description: "Department for Category Testing"
                });

                // Create a test Category
                categoryOne = await Category.create({
                    departmentId: testDepartmentOne.id,
                    name: "Category One"
                });
                categoryTwo = await Category.create({
                    departmentId: testDepartmentTwo.id,
                    name: "Category Two"
                });

                // Create a test Expenses
                await Expenense.create({
                    id: 0,
                    amount: 500,
                    departmentId: testDepartmentOne.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.APPROVED,
                    categoryId: categoryOne.id,
                    title: "Expense test 01",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 1000,
                    departmentId: testDepartmentOne.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.CANCELLED,
                    categoryId: categoryOne.id,
                    title: "Expense test 02",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 100.5,
                    departmentId: testDepartmentTwo.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.PENDING_APPROVAL,
                    categoryId: categoryTwo.id,
                    title: "Expense test 03",
                    date: new Date()
                });
            });

            afterAll(async () => {
                // Clean up
                await Expense.destroy({ where: {} });
                await Category.destroy({ where: {} });
                await Department.destroy({ where: {} });
            });

            it("should return /statuses-count with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/statuses-count").send(request).expect(200);
                const expectedResults = [
                    { status: "PENDING", count: 1 },
                    { status: "APPROVED", count: 1 },
                    { status: "REJECTED", count: 0 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /statuses-amount with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/statuses-amount").send(request).expect(200);
                const expectedResults = [
                    { status: "PENDING", amount: 100.5 },
                    { status: "APPROVED", amount: 500 },
                    { status: "REJECTED", amount: 0 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /amount-month with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-month").send(request).expect(200);
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const currentMonth = new Date().getMonth();
                const expectedResults = [
                    { month: monthNames[currentMonth], amount: 500 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /summary with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/summary").send(request).expect(200);
                const expectedResults = {
                    totalAmount: 500,
                    expenses: 3,
                    departments: 2,
                    pending: 1
                };
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /total-expenses-category-status with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/total-expenses-category-status").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    APPROVED: 1,
                    PENDING: 0,
                    REJECTED: 0,
                  },
                  {
                    category: categoryTwo.name,
                    APPROVED: 0,
                    PENDING: 1,
                    REJECTED: 0,
                  }];
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /amount-expenses-category-status with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-expenses-category-status").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    APPROVED: 500,
                    PENDING: 0,
                    REJECTED: 0,
                  },
                  {
                    category: categoryTwo.name,
                    APPROVED: 0,
                    PENDING: 100.5,
                    REJECTED: 0,
                  }];
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /amount-expenses-category with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-expenses-category").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    count: 1,
                  },
                  {
                    category: categoryTwo.name,
                    count: 1,
                  }];
                expect(response.body).toEqual(expectedResults);
            });
        });

        describe("Second test round", () => {

            let categoryOne: Category;
            let categoryTwo: Category;
            let testDepartmentOne: Department;
            let testDepartmentTwo: Department;

            beforeAll(async () => {

                // Create a test department
                testDepartmentOne = await Department.create({
                    name: "Test Department 01",
                    description: "Department for Category Testing"
                });
                testDepartmentTwo = await Department.create({
                    name: "Test Department 02",
                    description: "Department for Category Testing"
                });

                // Create a test Category
                categoryOne = await Category.create({
                    departmentId: testDepartmentOne.id,
                    name: "Category One"
                });
                categoryTwo = await Category.create({
                    departmentId: testDepartmentTwo.id,
                    name: "Category Two"
                });

                // Create a test Expenses
                await Expenense.create({
                    id: 0,
                    amount: 55.4,
                    departmentId: testDepartmentOne.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.APPROVED,
                    categoryId: categoryOne.id,
                    title: "Expense test 01",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 1200,
                    departmentId: testDepartmentTwo.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.APPROVED,
                    categoryId: categoryTwo.id,
                    title: "Expense test 01",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 1000,
                    departmentId: testDepartmentTwo.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.APPROVED,
                    categoryId: categoryTwo.id,
                    title: "Expense test 02",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 50,
                    departmentId: testDepartmentOne.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.REJECTED,
                    categoryId: categoryOne.id,
                    title: "Expense test 02",
                    date: new Date()
                });
                await Expenense.create({
                    id: 0,
                    amount: 25.90,
                    departmentId: testDepartmentOne.id!,
                    justification: "Expense created for test",
                    requesterId: adminUser.id!,
                    currency: CurrencyEnum.CAD,
                    currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO,
                    categoryId: categoryOne.id,
                    title: "Expense test 03",
                    date: new Date()
                });
            });

            afterAll(async () => {
                // Clean up
                await Expense.destroy({ where: {} });
                await Category.destroy({ where: {} });
                await Department.destroy({ where: {} });
            });

            it("should return /statuses-count with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/statuses-count").send(request).expect(200);
                const expectedResults = [
                    { status: "PENDING", count: 1 },
                    { status: "APPROVED", count: 3 },
                    { status: "REJECTED", count: 1 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /statuses-amount with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/statuses-amount").send(request).expect(200);
                const expectedResults = [
                    { status: "PENDING", amount: 25.9 },
                    { status: "APPROVED", amount: 2255.4 },
                    { status: "REJECTED", amount: 50 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /amount-month with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-month").send(request).expect(200);
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const currentMonth = new Date().getMonth();
                const expectedResults = [
                    { month: monthNames[currentMonth], amount: 2255.4 },
                ];
                expect(response.body).toEqual(expect.arrayContaining(expectedResults));
            });

            it("should return /summary with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/summary").send(request).expect(200);
                const expectedResults = {
                    totalAmount: 2255.4,
                    expenses: 5,
                    departments: 2,
                    pending: 1
                };
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /total-expenses-category-status with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/total-expenses-category-status").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    APPROVED: 1,
                    PENDING: 1,
                    REJECTED: 1,
                  },
                  {
                    category: categoryTwo.name,
                    APPROVED: 2,
                    PENDING: 0,
                    REJECTED: 0,
                  }];
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /amount-expenses-category-status with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-expenses-category-status").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    APPROVED: 55.4,
                    PENDING: 25.9,
                    REJECTED: 50,
                  },
                  {
                    category: categoryTwo.name,
                    APPROVED: 2200,
                    PENDING: 0,
                    REJECTED: 0,
                  }];
                expect(response.body).toEqual(expectedResults);
            });

            it("should return /amount-expenses-category with valid data", async () => {
                const request = {
                    departmentId: "",
                    startDate: "",
                    endDate: ""
                };

                const response = await agent.get(dataAnalysisBaseEndpoint + "/amount-expenses-category").send(request).expect(200);
                const expectedResults = [{
                    category: categoryOne.name,
                    count: 3,
                  },
                  {
                    category: categoryTwo.name,
                    count: 2,
                  }];
                expect(response.body).toEqual(expectedResults);
            });
        });
    });
});