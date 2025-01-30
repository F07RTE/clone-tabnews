import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("DELETE /api/v1/migration", () => {
  describe("Anonymous user", () => {
    test("Deleting pending migrations", async () => {
      var response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "DELETE",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Method is not allowed for this endpoint.",
        action: "Verify if the method HTTP sent is valid for this endpoint",
        status_code: 405,
      });
    });
  });
});
