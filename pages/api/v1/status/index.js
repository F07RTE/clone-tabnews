import { createRouter } from "next-connect";

import controller from "infra/controller";
import authorization from "models/authorization.js";
import status from "models/status.js";

const router = createRouter();

router.use(controller.injectAnnonymousOrUser);

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const statusObject = await status.retrieveStatus();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return response.status(200).json(secureOutputValues);
}
