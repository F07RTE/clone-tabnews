import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  const userCreationWithFeaturesMigrationCount = 3;

  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations({
    migrationsCount: userCreationWithFeaturesMigrationCount,
  });
});

describe("GET /api/v1/migration", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(`${webserver.origin()}/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: "Check if the user has the required feature read:migration.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(`${webserver.origin()}/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: "Check if the user has the required feature read:migration.",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    describe("Retrieving pending migrations", () => {
      test("With `read:migration` feature", async () => {
        const createdUser = await orchestrator.createUser();
        const activatedUser = await orchestrator.activateUser(createdUser);
        await orchestrator.addFeaturesToUser(createdUser, ["read:migration"]);
        const userSessionObject =
          await orchestrator.createSession(activatedUser);

        const response = await fetch(
          `${webserver.origin()}/api/v1/migrations`,
          {
            method: "GET",
            headers: {
              Cookie: `session_id=${userSessionObject.token}`,
            },
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();

        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
      });
    });
  });
});
