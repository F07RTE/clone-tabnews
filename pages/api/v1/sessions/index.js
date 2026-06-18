import { createRouter } from "next-connect";
import * as cookie from "cookie";

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
  const setCookie = cookie.serialize("session_id", createdSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECOND / 1000, // 30 days
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(createdSession);
}
