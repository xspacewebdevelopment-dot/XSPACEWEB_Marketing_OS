import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export interface NormalizedPhoneResult {
  isValid: boolean;
  rawPhone: string;
  e164: string | null;
  country: string | null;
  formattedInternational: string | null;
  formattedNational: string | null;
  error?: string;
}

/**
 * Country-aware parsing and E.164 normalization using maintained libphonenumber-js.
 * Preserves the original phone string while extracting verified E.164 and ISO country code.
 * Never assumes US formatting.
 */
export function parseAndNormalizePhoneNumber(
  rawPhone?: string | null,
  defaultCountry?: CountryCode
): NormalizedPhoneResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return {
      isValid: false,
      rawPhone: rawPhone || "",
      e164: null,
      country: null,
      formattedInternational: null,
      formattedNational: null,
      error: "Phone number is empty or missing",
    };
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return {
      isValid: false,
      rawPhone: trimmed,
      e164: null,
      country: null,
      formattedInternational: null,
      formattedNational: null,
      error: "Phone number is empty",
    };
  }

  try {
    let parsed = parsePhoneNumberFromString(trimmed, defaultCountry);

    // If international prefix was entered as 00 (common in Europe/Asia), normalize to +
    if ((!parsed || !parsed.isValid()) && trimmed.startsWith("00")) {
      parsed = parsePhoneNumberFromString("+" + trimmed.slice(2), defaultCountry);
    }

    if (parsed && parsed.isValid()) {
      return {
        isValid: true,
        rawPhone: trimmed,
        e164: parsed.number, // E.164 normalized format (+...)
        country: parsed.country || null,
        formattedInternational: parsed.formatInternational(),
        formattedNational: parsed.formatNational(),
      };
    }

    return {
      isValid: false,
      rawPhone: trimmed,
      e164: null,
      country: null,
      formattedInternational: null,
      formattedNational: null,
      error: "Invalid international phone number format",
    };
  } catch (err: any) {
    return {
      isValid: false,
      rawPhone: trimmed,
      e164: null,
      country: null,
      formattedInternational: null,
      formattedNational: null,
      error: err?.message || "Failed to parse phone number",
    };
  }
}

/**
 * Validates international phone format without assuming US formatting.
 */
export function isValidPhoneNumber(
  phone?: string | null,
  defaultCountry?: CountryCode
): boolean {
  return parseAndNormalizePhoneNumber(phone, defaultCountry).isValid;
}

/**
 * Formats a phone number for international display using libphonenumber-js.
 */
export function formatPhoneNumber(
  phone: string,
  defaultCountry?: CountryCode
): string {
  const res = parseAndNormalizePhoneNumber(phone, defaultCountry);
  if (res.isValid && res.formattedInternational) {
    return res.formattedInternational;
  }
  return phone;
}
