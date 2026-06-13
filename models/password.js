import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();

  const passwordWithPepper = password + process.env.PEPPER;
  return await bcryptjs.hash(passwordWithPepper, rounds);
}

function getNumberOfRounds() {
  let rounds = 1;
  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

async function compare(providedPassword, storedPassword) {
  const providedPasswordWithPepper = providedPassword + process.env.PEPPER;
  return await bcryptjs.compare(providedPasswordWithPepper, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
