import request from "supertest";
import sequelize from "../src/config/database";
import app, { startServer } from "../src/index";
import { IncomingMessage, Server, ServerResponse } from "http";

let server: Server<typeof IncomingMessage, typeof ServerResponse>;

beforeAll(async () => {
  server = await startServer();
});

describe("Expenses", () => {
  it("should insert expense", async () => {
    const response = await request(app).post("/");
    expect(response.status).toBe(200);
    expect(response.body.description).toBe("Lunch");
  });

  it("should check expense exist", async () => {
    const response = await request(app).get("/expenses");
    expect(response.status).toBe(200);
    const expenses = response.body;
    const [firstExpense] = expenses;
    expect(firstExpense.description).toBe("Lunch");
  });
});

afterAll(async () => {
  //   await sequelize.drop();
  await sequelize.close(); // Close connection after tests
  if (server) {
    server.close();
  }
});
