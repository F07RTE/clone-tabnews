import useSWR from "swr";

async function fetchAPI(key) {
  var response = await fetch(key);
  var responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Database />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Loading...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Last update: {updatedAtText}</div>;
}

function Database() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (isLoading || !data) {
    return <div>Loading database info...</div>;
  }

  if (!isLoading && data.dependencies.database) {
    let databaseInfo = data.dependencies.database;

    let databaseMaxConnectionsValue = databaseInfo.max_connections;
    let databaseOpenedConnectionsValue = databaseInfo.opened_connections;

    let databaseAvaliableConnectionValue =
      databaseMaxConnectionsValue - databaseOpenedConnectionsValue;

    let databaseVersionValue = databaseInfo.version;

    return (
      <div>
        Database:
        <br />
        &nbsp;&nbsp;Max Connections: {databaseMaxConnectionsValue}
        <br />
        &nbsp;&nbsp;Opened Connections: {databaseOpenedConnectionsValue}
        <br />
        &nbsp;&nbsp;Avaliable Connections: {databaseAvaliableConnectionValue}
        <br />
        &nbsp;&nbsp;Version: {databaseVersionValue}
      </div>
    );
  }
}
