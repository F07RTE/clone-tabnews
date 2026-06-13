import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await orchestrator.createUser({
        username: "SameCase",
        email: "same.case@test.com",
        password: "senha123",
      });

      var response = await fetch("http://localhost:3000/api/v1/users/SameCase");

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "SameCase",
        email: "same.case@test.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With case mismatch", async () => {
      await orchestrator.createUser({
        username: "DifferentCase",
        email: "different.case@test.com",
        password: "senha123",
      });

      var response = await fetch(
        "http://localhost:3000/api/v1/users/differentcase",
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "DifferentCase",
        email: "different.case@test.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
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
