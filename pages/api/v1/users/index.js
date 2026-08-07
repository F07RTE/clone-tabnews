import { createRouter } from "next-connect";

import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnnonymousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryingToPut = request.context.user;
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationTokenObject = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationTokenObject.id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPut,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
