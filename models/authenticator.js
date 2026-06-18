import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors";

async function getAuthenticatedUser(providedEmail, prividedPassword) {
  let storedUser;
  try {
    storedUser = await findUserByEmail(providedEmail);
    await validatePassword(prividedPassword, storedUser.password);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const unauthorizedErrorObject = new UnauthorizedError({
        message: "Incorrect credentials.",
        action: "Make sure the credentials are correct.",
      });

      throw unauthorizedErrorObject;
    }

    throw error;
  }

  return storedUser;

  async function findUserByEmail(email) {
    try {
      return await user.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const unauthorizedErrorObject = new UnauthorizedError({
          message: "Incorrect Email.",
          action: "Make sure the email is correct.",
        });

        throw unauthorizedErrorObject;
      }

      throw error;
    }
  }

  async function validatePassword(prividedPassword, storedPassword) {
    const userPasswordMatch = await password.compare(
      prividedPassword,
      storedPassword,
    );
    if (!userPasswordMatch) {
      const unauthorizedErrorObject = new UnauthorizedError({
        message: "Incorrect password.",
        action: "Make sure the password is correct.",
      });

      throw unauthorizedErrorObject;
    }
  }
}

const authenticator = {
  getAuthenticatedUser,
};

export default authenticator;
