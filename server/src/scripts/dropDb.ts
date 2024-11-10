import sequelize from "../config/database";

const dropDb = async () => {
  try {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      sequelize.drop();
      sequelize.close();
    }
    console.log("Database dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error dropping database:", error);
    process.exit(1);
  }
};

dropDb();
