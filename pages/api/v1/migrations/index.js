import migrationsRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  var dbClient = await database.getNewClient();

  var defaultMigrationOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    var pendingMigrations = await migrationsRunner(defaultMigrationOptions);
    dbClient.end();

    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    var migratedMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });
    dbClient.end();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
