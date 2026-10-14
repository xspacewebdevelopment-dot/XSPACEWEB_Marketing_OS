import * as XLSX from "xlsx";
import { normalizeEmail } from "@/lib/utils";

export interface ParsedFileResult {
  filename: string;
  fileType: "CSV" | "XLSX" | "TXT";
  headers: string[];
  sampleRows: string[][];
  allRows: string[][];
  suggestedEmailColumnIndex: number;
  totalRowCount: number;
}

export interface EmailListAnalysis {
  totalRows: number;
  uniqueValidCount: number;
  duplicateCount: number;
  malformedCount: number;
  uniqueEmails: string[];
  duplicateEmails: string[];
  malformedEmails: string[];
  estimatedCredits: number;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmailSyntax(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Detects the most probable email column by analyzing header labels and sample cell contents.
 */
export function detectEmailColumn(
  headers: string[],
  rows: string[][]
): { index: number; name: string; confidence: "high" | "medium" | "low" } {
  if (!headers || headers.length === 0) {
    return { index: 0, name: "Column 1", confidence: "low" };
  }

  // 1. Exact or strong header keyword matches
  const emailKeywords = ["email", "e-mail", "mail", "email_address", "contact_email", "emailaddress"];
  for (let i = 0; i < headers.length; i++) {
    const cleanHeader = headers[i].toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (emailKeywords.includes(cleanHeader)) {
      return { index: i, name: headers[i], confidence: "high" };
    }
  }

  // 2. Partial header keyword matches
  for (let i = 0; i < headers.length; i++) {
    const cleanHeader = headers[i].toLowerCase().trim();
    if (cleanHeader.includes("email") || cleanHeader.includes("e-mail")) {
      return { index: i, name: headers[i], confidence: "medium" };
    }
  }

  // 3. Inspect sample rows (up to first 50 rows) for actual email addresses
  const sampleLimit = Math.min(rows.length, 50);
  const columnScores = new Array(headers.length).fill(0);

  for (let r = 0; r < sampleLimit; r++) {
    const row = rows[r];
    for (let c = 0; c < headers.length; c++) {
      const cell = (row[c] || "").trim();
      if (isValidEmailSyntax(cell)) {
        columnScores[c]++;
      }
    }
  }

  let bestIndex = 0;
  let maxMatches = 0;
  for (let c = 0; c < columnScores.length; c++) {
    if (columnScores[c] > maxMatches) {
      maxMatches = columnScores[c];
      bestIndex = c;
    }
  }

  if (maxMatches > 0) {
    return {
      index: bestIndex,
      name: headers[bestIndex] || `Column ${bestIndex + 1}`,
      confidence: maxMatches > sampleLimit * 0.5 ? "high" : "medium",
    };
  }

  return { index: 0, name: headers[0] || "Column 1", confidence: "low" };
}

/**
 * Standard CSV line parser that properly respects quotes, commas, semicolons, and tabs.
 */
function parseDelimitedText(text: string): { headers: string[]; rows: string[][] } {
  // Determine delimiter: inspect first 5 lines
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: ["Email"], rows: [] };
  }

  const sample = lines.slice(0, 5).join("\n");
  const commaCount = (sample.match(/,/g) || []).length;
  const semicolonCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = "\t";
  } else if (semicolonCount > commaCount) {
    delimiter = ";";
  }

  const parseRow = (line: string): string[] => {
    const entries: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        entries.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    entries.push(current.trim());
    return entries;
  };

  const parsedLines = lines.map(parseRow);
  if (parsedLines.length === 0) {
    return { headers: ["Email"], rows: [] };
  }

  // Check if first row is a header: if cells contain "@" in first row, likely no header row
  const firstRowHasEmail = parsedLines[0].some((c) => isValidEmailSyntax(c));
  if (firstRowHasEmail) {
    const generatedHeaders = parsedLines[0].map((_, idx) => `Column ${idx + 1}`);
    return {
      headers: generatedHeaders,
      rows: parsedLines,
    };
  }

  const headers = parsedLines[0].map((h, i) => h.trim() || `Column ${i + 1}`);
  const rows = parsedLines.slice(1);

  return { headers, rows };
}

