import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import webserver from "infra/webserver.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import activation from "models/activation.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 5000,
    });

    async function fetchStatusPage() {
      const response = await fetch(`${webserver.origin()}/api/v1/status`);
      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 5000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations({ migrationsCount } = {}) {
  await migrator.runPendingMigrations(migrationsCount);
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validtestpassword",
  });
}

async function activateUser(userId) {
  return await activation.activateUserByUserId(userId);
}

async function createSession(autheticatedUser) {
  return await session.create(autheticatedUser);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) return null;

  const emailtextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailtextResponse.text();

  lastEmailItem.text = emailTextBody;

  return lastEmailItem;
}

function extractUUID(text) {
  const uuidV4Regex =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

  const uuidFromEmailBodyMatches = text.match(uuidV4Regex);
  return uuidFromEmailBodyMatches[0];
}

async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features);
  return updatedUser;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  deleteAllEmails,
  runPendingMigrations,
  createUser,
  activateUser,
  createSession,
  getLastEmail,
  extractUUID,
  addFeaturesToUser,
};

export default orchestrator;
