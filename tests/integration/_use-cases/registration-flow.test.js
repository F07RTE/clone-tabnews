import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import user from "models/user.js";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessfull)", () => {
  let userResponseBody;
  let activationTokenObject;
  let sessionResponseBody;

  test("Create user account", async () => {
    var response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "guilhermeforte",
        email: "guilhermeforte@test.com",
        password: "senha123",
      }),
    });

    expect(response.status).toBe(201);

    userResponseBody = await response.json();
    expect(userResponseBody).toEqual({
      id: userResponseBody.id,
      username: "guilhermeforte",
      email: "guilhermeforte@test.com",
      features: ["read:activation_token"],
      password: userResponseBody.password,
      created_at: userResponseBody.created_at,
      updated_at: userResponseBody.updated_at,
    });
  });

  test("Recieve activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contact@feedbacktohelp.com>");
    expect(lastEmail.recipients[0]).toBe("<guilhermeforte@test.com>");
    expect(lastEmail.subject).toBe("Activate your account on FeedbackToHelp");
    expect(lastEmail.text).toContain("guilhermeforte");

    const activationTokenFromEmailBody = orchestrator.extractUUID(
      lastEmail.text,
    );
    expect(lastEmail.text).toContain(
      `${webserver.getOrigin()}/register/activate/${activationTokenFromEmailBody}`,
    );

    activationTokenObject = await activation.findOneValidByActivationTokenId(
      activationTokenFromEmailBody,
    );

    expect(activationTokenObject.user_id).toBe(userResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activation", async () => {
    var response = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(Date.parse(responseBody.used_at)).not.toNaN;

    const activeUser = await user.findOneById(responseBody.user_id);
    expect(activeUser.features).toEqual(["create:session", "read:session"]);
  });

  test("Login", async () => {
    var response = await fetch("http://localhost:3000/api/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userResponseBody.email,
        password: "senha123",
      }),
    });

    expect(response.status).toBe(201);

    sessionResponseBody = await response.json();

    expect(sessionResponseBody.user_id).toBe(userResponseBody.id);
  });

  test("Get user information", async () => {
    var response = await fetch("http://localhost:3000/api/v1/user", {
      method: "GET",
      headers: {
        Cookie: `session_id=${sessionResponseBody.token}`,
      },
    });

    expect(response.status).toBe(200);

    const responseHeaderCacheControl = response.headers.get("Cache-Control");
    expect(responseHeaderCacheControl).toEqual(
      "no-store, no-cache, max-age=0, must-revalidate",
    );

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: userResponseBody.id,
      username: userResponseBody.username,
      email: userResponseBody.email,
      features: ["create:session", "read:session"],
      password: userResponseBody.password,
      created_at: userResponseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });
});
