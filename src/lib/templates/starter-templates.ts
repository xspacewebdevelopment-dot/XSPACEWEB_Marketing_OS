/**
 * Production-ready starter templates for NexaReach Email Marketing
 * 7 Curated Templates + Blank Canvas
 */

export interface StarterTemplate {
  id: string;
  name: string;
  category: "NEWSLETTER" | "PROMOTIONAL" | "PRODUCT" | "EVENT" | "WELCOME" | "FOLLOWUP" | "CUSTOM";
  description: string;
  subject: string;
  preheader: string;
  thumbnailSvg: string;
  compiledHtml: string;
  editorJson: any;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // 1. NEWSLETTER
  {
    id: "starter-newsletter",
    name: "Weekly Industry Digest",
    category: "NEWSLETTER",
    description: "Modern newsletter layout featuring editorial hero, article list, curated reads, and author note.",
    subject: "NexaReach Weekly: The Deliverability Revolution 🚀",
    preheader: "Top insights on sender reputation, list hygiene, and high-conversion copy.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><rect x="60" y="44" width="80" height="12" rx="3" fill="#2563EB"/><rect x="60" y="70" width="280" height="40" rx="6" fill="#EFF6FF"/><rect x="60" y="122" width="180" height="10" rx="2" fill="#0F172A"/><rect x="60" y="138" width="280" height="6" rx="2" fill="#94A3B8"/><rect x="60" y="148" width="260" height="6" rx="2" fill="#CBD5E1"/><rect x="60" y="172" width="130" height="50" rx="4" fill="#F1F5F9"/><rect x="210" y="172" width="130" height="50" rx="4" fill="#F1F5F9"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Header -->
  <tr>
    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
      <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase;">Nexa<span style="color: #2563eb;">Reach</span> Dispatch</span>
      <p style="margin: 6px 0 0; font-size: 12px; color: #64748b; font-weight: 500;">ISSUE #42 • MARKETING ARCHITECTURE</p>
    </td>
  </tr>
  <!-- Hero Section -->
  <tr>
    <td style="padding: 36px 32px 28px; background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);">
      <span style="display: inline-block; padding: 4px 10px; background-color: #dbeafe; color: #1d4ed8; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">Editor's Pick</span>
      <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 1.3; font-weight: 800; color: #0f172a;">Why Domain Reputation Beats List Size Every Single Time</h1>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">Hello {{first_name|marketer}}, cold email algorithms are smarter than ever. In this week's issue, we break down why deep mailbox verification and bounce prevention are your #1 revenue drivers.</p>
      <a href="https://example.com/read-more" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Read Deep-Dive →</a>
    </td>
  </tr>
  <!-- Article 1 -->
  <tr>
    <td style="padding: 28px 32px; border-bottom: 1px solid #f1f5f9;">
      <h2 style="margin: 0 0 8px; font-size: 17px; font-weight: 700; color: #0f172a;">3 Metrics You Should Watch in {{company|your workspace}}</h2>
      <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: #64748b;">Stop looking only at open rates. Discover the deliverability triad: inbox placement score, spam trap avoidance, and SMTP handshake speed.</p>
      <a href="https://example.com/metrics" style="color: #2563eb; font-size: 13px; font-weight: 600; text-decoration: none;">Explore Analysis &rarr;</a>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding: 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">You are receiving this because you subscribed to updates at NexaReach.</p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">NexaReach Platform, 100 Tech Blvd, Suite 400 • <a href="{{unsubscribe_url|#}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a></p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 2. PROMOTIONAL OFFER
  {
    id: "starter-promotional",
    name: "Limited-Time Flash Offer",
    category: "PROMOTIONAL",
    description: "High-converting promo email with discount badge, hero product spotlight, urgency CTA, and coupon code.",
    subject: "⚡ Special Offer for {{first_name|you}}: Unlock 40% Off",
    preheader: "Exclusive limited-time discount inside. Claim your voucher before it expires.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#091E3A"/><rect x="40" y="24" width="320" height="232" rx="8" fill="#0B2447" stroke="#1E3A8A"/><circle cx="200" cy="80" r="28" fill="#F59E0B"/><rect x="130" y="124" width="140" height="14" rx="3" fill="#F8FAFC"/><rect x="80" y="148" width="240" height="8" rx="2" fill="#94A3B8"/><rect x="120" y="174" width="160" height="32" rx="6" fill="#2563EB"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 40px 32px; background: linear-gradient(135deg, #091e3a 0%, #1e3a8a 100%); text-align: center; color: #ffffff;">
      <div style="display: inline-block; padding: 6px 14px; background-color: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; border-radius: 9999px; font-size: 12px; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 16px;">
        ⚡ EXCLUSIVE VIP INCENTIVE
      </div>
      <h1 style="margin: 0 0 12px; font-size: 32px; line-height: 1.2; font-weight: 800; color: #ffffff;">Save 40% On All Verification Credits</h1>
      <p style="margin: 0 auto 24px; max-width: 440px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hey {{first_name|there}}, upgrade your sender infrastructure today. Verify bulk contact lists with 99.4% precision and never worry about hard bounces again.</p>
      
      <!-- Coupon Box -->
      <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px; background: rgba(255, 255, 255, 0.1); border: 1px dashed #60a5fa; border-radius: 8px; padding: 12px 24px;">
        <tr>
          <td align="center">
            <span style="font-size: 12px; color: #93c5fd; text-transform: uppercase; display: block; margin-bottom: 4px;">Use Promo Code</span>
            <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 2px;">NEXAPRO40</span>
          </td>
        </tr>
      </table>

      <a href="https://example.com/claim" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">Claim Your 40% Discount →</a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">Offer valid for {{company|your team}} until midnight Friday.</p>
    </td>
  </tr>
  <!-- Guarantee Row -->
  <tr>
    <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">🛡️ 100% Satisfaction Guarantee • 24/7 SMTP Engine Uptime • Instant Credit Top-up</p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 3. PRODUCT LAUNCH
  {
    id: "starter-product",
    name: "New Feature / Product Launch",
    category: "PRODUCT",
    description: "Announcement template designed for SaaS product reveals, major updates, and feature showcases.",
    subject: "Introducing NexaReach AI Engine for {{company|Your Business}}",
    preheader: "Say hello to our biggest update yet. Here is what's new.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><rect x="60" y="44" width="120" height="12" rx="3" fill="#6366F1"/><rect x="60" y="70" width="280" height="70" rx="8" fill="#EEF2FF"/><circle cx="100" cy="180" r="16" fill="#E0E7FF"/><rect x="126" y="172" width="180" height="8" rx="2" fill="#1E293B"/><rect x="126" y="186" width="140" height="6" rx="2" fill="#94A3B8"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 40px 32px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
      <span style="font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">MAJOR RELEASE</span>
      <h1 style="margin: 8px 0 12px; font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.25;">Meet NexaReach Email Templates 2.0</h1>
      <p style="margin: 0 auto 24px; max-width: 480px; font-size: 14px; line-height: 1.6; color: #475569;">Hi {{first_name|there}}, we built the email editor you've always wanted. Drag-and-drop flexibility, genuine inline styling, live preview, and direct Resend test delivery.</p>
      <a href="https://example.com/try-it" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">Explore The Editor Now →</a>
    </td>
  </tr>
  <!-- Feature 1 -->
  <tr>
    <td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="48" valign="top" style="padding-right: 16px;">
            <div style="height: 40px; width: 40px; border-radius: 8px; background-color: #e0e7ff; color: #4338ca; text-align: center; line-height: 40px; font-size: 20px;">🎨</div>
          </td>
          <td valign="top">
            <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #0f172a;">Modular Drag & Drop Canvas</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">Drop pre-built hero cards, CTA buttons, and social blocks directly into your email template with instant visual feedback.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Feature 2 -->
  <tr>
    <td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="48" valign="top" style="padding-right: 16px;">
            <div style="height: 40px; width: 40px; border-radius: 8px; background-color: #dbeafe; color: #1d4ed8; text-align: center; line-height: 40px; font-size: 20px;">⚡</div>
          </td>
          <td valign="top">
            <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #0f172a;">Instant Resend Testing</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">Dispatch test emails directly to your inbox through verified senders to check rendering in real mail clients.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Built for {{company|growth teams}}. <a href="{{unsubscribe_url|#}}" style="color: #64748b;">Unsubscribe</a></p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 4. EVENT INVITATION
  {
    id: "starter-event",
    name: "Webinar & Event Invitation",
    category: "EVENT",
    description: "Sleek event invite with date badge, speaker highlights, agenda summary, and one-click RSVP button.",
    subject: "You're Invited: Live Masterclass for {{company|Modern Marketers}}",
    preheader: "Join 500+ leaders this Thursday. Secure your free seat now.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><rect x="60" y="44" width="70" height="60" rx="8" fill="#F43F5E"/><rect x="144" y="48" width="180" height="14" rx="3" fill="#0F172A"/><rect x="144" y="70" width="140" height="8" rx="2" fill="#94A3B8"/><rect x="60" y="126" width="280" height="50" rx="6" fill="#FFF1F2"/><rect x="60" y="196" width="280" height="34" rx="6" fill="#E11D48"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 36px 32px; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%);">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="72" valign="top" style="padding-right: 18px;">
            <div style="background-color: #e11d48; color: #ffffff; border-radius: 10px; text-align: center; padding: 8px 4px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: 700;">OCT</span>
              <span style="display: block; font-size: 24px; font-weight: 900; line-height: 1;">24</span>
              <span style="display: block; font-size: 9px; opacity: 0.9;">2026</span>
            </div>
          </td>
          <td valign="top">
            <span style="font-size: 11px; font-weight: 700; color: #e11d48; text-transform: uppercase;">LIVE WEBINAR • 45 MINS</span>
            <h1 style="margin: 4px 0 8px; font-size: 20px; font-weight: 800; color: #0f172a;">Mastering High-Scale Email Deliverability</h1>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Thursday, Oct 24 • 11:00 AM EDT / 8:00 AM PDT</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 28px 32px; border-bottom: 1px solid #f1f5f9;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">Hi {{first_name|there}}, join our senior infrastructure architects as we demonstrate how to clean 100,000+ subscriber lists, avoid honeypot traps, and ensure 99%+ inbox placement.</p>
      
      <div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569;">Key Takeaways:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #64748b; line-height: 1.6;">
          <li>Real-time SMTP handshake mechanics</li>
          <li>Automating suppression lists for bounces & spam complaints</li>
          <li>Designing mobile-first emails that convert</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://example.com/rsvp" style="display: inline-block; background-color: #e11d48; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Claim Your Free Pass →</a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Can't make it live? Register anyway and we'll send you the replay recording. <a href="{{unsubscribe_url|#}}" style="color: #64748b;">Unsubscribe</a></p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 5. WELCOME EMAIL
  {
    id: "starter-welcome",
    name: "Warm Onboarding & Welcome",
    category: "WELCOME",
    description: "Friendly onboarding email introducing key platform features, setup milestones, and direct support.",
    subject: "Welcome to NexaReach, {{first_name|friend}}! Let's get started.",
    preheader: "Here are 3 quick steps to set up your marketing workspace.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><circle cx="200" cy="64" r="20" fill="#10B981"/><rect x="110" y="96" width="180" height="12" rx="3" fill="#0F172A"/><rect x="80" y="118" width="240" height="6" rx="2" fill="#94A3B8"/><rect x="60" y="142" width="280" height="30" rx="4" fill="#F0FDF4"/><rect x="60" y="180" width="280" height="30" rx="4" fill="#F0FDF4"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 40px 32px 28px; text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
      <div style="height: 52px; width: 52px; border-radius: 9999px; background-color: #10b981; color: #ffffff; line-height: 52px; font-size: 24px; margin: 0 auto 16px;">👋</div>
      <h1 style="margin: 0 0 10px; font-size: 26px; font-weight: 800; color: #0f172a;">Welcome to NexaReach!</h1>
      <p style="margin: 0 auto; max-width: 440px; font-size: 14px; line-height: 1.6; color: #475569;">Hi {{first_name|there}}, we're thrilled to have you and {{company|your team}} on board. You're now equipped with modern email marketing architecture.</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 24px 32px;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">3 Steps to Launch Your First Campaign:</h3>

      <!-- Step 1 -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <tr>
          <td width="32" style="font-weight: 800; color: #10b981; font-size: 16px;">1.</td>
          <td style="font-size: 13px; color: #334155;"><strong>Clean your contact list</strong> — Run single or bulk email verifications to drop bad addresses.</td>
        </tr>
      </table>

      <!-- Step 2 -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <tr>
          <td width="32" style="font-weight: 800; color: #10b981; font-size: 16px;">2.</td>
          <td style="font-size: 13px; color: #334155;"><strong>Design your email template</strong> — Pick a starter template and customize it in our visual editor.</td>
        </tr>
      </table>

      <!-- Step 3 -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <tr>
          <td width="32" style="font-weight: 800; color: #10b981; font-size: 16px;">3.</td>
          <td style="font-size: 13px; color: #334155;"><strong>Send test deliverability</strong> — Check your layout in real mailboxes using our Resend integration.</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="https://example.com/get-started" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px;">Go to Dashboard →</a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Have questions? Reply directly to this email or reach us at support@nexareach.com.</p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 6. FOLLOW-UP
  {
    id: "starter-followup",
    name: "Quick Personal Follow-Up",
    category: "FOLLOWUP",
    description: "Minimalist, high-deliverability plain-text style follow-up for sales outreach and client check-ins.",
    subject: "Quick follow up regarding {{company|your project}}",
    preheader: "Checking in to see if you had any thoughts on our previous note.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><rect x="60" y="44" width="220" height="8" rx="2" fill="#0F172A"/><rect x="60" y="60" width="280" height="6" rx="2" fill="#64748B"/><rect x="60" y="74" width="260" height="6" rx="2" fill="#94A3B8"/><rect x="60" y="88" width="180" height="6" rx="2" fill="#CBD5E1"/><rect x="60" y="112" width="120" height="28" rx="6" fill="#0F172A"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 36px 32px;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b;">Hi {{first_name|there}},</p>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">I wanted to quickly follow up on my note from last week regarding email deliverability and sender reputation at {{company|your organization}}.</p>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">Did you have a chance to look over the benchmark audit we generated? We recently helped a team with a similar stack reduce bounce rates from 6.8% down to under 0.4% in their first send.</p>
      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #334155;">Would you be open to a 10-minute walk-through this Wednesday or Thursday?</p>
      
      <div style="margin-bottom: 24px;">
        <a href="https://example.com/calendar" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 6px;">Pick a 10-min slot →</a>
      </div>

      <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1e293b;">Best regards,</p>
      <p style="margin: 0; font-size: 14px; color: #475569;">The NexaReach Growth Team</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;"><a href="{{unsubscribe_url|#}}" style="color: #64748b;">Unsubscribe</a> from this thread.</p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 7. RE-ENGAGEMENT
  {
    id: "starter-reengagement",
    name: "Winback & Re-Engagement",
    category: "PROMOTIONAL",
    description: "Target unengaged contacts with an empathetic check-in, preference update link, or exclusive return incentive.",
    subject: "We miss you at NexaReach, {{first_name|there}} 💌",
    preheader: "Are you still interested in email deliverability updates? Let us know.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#E2E8F0"/><circle cx="200" cy="70" r="24" fill="#FEF3C7"/><rect x="110" y="110" width="180" height="12" rx="3" fill="#0F172A"/><rect x="70" y="132" width="260" height="6" rx="2" fill="#94A3B8"/><rect x="90" y="144" width="220" height="6" rx="2" fill="#CBD5E1"/><rect x="130" y="174" width="140" height="32" rx="6" fill="#D97706"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 40px 32px 30px; text-align: center; background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);">
      <div style="font-size: 40px; margin-bottom: 12px;">💭</div>
      <h1 style="margin: 0 0 10px; font-size: 26px; font-weight: 800; color: #0f172a;">Is this goodbye, {{first_name|there}}?</h1>
      <p style="margin: 0 auto; max-width: 440px; font-size: 14px; line-height: 1.6; color: #475569;">We noticed you haven't opened our last few updates. We only want to send content you actually love and find valuable for {{company|your team}}.</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 24px 32px 32px; text-align: center;">
      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #334155;">If you'd like to stay on our list, simply click below to confirm your subscription and claim <strong>500 free verification credits</strong> on us.</p>
      
      <div style="margin-bottom: 24px;">
        <a href="https://example.com/keep-me" style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px;">Yes, Keep Me Updated! →</a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b;">Or if your interests have shifted, you can <a href="{{unsubscribe_url|#}}" style="color: #d97706; text-decoration: underline;">unsubscribe with one click</a>. No hard feelings at all!</p>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },

  // 8. BLANK CANVAS
  {
    id: "starter-blank",
    name: "Blank Canvas",
    category: "CUSTOM",
    description: "Start from scratch with a clean, responsive 600px email shell ready for your custom blocks.",
    subject: "Custom Email from {{company|NexaReach}}",
    preheader: "Preview your custom message here.",
    thumbnailSvg: `<svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"><rect width="400" height="280" fill="#F8FAFC"/><rect x="40" y="24" width="320" height="232" rx="8" fill="white" stroke="#CBD5E1" stroke-dasharray="6 6"/><circle cx="200" cy="120" r="20" fill="#F1F5F9"/><path d="M200 112V128M192 120H208" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/><rect x="130" y="152" width="140" height="8" rx="2" fill="#CBD5E1"/></svg>`,
    compiledHtml: `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <tr>
    <td style="padding: 48px 32px; text-align: center;">
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #0f172a;">Your Email Title Here</h2>
      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #64748b;">Start adding blocks from the left panel to design your custom marketing email.</p>
      <a href="https://example.com" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Call to Action →</a>
    </td>
  </tr>
</table>`,
    editorJson: null,
  },
];
