import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("Not allowed methods to /api/v1/migration should return 405", async () => {
  var responsePut = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "PUT",
  });
  expect(responsePut.status).toBe(405);
  let responsePutBody = await responsePut.json();
  expect(responsePutBody.error).toBe("Method PUT not allowed");

  var responseDelete = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "DELETE",
  });
  expect(responseDelete.status).toBe(405);
  let responseDeleteBody = await responseDelete.json();
  expect(responseDeleteBody.error).toBe("Method DELETE not allowed");
});

test("Not allowed methods to /api/v1/migration should not open a dbConnection", async () => {
  await fetch("http://localhost:3000/api/v1/migrations", {
    method: "PUT",
  });

  await fetch("http://localhost:3000/api/v1/migrations", {
    method: "DELETE",
  });

  var responseStatusResult = await fetch("http://localhost:3000/api/v1/status");
  let responseStatusBody = await responseStatusResult.json();
  expect(responseStatusBody.dependencies.database.opened_connections).toBe(1);
});
