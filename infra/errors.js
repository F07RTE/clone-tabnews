export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("An unexpected error happened.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Contact support.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Service is unnavalible at the moment.", {
      cause,
    });
    this.name = "ServiceError";
    this.action = "Try again later or check if the service is avalible.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method is not allowed for this endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Verify if the method HTTP sent is valid for this endpoint";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
