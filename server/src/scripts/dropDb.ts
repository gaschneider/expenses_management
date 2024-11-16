import sequelize from "../config/database";

const dropDb = async () => {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    try {
      sequelize.authenticate();
      sequelize.drop();
      sequelize.close();
      console.log("Database dropped successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error dropping database:", error);
      process.exit(1);
    }
  } else {
    console.error("Not safe to drop db in environment", process.env.NODE_ENV);
  }
};

dropDb();
