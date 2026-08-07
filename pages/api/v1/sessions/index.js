import { createRouter } from "next-connect";

import controller from "infra/controller";
import authenticator from "models/authenticator.js";
import session from "models/session.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnnonymousOrUser);

router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const sessionInputValues = request.body;

  const autheticatedUser = await authenticator.getAuthenticatedUser(
    sessionInputValues.email,
    sessionInputValues.password,
  );

  if (!authorization.can(autheticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: `You don't have permission to perform this action`,
      action: `Contact the support if you should have access to this feature.`,
    });
  }

  const createdSession = await session.create(autheticatedUser);

  controller.setSessionCookie(createdSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    autheticatedUser,
    "read:session",
    createdSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const sessionToken = request.cookies.session_id;

  const sessionFromDb = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionFromDb.id);

  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  return response.status(200).json(secureOutputValues);
}
