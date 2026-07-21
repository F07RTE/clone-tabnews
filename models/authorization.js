function can(user, feature) {
  let authorize = false;

  if (user.features.includes(feature)) {
    return true;
  }

  return authorize;
}

const authorization = {
  can,
};

export default authorization;
