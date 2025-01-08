import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];

  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method ${request.method} not allowed`,
    });
  }

  if (request.method === "GET") {
    return await get(response);
  }

  if (request.method === "POST") {
    return await post(response);
  }
}

async function get(response) {
  try {
    var dbClient = await database.getNewClient();
    var defaultMigrationOptions = createDefaultMigrationOptions(dbClient);

    var pendingMigrations = await migrationsRunner({
      ...defaultMigrationOptions,
      dryRun: true,
    });

    return response.status(200).json(pendingMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

async function post(response) {
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
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
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
