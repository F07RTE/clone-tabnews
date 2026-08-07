import { createRouter } from "next-connect";

import controller from "infra/controller";
import { ForbiddenError } from "infra/errors.js";
import user from "models/user.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnnonymousOrUser);

router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUserName(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValue = request.body;

  const userTryingToPatch = request.context.user;

  const targetUser = await user.findOneByUserName(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You do not have permission to update another user.",
      action: "You do not have the feature to update another user.",
    });
  }

  const updatedUser = await user.update(username, userInputValue);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );

  return response.status(200).json(secureOutputValues);
}
