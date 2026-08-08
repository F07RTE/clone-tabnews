import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      orchestrator.createUser({
        password: "CorrectPassword",
      });

      const response = await fetch(`${webserver.origin()}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrectemail@test.com",
          password: "CorrectPassword",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Incorrect credentials.",
        action: "Make sure the credentials are correct.",
        status_code: 401,
      });
    });

    test("With correct `email` but incorrect `password`", async () => {
      const createdUser = await orchestrator.createUser({
        password: "CorrectPassword",
      });

      const response = await fetch(`${webserver.origin()}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createdUser.email,
          password: "IncorrectPassword",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Incorrect credentials.",
        action: "Make sure the credentials are correct.",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser();

      const response = await fetch(`${webserver.origin()}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrectemail@test.com",
          password: "IncorrectPassword",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Incorrect credentials.",
        action: "Make sure the credentials are correct.",
        status_code: 401,
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "correctemail@test.com",
        password: "CorrectPassword",
      });

      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webserver.origin()}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correctemail@test.com",
          password: "CorrectPassword",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(isHex(responseBody.token)).toBe(true);
      expect(responseBody.token.length).toBe(96);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expect(expiresAt >= createdAt).toBe(true);

      /*
      expires_at is calculated before the database data insertion.
      created_at is calculated during database persistence.
      That might have a small miliseconds diference between the 30 days configured lifetime
        when you calculate the diference between both dates saved on the database
        to assert the test correctly we are allowing the 5000 miliseconds difference 
        on the lifetime date.
      */

      const actualLifetimeInMiliseconds = expiresAt - createdAt;
      const lifetimeDifferenceInMiliseconds =
        session.EXPIRATION_IN_MILISECOND - actualLifetimeInMiliseconds;

      expect(lifetimeDifferenceInMiliseconds).toBeLessThanOrEqual(5000);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILISECOND / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });

      function isHex(stringValue) {
        return /^[0-9A-Fa-f]+$/.test(stringValue);
      }
    });
  });
});
