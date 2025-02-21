import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { ServiceError } from "infra/errors";

function createDefaultMigrationOptions(dbClient) {
  return {
    dbClient: dbClient,
    dir: resolve("infra", "migrations"),
    direction: "up",
    log: () => {},
    migrationsTable: "pgmigrations",
  };
}

async function listPendingMigrations() {
  try {
    var dbClient = await database.getNewClient();
    var defaultMigrationOptions = createDefaultMigrationOptions(dbClient);

    var pendingMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: true,
    });

    return pendingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Error when listing pending migrations.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    dbClient?.end();
  }
}

async function runPendingMigrations() {
  try {
    var dbClient = await database.getNewClient();
    var defaultMigrationOptions = createDefaultMigrationOptions(dbClient);

    var migratedMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    return migratedMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Error when running pending migrations.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
