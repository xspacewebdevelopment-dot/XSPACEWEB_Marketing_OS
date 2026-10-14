/**
 * Email Template Compiler, Sanitizer & Personalization Engine
 */

export interface PersonalizationData {
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  unsubscribe_url?: string;
  [key: string]: string | undefined;
}

export const SAMPLE_PERSONALIZATION: PersonalizationData = {
  first_name: "Sarah",
  last_name: "Connor",
  email: "sarah.connor@acme-corp.com",
  company: "Cyberdyne Systems",
  unsubscribe_url: "https://nexareach.com/unsubscribe?token=sample",
};

/**
 * Strips script tags, unsafe event handlers, and javascript: links to ensure security.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";

  return html
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove object and embed tags
    .replace(/<(object|embed)\b[^<]*(?:(?!<\/(object|embed)>)<[^<]*)*<\/(object|embed)>/gi, "")
    // Remove inline event handlers (onload, onclick, onerror, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    // Remove javascript: URLs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
}

/**
 * Replaces personalization variables such as {{first_name}} or {{first_name|there}}
 * with provided contact data or fallback value.
 */
export function interpolatePersonalization(
  content: string,
  data: PersonalizationData = SAMPLE_PERSONALIZATION
): string {
  if (!content) return "";

  // Pattern matches {{variable}} or {{variable|fallback}}
  return content.replace(/\{\{\s*([a-zA-Z0-9_-]+)(?:\|([^}]+))?\s*\}\}/g, (_, key, fallback) => {
    const value = data[key.toLowerCase()] ?? data[key];
    if (value !== undefined && value !== null && value.trim() !== "") {
      return value;
    }
    return fallback !== undefined ? fallback : `[${key}]`;
  });
}

/**
 * Wraps raw email HTML in a standards-compliant, responsive HTML container
 * with proper meta tags, styling reset, and max-width 600px table layout.
 */
export function wrapInEmailContainer(
  innerHtml: string,
  options?: {
    title?: string;
    preheader?: string;
    backgroundColor?: string;
    contentWidth?: number;
    css?: string;
  }
): string {
  const title = options?.title || "NexaReach Email";
  const preheader = options?.preheader || "";
  const bg = options?.backgroundColor || "#f8fafc";
  const width = options?.contentWidth || 600;
  const extraCss = options?.css || "";

  const sanitizedInner = sanitizeEmailHtml(innerHtml);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  ${extraCss ? `<style type="text/css">${extraCss}</style>` : ""}
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      min-height: 100% !important;
      width: 100% !important;
      background-color: ${bg};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      box-sizing: border-box;
    }
    div[style*="margin: 16px 0"] {
      margin: 0 !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      height: auto;
      display: block;
      border: 0;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
      }
      .responsive-pad {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bg}; word-spacing: normal;">
  ${
    preheader
      ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>`
      : ""
  }
  <div style="background-color: ${bg}; padding: 24px 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bg};">
      <tr>
        <td align="center" style="padding: 0;">
          <!--[if (gte mso 9)|(IE)]>
          <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="${width}">
          <tr>
          <td align="center" valign="top" width="${width}">
          <![endif]-->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: ${width}px; margin: 0 auto;" class="email-container">
            <tr>
              <td style="padding: 0; text-align: left;">
                ${sanitizedInner}
              </td>
            </tr>
          </table>
          <!--[if (gte mso 9)|(IE)]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
