import { describe, expect, it } from "vitest";

import { getOrCreateSessionId, SESSION_COOKIE_NAME } from "./session.js";

describe("getOrCreateSessionId", () => {
  it("creates a new session ID and sets sid cookie when missing", () => {
    const request = {
      headers: {},
    };

    let setCookieHeader: string | undefined;
    const response = {
      setHeader: (_name: "Set-Cookie", value: string) => {
        setCookieHeader = value;
      },
    };

    const sessionId = getOrCreateSessionId(request, response);

    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=${sessionId}`);
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=Lax");
  });

  it("preserves existing sid from cookie and does not reset cookie", () => {
    const request = {
      headers: {
        cookie: "theme=dark; sid=existing-session-123; locale=en",
      },
    };

    let called = false;
    const response = {
      setHeader: (_name: "Set-Cookie", _value: string) => {
        called = true;
      },
    };

    const sessionId = getOrCreateSessionId(request, response);

    expect(sessionId).toBe("existing-session-123");
    expect(called).toBe(false);
  });
});
