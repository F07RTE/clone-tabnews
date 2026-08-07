import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
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
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUserName("guilhermeforte");
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "wrongPassword",
        userInDatabase.password,
      );

      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated `email`", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
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

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
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
      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this email.",
        action: "Please, use a different email.",
        status_code: 400,
      });
    });

    test("With duplicated `username`", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
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

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
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

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this user name.",
        action: "Please, use a different user name.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1.id);
      const user1Session = await orchestrator.createSession(user1);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1Session.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@test.com",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(403);
      const responseBody = await user2Response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: "Check if the user has the required feature create:user.",
        status_code: 403,
      });
    });
  });
});
