const ADMIN_PASSWORD_ENV_VAR = "ADMIN_PASSWORD";

export function getAdminPassword(): string | undefined {
  const value = process.env[ADMIN_PASSWORD_ENV_VAR]?.trim();
  if (!value) {
    return undefined;
  }
  return value;
}

export function hasValidAdminPassword(providedPassword: unknown): boolean {
  if (typeof providedPassword !== "string") {
    return false;
  }

  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return false;
  }

  return providedPassword === configuredPassword;
}

export { ADMIN_PASSWORD_ENV_VAR };
