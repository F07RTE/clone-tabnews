import { version as uuidVersion } from "uuid";

import webserver from "infra/webserver.js";
import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/eaf5e5b7-182e-438d-9310-6b0bc212d3c4`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or is expired.",
        action: "Please, register again.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILISECOND),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or is expired.",
        action: "Please, register again.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const createdActivationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/${createdActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const secondActivationResponse = await fetch(
        `${webserver.origin()}/api/v1/activations/${createdActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(secondActivationResponse.status).toBe(404);
      const responseBody = await secondActivationResponse.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The activation token was not found or is expired.",
        action: "Please, register again.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const createdActivationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/${createdActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdActivationToken.id,
        used_at: responseBody.used_at,
        user_id: createdActivationToken.user_id,
        expires_at: createdActivationToken.expires_at.toISOString(),
        created_at: createdActivationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);
      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILISECOND);

      const activeUser = await user.findOneById(responseBody.user_id);
      expect(activeUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });

    test("With valid token, but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const createdActivationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/${createdActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You can't use activation tokens anymore.",
        action: "Contact support.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `${webserver.origin()}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1Session.token}`,
          },
        },
      );

      expect(response.status).toBe(403);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action:
          "Check if the user has the required feature read:activation_token.",
        status_code: 403,
      });
    });
  });
});
