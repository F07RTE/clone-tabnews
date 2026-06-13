import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  let result = await user.findOneByUserName(username);
  return response.status(200).json(result);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValue = request.body;

  const result = await user.update(username, userInputValue);

  return response.status(200).json(result);
}
