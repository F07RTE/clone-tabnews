import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  const userCreationWithFeaturesMigrationCount = 3;

  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations({
    migrationsCount: userCreationWithFeaturesMigrationCount,
  });
});

describe("POST /api/v1/migration", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response = await fetch(`${webserver.origin()}/api/v1/migrations`, {
        method: "POST",
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: "Check if the user has the required feature create:migration.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const response = await fetch(`${webserver.origin()}/api/v1/migrations`, {
        method: "POST",
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: "Check if the user has the required feature create:migration.",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      describe("With `create:migration` and `read:migration` features", () => {
        let userSessionObject;

        test("For the first time", async () => {
          const createdUser = await orchestrator.createUser();
          const activatedUser = await orchestrator.activateUser(createdUser);
          await orchestrator.addFeaturesToUser(createdUser, [
            "create:migration",
            "read:migration",
          ]);
          userSessionObject = await orchestrator.createSession(activatedUser);

          const response = await fetch(
            `${webserver.origin()}/api/v1/migrations`,
            {
              method: "POST",
              headers: {
                Cookie: `session_id=${userSessionObject.token}`,
              },
            },
          );
          expect(response.status).toBe(201);

          const responseBody = await response.json();
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody.length).toBeGreaterThan(0);
        });

        test("For the second time", async () => {
          const response = await fetch(
            `${webserver.origin()}/api/v1/migrations`,
            {
              method: "POST",
              headers: {
                Cookie: `session_id=${userSessionObject.token}`,
              },
            },
          );

          expect(response.status).toBe(200);

          const responseBody = await response.json();
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody.length).toBe(0);
        });
      });
    });
  });
});
