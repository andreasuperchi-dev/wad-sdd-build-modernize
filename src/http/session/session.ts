import { randomUUID } from "node:crypto";

const SESSION_COOKIE_NAME = "sid";
const SESSION_COOKIE_ATTRIBUTES = "Path=/; HttpOnly; SameSite=Lax";

export type SessionRequest = {
  headers: {
    cookie?: string | undefined;
  };
};

export type SessionResponse = {
  setHeader(name: "Set-Cookie", value: string): void;
};

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .reduce<Record<string, string>>((acc, pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex <= 0) {
        return acc;
      }

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (!key || !value) {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
}

function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; ${SESSION_COOKIE_ATTRIBUTES}`;
}

export function getOrCreateSessionId(request: SessionRequest, response: SessionResponse): string {
  const cookies = parseCookieHeader(request.headers.cookie);
  const existingSessionId = cookies[SESSION_COOKIE_NAME];

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = randomUUID();
  response.setHeader("Set-Cookie", buildSessionCookie(sessionId));
  return sessionId;
}

export { SESSION_COOKIE_ATTRIBUTES, SESSION_COOKIE_NAME };
