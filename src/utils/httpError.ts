import type { Response } from "express";
import type { components } from "~/lib/api/schema.js";

export const httpBadRequestError: components["schemas"]["DefaultErrors"] = {
  status: 400,
  error: "BAD_REQUEST",
  message: "Bad request",
};

export const httpUnauthorizedError: components["schemas"]["DefaultErrors"] = {
  status: 401,
  error: "UNAUTHORIZED",
  message: "Unauthorized",
};

export const httpPaymentRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 402,
  error: "PAYMENT_REQUIRED",
  message: "Payment required",
};

export const httpForbiddenError: components["schemas"]["DefaultErrors"] = {
  status: 403,
  error: "FORBIDDEN",
  message: "Forbidden",
};

export const httpNotFoundError: components["schemas"]["DefaultErrors"] = {
  status: 404,
  error: "NOT_FOUND",
  message: "Resource not found",
};

export const httpMethodNotAllowedError: components["schemas"]["DefaultErrors"] = {
  status: 405,
  error: "METHOD_NOT_ALLOWED",
  message: "Method not allowed",
};

export const httpNotAcceptableError: components["schemas"]["DefaultErrors"] = {
  status: 406,
  error: "NOT_ACCEPTABLE",
  message: "Not acceptable",
};

export const httpProxyAuthRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 407,
  error: "PROXY_AUTHENTICATION_REQUIRED",
  message: "Proxy authentication required",
};

export const httpRequestTimeoutError: components["schemas"]["DefaultErrors"] = {
  status: 408,
  error: "REQUEST_TIMEOUT",
  message: "Request timeout",
};

export const httpConflictError: components["schemas"]["DefaultErrors"] = {
  status: 409,
  error: "CONFLICT",
  message: "Conflict",
};

export const httpGoneError: components["schemas"]["DefaultErrors"] = {
  status: 410,
  error: "GONE",
  message: "Gone",
};

export const httpLengthRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 411,
  error: "LENGTH_REQUIRED",
  message: "Length required",
};

export const httpPreconditionFailedError: components["schemas"]["DefaultErrors"] = {
  status: 412,
  error: "PRECONDITION_FAILED",
  message: "Precondition failed",
};

export const httpPayloadTooLargeError: components["schemas"]["DefaultErrors"] = {
  status: 413,
  error: "PAYLOAD_TOO_LARGE",
  message: "Payload too large",
};

export const httpURITooLongError: components["schemas"]["DefaultErrors"] = {
  status: 414,
  error: "URI_TOO_LONG",
  message: "URI too long",
};

export const httpUnsupportedMediaTypeError: components["schemas"]["DefaultErrors"] = {
  status: 415,
  error: "UNSUPPORTED_MEDIA_TYPE",
  message: "Unsupported media type",
};

export const httpRangeNotSatisfiableError: components["schemas"]["DefaultErrors"] = {
  status: 416,
  error: "RANGE_NOT_SATISFIABLE",
  message: "Range not satisfiable",
};

export const httpExpectationFailedError: components["schemas"]["DefaultErrors"] = {
  status: 417,
  error: "EXPECTATION_FAILED",
  message: "Expectation failed",
};

export const httpImATeapotError: components["schemas"]["DefaultErrors"] = {
  status: 418,
  error: "IM_A_TEAPOT",
  message: "I'm a teapot",
};

export const httpMisdirectedRequestError: components["schemas"]["DefaultErrors"] = {
  status: 421,
  error: "MISDIRECTED_REQUEST",
  message: "Misdirected request",
};

export const httpUnprocessableEntityError: components["schemas"]["DefaultErrors"] = {
  status: 422,
  error: "UNPROCESSABLE_ENTITY",
  message: "Unprocessable entity",
};

export const httpLockedError: components["schemas"]["DefaultErrors"] = {
  status: 423,
  error: "LOCKED",
  message: "Locked",
};

export const httpFailedDependencyError: components["schemas"]["DefaultErrors"] = {
  status: 424,
  error: "FAILED_DEPENDENCY",
  message: "Failed dependency",
};

