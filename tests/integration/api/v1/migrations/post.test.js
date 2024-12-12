import database from "infra/database";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await cleanDatabase();
});

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function searchMigrationsFromDatabase() {
  return await database.query("SELECT COUNT(*)::int FROM pgmigrations");
}

test("POST to /api/v1/migration should return 200", async () => {
  var response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response1.status).toBe(201);

  var responseBody1 = await response1.json();
  expect(Array.isArray(responseBody1)).toBe(true);
  expect(responseBody1.length).toBeGreaterThan(0);

  var response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  var responseBody2 = await response2.json();
  expect(Array.isArray(responseBody2)).toBe(true);
  expect(responseBody2.length).toBe(0);

  var migrationsFromDatabaseResult = await searchMigrationsFromDatabase();
  var migrationsFromDatabaseValue = migrationsFromDatabaseResult.rows[0].count;
  expect(migrationsFromDatabaseValue).toBeGreaterThan(0);
});