/**
 * Parses raw file buffer/content into structured 2D table representation.
 */
export function parseFileContent(
  filename: string,
  content: ArrayBuffer | string
): ParsedFileResult {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  if (extension === "xlsx" || extension === "xls") {
    const data = typeof content === "string" ? Buffer.from(content, "binary") : new Uint8Array(content);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel workbook contains no sheets");
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });

    const nonBlankRows = rawRows.filter(
      (r) => Array.isArray(r) && r.some((c) => String(c).trim().length > 0)
    );

    if (nonBlankRows.length === 0) {
      return {
        filename,
        fileType: "XLSX",
        headers: ["Email"],
        sampleRows: [],
        allRows: [],
        suggestedEmailColumnIndex: 0,
        totalRowCount: 0,
      };
    }

    const firstRowHasEmail = nonBlankRows[0].some((c) => isValidEmailSyntax(String(c)));
    let headers: string[];
    let dataRows: string[][];

    if (firstRowHasEmail) {
      headers = nonBlankRows[0].map((_, i) => `Column ${i + 1}`);
      dataRows = nonBlankRows.map((r) => r.map((c) => String(c).trim()));
    } else {
      headers = nonBlankRows[0].map((h, i) => String(h).trim() || `Column ${i + 1}`);
      dataRows = nonBlankRows.slice(1).map((r) => r.map((c) => String(c).trim()));
    }

    const detected = detectEmailColumn(headers, dataRows);

    return {
      filename,
      fileType: "XLSX",
      headers,
      sampleRows: dataRows.slice(0, 10),
      allRows: dataRows,
      suggestedEmailColumnIndex: detected.index,
      totalRowCount: dataRows.length,
    };
  }

  // Handle TXT or CSV
  const textContent =
    typeof content === "string"
      ? content
      : new TextDecoder("utf-8").decode(new Uint8Array(content));

  if (extension === "txt") {
    // If simple single-column TXT of emails
    const rawLines = textContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Check if TXT is comma/tab delimited
    const hasDelimiter = rawLines.some((l) => l.includes(",") || l.includes("\t"));
    if (!hasDelimiter) {
      const rows = rawLines.map((email) => [email]);
      return {
        filename,
        fileType: "TXT",
        headers: ["Email Address"],
        sampleRows: rows.slice(0, 10),
        allRows: rows,
        suggestedEmailColumnIndex: 0,
        totalRowCount: rows.length,
      };
    }
  }

  // Fallback to CSV / Delimited
  const { headers, rows } = parseDelimitedText(textContent);
  const detected = detectEmailColumn(headers, rows);

  return {
    filename,
    fileType: extension === "txt" ? "TXT" : "CSV",
    headers,
    sampleRows: rows.slice(0, 10),
    allRows: rows,
    suggestedEmailColumnIndex: detected.index,
    totalRowCount: rows.length,
  };
}

/**
 * Extracts emails from the mapped column and performs deduplication and malformed syntax filtering.
 */
export function analyzeEmailColumn(
  rows: string[][],
  columnIndex: number
): EmailListAnalysis {
  const seenNormalized = new Set<string>();
  const uniqueEmails: string[] = [];
  const duplicateEmails: string[] = [];
  const malformedEmails: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rawVal = (rows[i][columnIndex] || "").trim();
    if (!rawVal) continue;

    if (!isValidEmailSyntax(rawVal)) {
      malformedEmails.push(rawVal);
      continue;
    }

    const normalized = normalizeEmail(rawVal);
    if (seenNormalized.has(normalized)) {
      duplicateEmails.push(rawVal);
    } else {
      seenNormalized.add(normalized);
      uniqueEmails.push(rawVal);
    }
  }

  return {
    totalRows: rows.length,
    uniqueValidCount: uniqueEmails.length,
    duplicateCount: duplicateEmails.length,
    malformedCount: malformedEmails.length,
    uniqueEmails,
    duplicateEmails,
    malformedEmails,
    estimatedCredits: uniqueEmails.length, // 1 Reoon credit per unique address
  };
}
