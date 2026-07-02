import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

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

const activation = {
  create,
  findOneValidByActivationTokenId,
  sendEmailToUser,
};

export default activation;
