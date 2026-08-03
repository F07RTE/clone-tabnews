function can(user, feature, resource) {
  let authorize = false;

  if (user.features.includes(feature)) {
    authorize = true;
  }

  if (feature === "update:user" && resource) {
    authorize = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorize = true;
    }
  }

  return authorize;
}

const authorization = {
  can,
};

export default authorization;
