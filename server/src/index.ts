import express from "express";
import cors from "cors";
import { createDatabaseIfNeeded } from "./helpers/createDatabaseIfNeeded";
import authRoutes from "./routes/auth";
import departmentRoutes from "./routes/department";
import userRoutes from "./routes/user";
import ruleRoutes from "./routes/rule";
import dataAnalysis from "./routes/dataAnalysis";
import session from "express-session";
import categoryRoutes from "./routes/category";
import expenseRoutes from "./routes/expense";
import passport from "passport";
import "./config/passport";
import sequelize from "./config/database";
import { seedUserPermission } from "./seeders/seedUserPermission";
import { defineAssociations } from "./models/associations";
import { setupSessionMiddleware } from "./middlewares/sessionStoreMiddleware";
import { WorkflowConfig } from "./config/workflow";
const app = express();

const initDatabase = async () => {
  try {
    await createDatabaseIfNeeded();
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    defineAssociations();
    // Sync all models
    // Note: force: true will drop tables if they exist
    // Use force: false in production!
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      //await sequelize.sync({ alter: true }); // Be careful with this in production!
    }
    console.log("Database synchronized successfully.");
    if (process.env.NODE_ENV !== "test") {
      await seedUserPermission();
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

export const startServer = async () => {
  app.use(
    cors({
      origin: "http://localhost:3000", // or your frontend URL
      credentials: true // Important for authentication
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  await initDatabase();

  const { sessionMiddleware } = setupSessionMiddleware();

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // Mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/rules", ruleRoutes);
  app.use("/api/dataAnalysis", dataAnalysis);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/expenses", expenseRoutes);

  // Initialize workflow configuration
  WorkflowConfig.getInstance();

  const server = app.listen(8081, () => {
    console.log("Server listening on port 8081");
  });

  app.on("close", () => sequelize.close());

  return server;
};

if (process.env.NODE_ENV != "test") {
  startServer();
}

export default app;
