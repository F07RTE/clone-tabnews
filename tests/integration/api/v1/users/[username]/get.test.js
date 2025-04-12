import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "SameCase",
          email: "same.case@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch(
        "http://localhost:3000/api/v1/users/SameCase",
      );

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "SameCase",
        email: "same.case@test.com",
        password: "senha123",
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });
    });

    test("With case mismatch", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "DifferentCase",
          email: "different.case@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch(
        "http://localhost:3000/api/v1/users/differentcase",
      );

      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: "DifferentCase",
        email: "different.case@test.com",
        password: "senha123",
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });
    });

    test("With nonexistent username", async () => {
      var response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistentuser",
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The user name was not found.",
        action: "Please, check if the user name is correct.",
        status_code: 404,
      });
    });
  });
});
