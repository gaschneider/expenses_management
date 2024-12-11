import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { Server } from "http";
import User from "../src/models/User";
import Department from "../src/models/Department";
import { Category } from "../src/models/Category";
import { SystemPermission } from "../src/types/auth";
import TestAgent from "supertest/lib/agent";
import { CategoryToCreateDTO } from "../src/controllers/categoryController";

describe("Category Management Endpoints", () => {
  let server: Server;
  let agent: TestAgent;

  const categoriesBaseEndpoint = "/api/categories";

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await sequelize.close();
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
    let testDepartment: Department;

    beforeAll(async () => {
      // Create admin user with ADMIN permission
      adminUser = await User.create(adminUserInfo);
      await adminUser.addUserPermissionString(SystemPermission.ADMIN);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Category Testing"
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
      await Category.destroy({ where: {} });
    });

    describe("POST /categories", () => {
      it("should create a new category with valid data", async () => {
        const categoryData: CategoryToCreateDTO = {
          departmentId: testDepartment.id,
          name: "Test Category"
        };

        const response = await agent.post(categoriesBaseEndpoint).send(categoryData).expect(201);

        expect(response.body).toHaveProperty("message", "Category created successfully");
        expect(response.body).toHaveProperty("categoryId");

        // Verify category was created
        const createdCategory = await Category.findByPk(response.body.categoryId);
        expect(createdCategory?.name).toBe("Test Category");
        expect(createdCategory?.departmentId).toBe(testDepartment.id);
      });

      it("should create a new global category without department", async () => {
        const categoryData: CategoryToCreateDTO = {
          name: "Global Category"
        };

        const response = await agent.post(categoriesBaseEndpoint).send(categoryData).expect(201);

        expect(response.body).toHaveProperty("message", "Category created successfully");
        expect(response.body).toHaveProperty("categoryId");

        // Verify category was created
        const createdCategory = await Category.findByPk(response.body.categoryId);
        expect(createdCategory?.name).toBe("Global Category");
        expect(createdCategory?.departmentId).toBeNull();
      });

      it("should fail to create a category with an invalid department", async () => {
        const categoryData = {
          departmentId: 999999,
          name: "Invalid Department Category"
        };

        await agent.post(categoriesBaseEndpoint).send(categoryData).expect(400);
      });

      it("should fail to create a category with a duplicate name for department-specific category", async () => {
        // First, create a department-specific category
        await Category.create({
          departmentId: testDepartment.id,
          name: "Unique Category"
        });

        // Try to create another category with the same name
        const categoryData: CategoryToCreateDTO = {
          departmentId: testDepartment.id,
          name: "Unique Category"
        };

        await agent.post(categoriesBaseEndpoint).send(categoryData).expect(404);
      });
    });

    describe("GET /categories", () => {
      let existingCategories: Category[];

      beforeAll(async () => {
        // Create some categories for testing
        existingCategories = await Category.bulkCreate([
          {
            departmentId: testDepartment.id,
            name: "Department Category 1"
          },
          {
            name: "Global Category 1"
          }
        ]);
      });

      it("should retrieve all categories", async () => {
        const response = await agent.get(categoriesBaseEndpoint).expect(200);

        expect(response.body).toHaveLength(existingCategories.length);
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("name");
      });
    });

    describe("GET /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Specific Category"
        });
      });

      it("should retrieve a specific category by id", async () => {
        const response = await agent
          .get(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .expect(200);

        expect(response.body.id).toBe(existingCategory.id);
        expect(response.body.name).toBe("Specific Category");
        expect(response.body.departmentId).toBe(testDepartment.id);
      });

      it("should return 404 for non-existent category", async () => {
        await agent.get(`${categoriesBaseEndpoint}/999999`).expect(404);
      });
    });

    describe("PUT /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Original Category"
        });
      });

      it("should update an existing category", async () => {
        const updateData = {
          name: "Updated Category Name"
        };

        const response = await agent
          .put(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("message", "Category updated successfully");

        // Verify category was updated
        const updatedCategory = await Category.findByPk(existingCategory.id);
        expect(updatedCategory?.name).toBe("Updated Category Name");
      });

      it("should prevent creating a duplicate category name", async () => {
        // Create another category to test name conflict
        await Category.create({
          departmentId: testDepartment.id,
          name: "Conflicting Category"
        });

        const updateData = {
          name: "Conflicting Category"
        };

        await agent
          .put(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .send(updateData)
          .expect(404);
      });
    });

    describe("DELETE /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Category to Delete"
        });
      });

      it("should delete an existing category", async () => {
        await agent.delete(`${categoriesBaseEndpoint}/${existingCategory.id}`).expect(200);

        const deletedCategory = await Category.findByPk(existingCategory.id);
        expect(deletedCategory).toBeNull();
      });

      it("should return 404 when deleting non-existent category", async () => {
        await agent.delete(`${categoriesBaseEndpoint}/999999`).expect(404);
      });
    });
  });

  describe("Authenticated manager", () => {
    const managerUserInfo = {
      firstName: "Manager",
      lastName: "User",
      email: "manager@example.com",
      password: "Password123!"
    };

    let managerUser: User;
    let testDepartment: Department;

    beforeAll(async () => {
      // Create manager user with MANAGE permission
      managerUser = await User.create(managerUserInfo);
      await managerUser.addUserPermissionString(SystemPermission.MANAGE_CATEGORIES);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Category Testing"
      });

      // Login
      agent = request.agent(app);
      await agent.post("/api/auth/login").send(managerUserInfo).expect(200);
    });

    afterAll(async () => {
      // Clean up
      await User.destroy({ where: {} });
      await Department.destroy({ where: {} });
    });

    afterEach(async () => {
      // Clean up
      await Category.destroy({ where: {} });
    });

    describe("POST /categories", () => {
      it("should create a new category with valid data", async () => {
        const categoryData: CategoryToCreateDTO = {
          departmentId: testDepartment.id,
          name: "Test Category"
        };

        const response = await agent.post(categoriesBaseEndpoint).send(categoryData).expect(201);

        expect(response.body).toHaveProperty("message", "Category created successfully");
        expect(response.body).toHaveProperty("categoryId");

        // Verify category was created
        const createdCategory = await Category.findByPk(response.body.categoryId);
        expect(createdCategory?.name).toBe("Test Category");
        expect(createdCategory?.departmentId).toBe(testDepartment.id);
      });

      it("should create a new global category without department", async () => {
        const categoryData: CategoryToCreateDTO = {
          name: "Global Category"
        };

        const response = await agent.post(categoriesBaseEndpoint).send(categoryData).expect(201);

        expect(response.body).toHaveProperty("message", "Category created successfully");
        expect(response.body).toHaveProperty("categoryId");

        // Verify category was created
        const createdCategory = await Category.findByPk(response.body.categoryId);
        expect(createdCategory?.name).toBe("Global Category");
        expect(createdCategory?.departmentId).toBeNull();
      });

      it("should fail to create a category with an invalid department", async () => {
        const categoryData = {
          departmentId: 999999,
          name: "Invalid Department Category"
        };

        await agent.post(categoriesBaseEndpoint).send(categoryData).expect(400);
      });

      it("should fail to create a category with a duplicate name for department-specific category", async () => {
        // First, create a department-specific category
        await Category.create({
          departmentId: testDepartment.id,
          name: "Unique Category"
        });

        // Try to create another category with the same name
        const categoryData: CategoryToCreateDTO = {
          departmentId: testDepartment.id,
          name: "Unique Category"
        };

        await agent.post(categoriesBaseEndpoint).send(categoryData).expect(404);
      });
    });

    describe("GET /categories", () => {
      let existingCategories: Category[];

      beforeAll(async () => {
        // Create some categories for testing
        existingCategories = await Category.bulkCreate([
          {
            departmentId: testDepartment.id,
            name: "Department Category 1"
          },
          {
            name: "Global Category 1"
          }
        ]);
      });

      it("should retrieve all categories", async () => {
        const response = await agent.get(categoriesBaseEndpoint).expect(200);

        expect(response.body).toHaveLength(existingCategories.length);
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("name");
      });
    });

    describe("GET /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Specific Category"
        });
      });

      it("should retrieve a specific category by id", async () => {
        const response = await agent
          .get(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .expect(200);

        expect(response.body.id).toBe(existingCategory.id);
        expect(response.body.name).toBe("Specific Category");
        expect(response.body.departmentId).toBe(testDepartment.id);
      });

      it("should return 404 for non-existent category", async () => {
        await agent.get(`${categoriesBaseEndpoint}/999999`).expect(404);
      });
    });

    describe("PUT /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Original Category"
        });
      });

      it("should update an existing category", async () => {
        const updateData = {
          name: "Updated Category Name"
        };

        const response = await agent
          .put(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("message", "Category updated successfully");

        // Verify category was updated
        const updatedCategory = await Category.findByPk(existingCategory.id);
        expect(updatedCategory?.name).toBe("Updated Category Name");
      });

      it("should prevent creating a duplicate category name", async () => {
        // Create another category to test name conflict
        await Category.create({
          departmentId: testDepartment.id,
          name: "Conflicting Category"
        });

        const updateData = {
          name: "Conflicting Category"
        };

        await agent
          .put(`${categoriesBaseEndpoint}/${existingCategory.id}`)
          .send(updateData)
          .expect(404);
      });
    });

    describe("DELETE /categories/:id", () => {
      let existingCategory: Category;

      beforeAll(async () => {
        existingCategory = await Category.create({
          departmentId: testDepartment.id,
          name: "Category to Delete"
        });
      });

      it("should delete an existing category", async () => {
        await agent.delete(`${categoriesBaseEndpoint}/${existingCategory.id}`).expect(200);

        const deletedCategory = await Category.findByPk(existingCategory.id);
        expect(deletedCategory).toBeNull();
      });

      it("should return 404 when deleting non-existent category", async () => {
        await agent.delete(`${categoriesBaseEndpoint}/999999`).expect(404);
      });
    });
  });

  describe("Authenticated user without MANAGE permission", () => {
    const userWithoutPermission = {
      firstName: "No",
      lastName: "Permission",
      email: "no-permission@example.com",
      password: "Password123!"
    };

    let testDepartment: Department;

    beforeAll(async () => {
      // Create user without special permissions
      await User.create(userWithoutPermission);

      // Create a test department
      testDepartment = await Department.create({
        name: "Test Department",
        description: "Department for Category Testing"
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

    it("should not allow creating a category", async () => {
      const categoryData = {
        departmentId: testDepartment.id,
        name: "Unauthorized Category"
      };

      await agent.post(categoriesBaseEndpoint).send(categoryData).expect(403);
    });

    it("should not allow retrieving categories", async () => {
      await agent.get(categoriesBaseEndpoint).expect(403);
    });

    it("should not allow updating a category", async () => {
      await agent.put(`${categoriesBaseEndpoint}/1`).send({ name: "Updated" }).expect(403);
    });

    it("should not allow deleting a category", async () => {
      await agent.delete(`${categoriesBaseEndpoint}/1`).expect(403);
    });
  });

  describe("Unauthenticated user", () => {
    beforeAll(async () => {
      agent = request.agent(app);
    });

    it("should not allow creating a category", async () => {
      await agent.post(categoriesBaseEndpoint).send({}).expect(401);
    });

    it("should not allow retrieving categories", async () => {
      await agent.get(categoriesBaseEndpoint).expect(401);
    });

    it("should not allow updating a category", async () => {
      await agent.put(`${categoriesBaseEndpoint}/1`).send({}).expect(401);
    });

    it("should not allow deleting a category", async () => {
      await agent.delete(`${categoriesBaseEndpoint}/1`).expect(401);
    });
  });
});
