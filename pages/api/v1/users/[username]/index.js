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
  const username = request.query.username;
  let result = await user.findOneByUserName(username);
  return response.status(200).json(result);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValue = request.body;

  // action, feature, resource
  const userTryingToPatch = request.context.user;

  const targetUser = await user.findOneByUserName(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You don't have permission to update another user.",
      action: "You don't have the feature to update another user.",
    });
  }

  const result = await user.update(username, userInputValue);

  return response.status(200).json(result);
}
