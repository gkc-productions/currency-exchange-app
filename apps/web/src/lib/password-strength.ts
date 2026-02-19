const COMMON_PASSWORDS = new Set([
  "123456",
  "password",
  "123456789",
  "12345678",
  "12345",
  "111111",
  "1234567",
  "sunshine",
  "qwerty",
  "iloveyou",
  "princess",
  "admin",
  "welcome",
  "666666",
  "abc123",
  "football",
  "123123",
  "monkey",
  "654321",
  "!@#$%^&*",
  "charlie",
  "aa123456",
  "donald",
  "password1",
  "qwerty123",
]);

export type PasswordRulesResult = {
  lengthOk: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  notCommon: boolean;
  notEmailPart: boolean;
};

export function checkPasswordRules(password: string, email?: string): PasswordRulesResult {
  const normalized = password.trim().toLowerCase();
  const localPart = (email ?? "").split("@")[0]?.trim().toLowerCase() ?? "";

  return {
    lengthOk: password.length >= 10,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
    notCommon: normalized.length > 0 && !COMMON_PASSWORDS.has(normalized),
    notEmailPart: localPart.length < 3 || !normalized.includes(localPart),
  };
}

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: PasswordStrengthLabel } {
  let score = 0;

  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const normalizedScore = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  if (normalizedScore <= 1) {
    return { score: normalizedScore, label: "Weak" };
  }
  if (normalizedScore <= 2) {
    return { score: normalizedScore, label: "Fair" };
  }
  if (normalizedScore === 3) {
    return { score: normalizedScore, label: "Good" };
  }
  return { score: normalizedScore, label: "Strong" };
}
