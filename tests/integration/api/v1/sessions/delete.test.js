import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With a nonexistent session", async () => {
      const nonexistentToken =
        "6ebfcbaf2ffb578bc19b43c31feb24ffae7e5fd47394d0998e9b8a6fe96310169f5d91ad5f6bc09027c0fa54c20a760e";

      var response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "No session was found for this user.",
        action: "Please, make the user is logged and the session is active.",
        status_code: 401,
      });
    });

    test("With a expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISECOND),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const createdSession = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      var response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "No session was found for this user.",
        action: "Please, make the user is logged and the session is active.",
        status_code: 401,
      });
    });

    test("With a valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser);

      var response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: responseBody.user_id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(
        responseBody.expires_at < createdSession.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > createdSession.updated_at.toISOString(),
      ).toBe(true);

      // Cookie Assertion
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Double check invalid session
      var userWithExpiredSessionResponse = await fetch(
        "http://localhost:3000/api/v1/user",
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${createdSession.token}`,
          },
        },
      );

      expect(userWithExpiredSessionResponse.status).toBe(401);

      const getUserResponseBody = await userWithExpiredSessionResponse.json();

      expect(getUserResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "No session was found for this user.",
        action: "Please, make the user is logged and the session is active.",
        status_code: 401,
      });
    });
  });
});
