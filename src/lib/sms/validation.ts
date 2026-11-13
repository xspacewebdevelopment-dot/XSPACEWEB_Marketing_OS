export interface SmsSettingsData {
  id: string;
  workspaceId: string;
  defaultSenderId: string;
  defaultChannel: "SMS" | "RCS";
  timezone: string;
  enforceStopOptOut: boolean;
  encodingPreference: "AUTO" | "GSM-7" | "UCS-2";
  rcsBrandName: string;
  rcsBrandColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSmsSettingsInput {
  defaultSenderId?: string;
  defaultChannel?: "SMS" | "RCS";
  timezone?: string;
  enforceStopOptOut?: boolean;
  encodingPreference?: "AUTO" | "GSM-7" | "UCS-2";
  rcsBrandName?: string;
  rcsBrandColor?: string;
}

/**
 * Validate IANA timezone identifier using native Intl API
 */
export function isValidIanaTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string" || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate preferred sender ID without assuming a single universal carrier rule.
 * Supports standard 1-11 alphanumeric sender IDs (e.g. BRANDNAME) as well as
 * international E.164 and telecom short codes.
 */
export function validatePreferredSenderId(senderId: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!senderId || typeof senderId !== "string" || !senderId.trim()) {
    return { valid: false, normalized: "", error: "Preferred Sender ID is required." };
  }

  const trimmed = senderId.trim();
  if (trimmed.length > 20) {
    return {
      valid: false,
      normalized: trimmed,
      error: "Sender ID cannot exceed 20 characters.",
    };
  }

  // Standard alphanumeric sender ID (1-11 characters, A-Z, 0-9)
  const isAlphaNum = /^[A-Za-z0-9_-]{1,11}$/.test(trimmed);
  // Numeric short code or telephone number (3-15 digits, optional +)
  const isNumericPhone = /^\+?[0-9]{3,15}$/.test(trimmed);

  if (!isAlphaNum && !isNumericPhone) {
    return {
      valid: false,
      normalized: trimmed,
      error:
        "Sender ID must be 1-11 alphanumeric characters (e.g. NEXAREACH) or a valid numeric short code / telephone number.",
    };
  }

  return {
    valid: true,
    normalized: isAlphaNum ? trimmed.toUpperCase() : trimmed,
  };
}

/**
 * Validate hex color code format (#RRGGBB or #RGB)
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color.trim());
}
