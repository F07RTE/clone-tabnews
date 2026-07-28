import database from "infra/database.js";
import { NotFoundError } from "infra/errors.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";

const EXPIRATION_IN_MILISECOND = 60 * 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECOND);

  const newActivationToken = await runInsertQuery(userId, expiresAt);

  return newActivationToken;

  async function runInsertQuery(userId, expiresAt) {
    var results = await database.query({
      text: `
        INSERT INTO 
          user_activation_tokens (user_id, expires_at) 
        VALUES 
          ($1, $2)
        RETURNING
          *
          ;
        `,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByActivationTokenId(token) {
  let activationToken = await runSelectQuery(token);

  return activationToken;

  async function runSelectQuery(tokenId) {
    var result = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
         id = $1
          AND used_at IS NULL
          AND expires_at > NOW()  
        LIMIT 1
          ;
        `,
      values: [tokenId],
    });

    if (result.rowCount === 0) {
      const validationErrorObject = new NotFoundError({
        message: "The activation token was not found or is expired.",
        action: "Please, register again.",
      });
      throw validationErrorObject;
    }

    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "FeedBackToHelp <contact@feedbacktohelp.com>",
    to: user.email,
    subject: "Activate your account on FeedbackToHelp",
    text: `${user.username}, click on the link bellow to activate your account on FeedbackToHelp:

${webserver.getOrigin()}/register/activate/${activationToken}

Best Regards,
FeedbackToHelp team.
`,
  });
}

async function markTokenAsUsed(activationTokenId) {
  const activatedTokenObject = await runUpdateQuery(activationTokenId);
  return activatedTokenObject;

  async function runUpdateQuery(activationTokenId) {
    var result = await database.query({
      text: `
        UPDATE 
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1

        RETURNING
         *
        `,
      values: [activationTokenId],
    });

    if (result.rowCount === 0) {
      const validationErrorObject = new NotFoundError({
        message: "The activation token was not found or is expired.",
        action: "Please, register again.",
      });
      throw validationErrorObject;
    }

    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  create,
  findOneValidByActivationTokenId,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
