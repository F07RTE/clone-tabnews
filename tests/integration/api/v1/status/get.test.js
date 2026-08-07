import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webserver.origin()}/api/v1/status`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const updatedAt = new Date(responseBody.updated_at).toISOString();

      expect(responseBody.updated_at).toEqual(updatedAt);

      expect(responseBody.dependencies.database).not.toHaveProperty("version");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(`${webserver.origin()}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const updatedAt = new Date(responseBody.updated_at).toISOString();

      expect(responseBody.updated_at).toEqual(updatedAt);

      expect(responseBody.dependencies.database).not.toHaveProperty("version");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    describe("Retrieving current system status", () => {
      test("With `read:status:all` feature", async () => {
        const createdUser = await orchestrator.createUser();
        await orchestrator.activateUser(createdUser);
        const updatedUser = await orchestrator.addFeaturesToUser(createdUser, [
          "read:status:all",
        ]);
        const sessionObject = await orchestrator.createSession(updatedUser);

        const response = await fetch(`${webserver.origin()}/api/v1/status`, {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        });
        expect(response.status).toBe(200);

        const responseBody = await response.json();

        const updatedAt = new Date(responseBody.updated_at).toISOString();
        expect(responseBody.updated_at).toEqual(updatedAt);

        expect(responseBody.dependencies.database.version).toEqual("16.0");
        expect(responseBody.dependencies.database.max_connections).toEqual(100);
        expect(responseBody.dependencies.database.opened_connections).toEqual(
          1,
        );
      });
    });
  });
});
