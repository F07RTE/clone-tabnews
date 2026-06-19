import { createRouter } from "next-connect";

import controller from "infra/controller";
import authenticator from "models/authenticator.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);

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
