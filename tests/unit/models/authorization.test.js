import { InternalServerError } from "infra/errors";
import authorization from "models/authorization.js";

describe("models/authorization.js", () => {
  describe(".can", () => {
    test("Without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const createdUser = {
        username: "WithoutFeatures",
      };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With a unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.can(createdUser, "unknown_feature");
      }).toThrow(InternalServerError);
    });

    test("With valid `user` and a known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };

      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput", () => {
    test("Without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("Without `user.features`", () => {
      const createdUser = {
        username: "WithoutFeatures",
      };

      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("With a unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "unknown_feature");
      }).toThrow(InternalServerError);
    });

    test("With valid `user`, a known `feature` but no `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("With valid `user`, a known `feature` and `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        username: "resource",
        email: "resource@resource.com",
        password: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:000Z",
        updated_at: "2026-01-01T00:00:000Z",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:000Z",
        updated_at: "2026-01-01T00:00:000Z",
      });
    });
  });
});
