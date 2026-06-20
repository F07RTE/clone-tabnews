import { version as uuidVersion } from "uuid";
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
    test("With a valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser);

      var response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseHeaderCacheControl = response.headers.get("Cache-Control");
      expect(responseHeaderCacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Renewed Session Assertions
      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSessionObject.expires_at > createdSession.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > createdSession.updated_at).toBe(
        true,
      );

      // Cookie Assertion
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILISECOND / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With a valid session about to expire", async () => {
      const tenSecondsInMiliseconds = 10000;
      jest.useFakeTimers({
        now: new Date(
          Date.now() -
            (session.EXPIRATION_IN_MILISECOND - tenSecondsInMiliseconds),
        ),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithSessionAboutToExpire",
      });

      const createdSession = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      var response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "UserWithSessionAboutToExpire",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      // Renewed Session Assertions
      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );
      expect(renewedSessionObject.expires_at > createdSession.expires_at).toBe(
        true,
      );

      expect(renewedSessionObject.updated_at > createdSession.updated_at).toBe(
        true,
      );

      // Cookie Assertion
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILISECOND / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With a nonexistent session", async () => {
      const nonexistentToken =
        "6ebfcbaf2ffb578bc19b43c31feb24ffae7e5fd47394d0998e9b8a6fe96310169f5d91ad5f6bc09027c0fa54c20a760e";

      var response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
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

      // Cookie assertion
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

      var response = await fetch("http://localhost:3000/api/v1/user", {
        method: "GET",
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

      // Cookie assertion
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
    });
  });
});
