import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUserName(username) {
  let user = await runSelectQuery(username);

  return user;

  async function runSelectQuery(username) {
    var result = await database.query({
      text: `
        SELECT 
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT 1
          ;
        `,
      values: [username],
    });

    if (result.rowCount === 0) {
      const validationErrorObject = new NotFoundError({
        message: "The user name was not found.",
        action: "Please, check if the user name is correct.",
      });
      throw validationErrorObject;
    }

    return result.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  var newUser = await runInsertUserQuery(userInputValues);

  return newUser;

  async function validateUniqueEmail(email) {
    var result = await database.query({
      text: `
        SELECT 
          email
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
          ;
        `,
      values: [email],
    });

    if (result.rowCount > 0) {
      const validationErrorObject = new ValidationError({
        message: "There is a user already registered with this email.",
        action: "Please, use a different email to register.",
      });
      throw validationErrorObject;
    }
  }

  async function validateUniqueUsername(username) {
    var result = await database.query({
      text: `
        SELECT 
          username
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
          ;
        `,
      values: [username],
    });

    if (result.rowCount > 0) {
      const validationErrorObject = new ValidationError({
        message: "There is a user already registered with this user name.",
        action: "Please, use a different user name to register.",
      });
      throw validationErrorObject;
    }
  }

  async function runInsertUserQuery(userInputValues) {
    var results = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password) 
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
          ;
        `,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

const user = {
  create,
  findOneByUserName,
};

export default user;
