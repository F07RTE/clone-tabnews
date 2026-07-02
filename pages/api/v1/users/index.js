import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  let newUser = await user.create(userInputValues);

  const activationTokenObject = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationTokenObject.id);

  return response.status(201).json(newUser);
}
