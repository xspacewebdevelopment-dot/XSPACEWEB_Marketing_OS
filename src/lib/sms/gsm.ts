/**
 * GSM-7 and UCS-2 SMS Character & Segment Calculation Utilities
 * Compliant with 3GPP TS 23.038 / GSM 03.38 standard.
 */

// Basic GSM 7-bit character set (160 characters single segment, 153 concatenated)
const GSM_BASIC_CHARS = new Set([
  // Basic Latin letters & numbers
  ..."@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ".split(""),
  ..." !\"#¤%&'()*+,-./0123456789:;<=>?¡".split(""),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿".split(""),
  ..."abcdefghijklmnopqrstuvwxyzäöñüà".split(""),
  "\r",
  "\n",
  "\x1b", // GSM Escape
]);

// GSM 7-bit extended character set (require escape byte, so count as 2 septets/chars each)
const GSM_EXTENDED_CHARS = new Set([
  "\f", // Form Feed
  "^",
  "{",
  "}",
  "\\",
  "[",
  "~",
  "]",
  "|",
  "€",
]);

export interface SmsEncodingInfo {
  encoding: "GSM-7" | "UCS-2";
  characterCount: number;
  rawLength: number;
  segments: number;
  maxCharsPerSegment: number;
  charsRemainingInCurrentSegment: number;
  charsUsedInCurrentSegment: number;
  hasExtendedGsm: boolean;
  extendedCharsCount: number;
  nonGsmCharacters: string[];
}

/**
 * Analyzes SMS message text to determine exact telecom encoding, character cost,
 * and carrier segment usage.
 * Supports AUTO (default), GSM-7, and UCS-2 preferences.
 */
export function calculateSmsEncoding(
  text: string,
  preference: "AUTO" | "GSM-7" | "UCS-2" = "AUTO"
): SmsEncodingInfo {
  const isForcedUcs2 = preference === "UCS-2";

  if (!text || text.length === 0) {
    const isUcs2 = isForcedUcs2;
    const limit = isUcs2 ? 70 : 160;
    return {
      encoding: isUcs2 ? "UCS-2" : "GSM-7",
      characterCount: 0,
      rawLength: 0,
      segments: 0,
      maxCharsPerSegment: limit,
      charsRemainingInCurrentSegment: limit,
      charsUsedInCurrentSegment: 0,
      hasExtendedGsm: false,
      extendedCharsCount: 0,
      nonGsmCharacters: [],
    };
  }

  const nonGsmChars: string[] = [];
  let extendedCount = 0;
  let isGsm = true;

  // Iterate code points to correctly detect multi-byte non-GSM symbols (emojis, etc.)
  for (const char of text) {
    if (GSM_BASIC_CHARS.has(char)) {
      continue;
    } else if (GSM_EXTENDED_CHARS.has(char)) {
      extendedCount++;
    } else {
      isGsm = false;
      if (!nonGsmChars.includes(char)) {
        nonGsmChars.push(char);
      }
    }
  }

  if (!isForcedUcs2 && isGsm) {
    // In GSM-7: Basic characters count as 1, extended characters count as 2
    const totalGsmChars = text.length + extendedCount;
    const singleLimit = 160;
    const multiLimit = 153;

    let segments = 1;
    let maxLimit = singleLimit;
    let usedInSegment = totalGsmChars;
    let remainingInSegment = singleLimit - totalGsmChars;

    if (totalGsmChars > singleLimit) {
      segments = Math.ceil(totalGsmChars / multiLimit);
      maxLimit = multiLimit;
      const mod = totalGsmChars % multiLimit;
      usedInSegment = mod === 0 ? multiLimit : mod;
      remainingInSegment = multiLimit - usedInSegment;
    }

    return {
      encoding: "GSM-7",
      characterCount: totalGsmChars,
      rawLength: text.length,
      segments,
      maxCharsPerSegment: maxLimit,
      charsRemainingInCurrentSegment: Math.max(0, remainingInSegment),
      charsUsedInCurrentSegment: usedInSegment,
      hasExtendedGsm: extendedCount > 0,
      extendedCharsCount: extendedCount,
      nonGsmCharacters: [],
    };
  } else {
    // In UCS-2 (Unicode): Message uses UTF-16 code units (text.length)
    const totalUcs2Chars = text.length;
    const singleLimit = 70;
    const multiLimit = 67;

    let segments = 1;
    let maxLimit = singleLimit;
    let usedInSegment = totalUcs2Chars;
    let remainingInSegment = singleLimit - totalUcs2Chars;

    if (totalUcs2Chars > singleLimit) {
      segments = Math.ceil(totalUcs2Chars / multiLimit);
      maxLimit = multiLimit;
      const mod = totalUcs2Chars % multiLimit;
      usedInSegment = mod === 0 ? multiLimit : mod;
      remainingInSegment = multiLimit - usedInSegment;
    }

    return {
      encoding: "UCS-2",
      characterCount: totalUcs2Chars,
      rawLength: text.length,
      segments,
      maxCharsPerSegment: maxLimit,
      charsRemainingInCurrentSegment: Math.max(0, remainingInSegment),
      charsUsedInCurrentSegment: usedInSegment,
      hasExtendedGsm: false,
      extendedCharsCount: 0,
      nonGsmCharacters: nonGsmChars,
    };
  }
}

/**
 * Validates whether an Alphanumeric or Numeric Sender ID complies with telecom regulations.
 */
export function validateSenderId(senderId: string): {
  valid: boolean;
  message?: string;
  type: "ALPHANUMERIC" | "PHONE_NUMBER" | "INVALID";
} {
  const trimmed = senderId.trim();
  if (!trimmed) {
    return { valid: false, message: "Sender ID cannot be empty", type: "INVALID" };
  }

  // Check if it's a phone number (E.164 or digits)
  const isPhone = /^\+?[1-9]\d{6,14}$/.test(trimmed.replace(/[\s()-]/g, ""));
  if (isPhone) {
    return { valid: true, type: "PHONE_NUMBER" };
  }

  // Alphanumeric Sender ID: 3 to 11 alphanumeric characters (A-Z, a-z, 0-9 and spaces/hyphens)
  const isAlphaNum = /^[a-zA-Z0-9\s_-]{3,11}$/.test(trimmed);
  if (!isAlphaNum) {
    return {
      valid: false,
      message: "Alphanumeric Sender ID must be 3-11 characters (letters, numbers, hyphens)",
      type: "INVALID",
    };
  }

  return { valid: true, type: "ALPHANUMERIC" };
}

export {
  parseAndNormalizePhoneNumber,
  isValidPhoneNumber,
  formatPhoneNumber,
  type NormalizedPhoneResult,
} from "./phone";
