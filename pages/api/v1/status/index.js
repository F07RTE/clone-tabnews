import database from "infra/database.js";

async function status(request, response) {
  var updatedAt = new Date().toISOString();

  var databaseVersionResult = await database.query("SHOW server_version;");
  var databaseVersionValue = databaseVersionResult.rows[0].server_version;

  var databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  var databaseMaxConnectionsValue = parseInt(
    databaseMaxConnectionsResult.rows[0].max_connections,
  );

  var databaseName = process.env.POSTGRES_DB;
  var databaseOpenedConnectionsResult = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  var databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: databaseMaxConnectionsValue,
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  });
}

export default status;
