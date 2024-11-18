import sequelize from "../config/database";

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      await sequelize.sync({ force: true }); // Be careful with this in production!
    }
    console.log("Database synced successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error syncing database:", error);
    process.exit(1);
  }
};

await syncDatabase();