export const httpTooEarlyError: components["schemas"]["DefaultErrors"] = {
  status: 425,
  error: "TOO_EARLY",
  message: "Too early",
};

export const httpUpgradeRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 426,
  error: "UPGRADE_REQUIRED",
  message: "Upgrade required",
};

export const httpPreconditionRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 428,
  error: "PRECONDITION_REQUIRED",
  message: "Precondition required",
};

export const httpTooManyRequestsError: components["schemas"]["DefaultErrors"] = {
  status: 429,
  error: "TOO_MANY_REQUESTS",
  message: "Too many requests",
};

export const httpRequestHeaderFieldsTooLargeError: components["schemas"]["DefaultErrors"] = {
  status: 431,
  error: "REQUEST_HEADER_FIELDS_TOO_LARGE",
  message: "Request header fields too large",
};

export const httpUnavailableForLegalReasonsError: components["schemas"]["DefaultErrors"] = {
  status: 451,
  error: "UNAVAILABLE_FOR_LEGAL_REASONS",
  message: "Unavailable for legal reasons",
};

export const httpInternalServerError: components["schemas"]["DefaultErrors"] = {
  status: 500,
  error: "INTERNAL_SERVER_ERROR",
  message: "Internal server error",
};

export const httpNotImplementedError: components["schemas"]["DefaultErrors"] = {
  status: 501,
  error: "NOT_IMPLEMENTED",
  message: "Not implemented",
};

export const httpBadGatewayError: components["schemas"]["DefaultErrors"] = {
  status: 502,
  error: "BAD_GATEWAY",
  message: "Bad gateway",
};

export const httpServiceUnavailableError: components["schemas"]["DefaultErrors"] = {
  status: 503,
  error: "SERVICE_UNAVAILABLE",
  message: "Service unavailable",
};

export const httpGatewayTimeoutError: components["schemas"]["DefaultErrors"] = {
  status: 504,
  error: "GATEWAY_TIMEOUT",
  message: "Gateway timeout",
};

export const httpHTTPVersionNotSupportedError: components["schemas"]["DefaultErrors"] = {
  status: 505,
  error: "HTTP_VERSION_NOT_SUPPORTED",
  message: "HTTP version not supported",
};

export const httpVariantAlsoNegotiatesError: components["schemas"]["DefaultErrors"] = {
  status: 506,
  error: "VARIANT_ALSO_NEGOTIATES",
  message: "Variant also negotiates",
};

export const httpInsufficientStorageError: components["schemas"]["DefaultErrors"] = {
  status: 507,
  error: "INSUFFICIENT_STORAGE",
  message: "Insufficient storage",
};

export const httpLoopDetectedError: components["schemas"]["DefaultErrors"] = {
  status: 508,
  error: "LOOP_DETECTED",
  message: "Loop detected",
};

export const httpBandwidthLimitExceededError: components["schemas"]["DefaultErrors"] = {
  status: 509,
  error: "BANDWIDTH_LIMIT_EXCEEDED",
  message: "Bandwidth limit exceeded",
};

export const httpNotExtendedError: components["schemas"]["DefaultErrors"] = {
  status: 510,
  error: "NOT_EXTENDED",
  message: "Not extended",
};

export const httpNetworkAuthenticationRequiredError: components["schemas"]["DefaultErrors"] = {
  status: 511,
  error: "NETWORK_AUTHENTICATION_REQUIRED",
  message: "Network authentication required",
};

type HttpErrorResponse = {
  res: Response;
  error: components["schemas"]["DefaultErrors"];
  message?: string;
  detail?: Record<string, unknown>;
};

export function sendHttpError({ res, error, detail, message }: HttpErrorResponse) {
  const isServerError = error.status >= 500 && error.status < 600;
  const err: components["schemas"]["DefaultErrors"] = {
    status: error.status,
    error: error.error ?? "",
    message: isServerError ? error.message : (message ?? ""),
    ...(detail !== undefined && { detail }),
  };
  res.status(error.status).json(err);
}
