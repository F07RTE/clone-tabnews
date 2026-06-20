import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors.js";

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

async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECOND);
  const renewedSession = await runUpdateQuery(sessionId, expiresAt);

  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    var results = await database.query({
      text: `
        UPDATE 
          sessions 
        SET
          expires_at = $2, 
          updated_at = NOW()
        WHERE 
          id = $1
        RETURNING
          *
          ;
        `,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSessionObject = await runUpdateQuery(sessionId);

  return expiredSessionObject;

  async function runUpdateQuery(sessionId) {
    var results = await database.query({
      text: `
        UPDATE 
          sessions 
        SET
          expires_at = expires_at - interval '1 year', 
          updated_at = NOW()
        WHERE 
          id = $1
        RETURNING
          *
          ;
        `,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(token) {
  let validSession = await runSelectQuery(token);

  return validSession;

  async function runSelectQuery(token) {
    var result = await database.query({
      text: `
        SELECT 
          *
        FROM
         sessions 
        WHERE
         token = $1
          AND expires_at > NOW()
        LIMIT 1
          ;
        `,
      values: [token],
    });

    if (result.rowCount === 0) {
      const authenticationErrorObject = new UnauthorizedError({
        message: "No session was found for this user.",
        action: "Please, make the user is logged and the session is active.",
      });

      throw authenticationErrorObject;
    }

    return result.rows[0];
  }
}

const session = {
  create,
  renew,
  expireById,
  findOneValidByToken,
  EXPIRATION_IN_MILISECOND,
};

export default session;
