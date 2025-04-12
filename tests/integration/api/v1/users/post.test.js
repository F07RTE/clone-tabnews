import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      var response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "guilhermeforte",
          email: "guilhermeforte@test.com",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "guilhermeforte",
        email: "guilhermeforte@test.com",
        password: "senha123",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated 'email'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicateduseremail1",
          email: "duplicateduseremail@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicateduseremail2",
          email: "Duplicateduseremail@test.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);
      var responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this email.",
        action: "Please, use a different email to register.",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedusername",
          email: "duplicatedusername1@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Duplicatedusername",
          email: "duplicatedusername2@test.com",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);

      var responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this user name.",
        action: "Please, use a different user name to register.",
        status_code: 400,
      });
    });
  });
});
