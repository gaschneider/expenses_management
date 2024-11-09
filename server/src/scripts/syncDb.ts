import sequelize from "../config/database";

const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      sequelize.sync({ force: true }); // Be careful with this in production!
    }
    console.log("Database synced successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error syncing database:", error);
    process.exit(1);
  }
};

syncDatabase();
