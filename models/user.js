import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import password from "models/password.js";

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
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  var newUser = await runInsertUserQuery(userInputValues);

  return newUser;

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

async function update(username, userInputValues) {
  const currentUser = await findOneByUserName(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const mergedUser = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(mergedUser);
  return updatedUser;

  async function runUpdateQuery(mergedUser) {
    var result = await database.query({
      text: `
        UPDATE users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE 
          id = $1

        RETURNING
          *
      `,
      values: [
        mergedUser.id,
        mergedUser.username,
        mergedUser.email,
        mergedUser.password,
      ],
    });

    return result.rows[0];
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
      action: "Please, use a different user name.",
    });
    throw validationErrorObject;
  }
}

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
      action: "Please, use a different email.",
    });
    throw validationErrorObject;
  }
}

async function hashPasswordInObject(userInputValues) {
  let hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneByUserName,
  update,
};

export default user;
