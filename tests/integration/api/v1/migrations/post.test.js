import database from "infra/database";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

async function searchMigrationsFromDatabase() {
  return await database.query("SELECT COUNT(*)::int FROM pgmigrations");
}

describe("POST /api/v1/migration", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        var response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });
        expect(response.status).toBe(201);

        var responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
      });
      test("For the second time", async () => {
        var response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });
        expect(response.status).toBe(200);

        var responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBe(0);

        var migrationsFromDatabaseResult = await searchMigrationsFromDatabase();
        var migrationsFromDatabaseValue =
          migrationsFromDatabaseResult.rows[0].count;
        expect(migrationsFromDatabaseValue).toBeGreaterThan(0);
      });
    });
  });
});
