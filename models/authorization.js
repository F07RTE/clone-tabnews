import { InternalServerError } from "infra/errors";

const avalibleFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

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

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self") {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        features: resource.features,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        email: resource.email,
        user_id: resource.user_id,
        expires_at: resource.expires_at,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature == "read:activation_token") {
    return {
      id: resource.id,
      used_at: resource.used_at,
      user_id: resource.user_id,
      expires_at: resource.expires_at,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:migration") {
    return resource.map((migration) => ({
      name: migration.name,
    }));
  }

  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "The `user` is required on `authorization` model.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !avalibleFeatures.includes(feature)) {
    throw new InternalServerError({
      cause: "You must provide a known feature on `authorization` model.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "You must provide a resource on `authorization` model.",
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
