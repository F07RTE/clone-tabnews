import { createRouter } from "next-connect";

import controller from "infra/controller";
import authenticator from "models/authenticator.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const sessionInputValues = request.body;

  const autheticatedUser = await authenticator.getAuthenticatedUser(
    sessionInputValues.email,
    sessionInputValues.password,
  );

  const createdSession = await session.create(autheticatedUser);

  controller.setSessionCookie(createdSession.token, response);

  return response.status(201).json(createdSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionFromDb = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionFromDb.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
