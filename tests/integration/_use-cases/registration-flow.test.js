import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessfull)", () => {
  let userResponseBody;

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

    const activationToken = await activation.findOneValidByActivationTokenId(
      activationTokenFromEmailBody,
    );

    expect(activationToken.user_id).toBe(userResponseBody.id);
    expect(activationToken.used_at).toBe(null);
  });

  test.todo("Activation");

  test.todo("Login");

  test.todo("Get user information");
});
