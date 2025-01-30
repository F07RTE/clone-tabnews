import { createRouter } from "next-connect";
import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    var dbClient = await database.getNewClient();
    var defaultMigrationOptions = createDefaultMigrationOptions(dbClient);

    var pendingMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: true,
    });

    return response.status(200).json(pendingMigrations);
  } finally {
    dbClient?.end();
  }
}

async function postHandler(request, response) {
  try {
    var dbClient = await database.getNewClient();
    var defaultMigrationOptions = createDefaultMigrationOptions(dbClient);

    var migratedMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    dbClient?.end();
  }
}

function createDefaultMigrationOptions(dbClient) {
  return {
    dbClient: dbClient,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };
}
