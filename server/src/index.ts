import express from "express";
const app = express();
import cors from "cors";
import { createDatabaseIfNeeded } from "./helpers/createDatabaseIfNeeded";
import authRoutes from "./routes/auth";
import departmentRoutes from "./routes/department";
import userRoutes from "./routes/user";
import session from "express-session";
import passport from "passport";
import "./config/passport";
import sequelize from "./config/database";
import { seedUserPermission } from "./seeders/seedUserPermission";
import { defineAssociations } from "./models/associations";

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
      await sequelize.sync({ alter: true }); // Be careful with this in production!
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

  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await initDatabase();

  // Mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/users", userRoutes);

  const server = app.listen(8081, () => {
    console.log("Server listening on port 8081");
  });

  return server;
};

if (process.env.NODE_ENV != "test") {
  startServer();
}

export default app;
