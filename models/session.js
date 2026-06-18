import database from "infra/database.js";
import crypto from "node:crypto";

const EXPIRATION_IN_MILISECOND = 60 * 60 * 24 * 30 * 1000; // 30 days

async function create(authenticatedUser) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECOND);

  const newSession = await runInsertQuery(
    token,
    authenticatedUser.id,
    expiresAt,
  );

  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    var results = await database.query({
      text: `
        INSERT INTO 
          sessions (token, user_id, expires_at) 
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
          ;
        `,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

const session = {
  create,
  EXPIRATION_IN_MILISECOND,
};

export default session;
