import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";
import password from "models/password.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique `username`", async () => {
      const userCreated = await orchestrator.createUser();

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${userCreated.username}`,
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

      expect(patchResponse.status).toBe(403);

      const responseBody = await patchResponse.json();
      expect(responseBody).toEqual({
        action: "Check if the user has the required feature update:user.",
        message: "You do not have permission to perform this action.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent `username`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin()}/api/v1/users/nonexistentuser`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
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

    test("With duplicated `username`", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(activatedUser2);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/user2`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this user name.",
        action: "Please, use a different user name.",
        status_code: 400,
      });
    });

    test("With `userB` targeting `userA`", async () => {
      await orchestrator.createUser({
        username: "userA",
      });

      const createdUserB = await orchestrator.createUser({
        username: "userB",
      });
      const activatedUserB = await orchestrator.activateUser(createdUserB.id);
      const sessionObject2 = await orchestrator.createSession(activatedUserB);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/userA`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );

      expect(patchResponse.status).toBe(403);

      const patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to update another user.",
        action: "You do not have the feature to update another user.",
        status_code: 403,
      });
    });

    test("With duplicated `email`", async () => {
      await orchestrator.createUser({
        email: "email1@test.com",
      });

      const email2UserCreated = await orchestrator.createUser({
        email: "email2@test.com",
      });
      const activatedUser2 = await orchestrator.activateUser(
        email2UserCreated.id,
      );
      const sessionObject2 = await orchestrator.createSession(activatedUser2);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${email2UserCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            email: "email1@test.com",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "There is a user already registered with this email.",
        action: "Please, use a different email.",
        status_code: 400,
      });
    });

    test("With unique `username`", async () => {
      const userCreated = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(userCreated.id);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${userCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

    test("With unique `email`", async () => {
      const userCreated = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(userCreated.id);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${userCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        username: userCreated.username,
        features: ["create:session", "read:session", "update:user"],
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

      const userInDatabase = await user.findOneByUserName(userCreated.username);
      expect(userInDatabase.email).toBe("uniqueEmail2@test.com");
    });

    test("With new `password`", async () => {
      const userCreated = await orchestrator.createUser({
        password: "password1",
      });
      const activatedUser = await orchestrator.activateUser(userCreated.id);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${userCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
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
        username: userCreated.username,
        features: ["create:session", "read:session", "update:user"],
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

      const userInDatabase = await user.findOneByUserName(userCreated.username);
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

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedPrivilegedUser = await orchestrator.activateUser(
        privilegedUser.id,
      );

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      const privilagedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser,
      );

      const defaultUser = await orchestrator.createUser();

      const patchResponse = await fetch(
        `${webserver.origin()}/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilagedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "ChangedByPrivilegedUser",
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const patchResponseBody = await patchResponse.json();
      expect(patchResponseBody).toEqual({
        id: defaultUser.id,
        username: "ChangedByPrivilegedUser",
        features: defaultUser.features,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(
        Date.parse(patchResponseBody.updated_at) >
          Date.parse(patchResponseBody.created_at),
      ).toBe(true);
    });
  });
});
