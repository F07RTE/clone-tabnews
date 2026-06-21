import orchestrator from "tests/orchestrator.js";
import email from "infra/email.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "FeedbackToHelp <contato@feedbacktohelp.com>",
      to: "contato@curso.dev",
      subject: "Test subject",
      text: "Test body",
    });

    await email.send({
      from: "FeedbackToHelp <contato@feedbacktohelp.com>",
      to: "contato@curso.dev",
      subject: "Last email subject",
      text: "Last email body",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@feedbacktohelp.com>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Last email subject");
    expect(lastEmail.text).toBe("Last email body\n");
  });
});
