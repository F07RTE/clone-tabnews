import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";
import password from "models/password";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      var response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistentuser",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The user name was not found.",
        action: "Please, check if the user name is correct.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch("http://localhost:3000/api/v1/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@test.com",
          password: "password123",
        }),
      });

      expect(response2.status).toBe(201);

      var patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/user1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user2",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      var patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this user name.",
        action: "Please, use a different user name.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "email1@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var response2 = await fetch("http://localhost:3000/api/v1/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "email2@test.com",
          password: "password123",
        }),
      });

      expect(response2.status).toBe(201);

      var patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/email2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1@test.com",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      var patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this email.",
        action: "Please, use a different email.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueUser1",
          email: "uniqueUser1@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: "uniqueUser1@test.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(responseBody.updated_at) >
          Date.parse(responseBody.created_at),
      ).toBe(true);
    });

    test("With unique 'email'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueEmail1",
          email: "uniqueEmail1@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      var patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/uniqueEmail1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueEmail2@test.com",
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueEmail1",
        email: "uniqueEmail2@test.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(responseBody.updated_at) >
          Date.parse(responseBody.created_at),
      ).toBe(true);
    });

    test("With new 'password'", async () => {
      var response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newPassword1",
          email: "newPassword1@test.com",
          password: "Password1",
        }),
      });

      expect(response1.status).toBe(201);

      var patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/newPassword1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "newPassword1",
        email: "newPassword1@test.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(responseBody.updated_at) >
          Date.parse(responseBody.created_at),
      ).toBe(true);

      const userInDatabase = await user.findOneByUserName("newPassword1");
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );

      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
