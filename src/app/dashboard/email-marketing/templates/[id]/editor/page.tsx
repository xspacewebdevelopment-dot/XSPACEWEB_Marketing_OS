"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  Eye,
  Send,
  Sparkles,
  Layers,
  Palette,
  Settings,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Columns,
  ShoppingBag,
  Divide,
  Share2,
  Code2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Plus,
  ExternalLink,
  Search,
  Check,
  Tag as TagIcon,
  HelpCircle,
  Maximize2,
  CloudUpload,
  Loader2,
} from "lucide-react";
import { PreviewTestModal } from "../../components/PreviewTestModal";
import { wrapInEmailContainer } from "@/lib/templates/compiler";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

// Preset Unsplash imagery for instant 1-click demonstrations
const PRESET_IMAGES = [
  {
    name: "Tech SaaS Banner",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Product Showcase",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Modern Workspace",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Team Highlights",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
  },
];

interface PresetBlock {
  id: string;
  category: "Typography" | "Actions" | "Hero & Cards" | "Media & Layout" | "Footer";
  name: string;
  description: string;
  iconName: string;
  content: string;
}

const PRESET_BLOCKS: PresetBlock[] = [
  // 1. TYPOGRAPHY
  {
    id: "heading-1",
    category: "Typography",
    name: "Hero Heading (H1)",
    description: "Bold 28px display headline for announcements",
    iconName: "Type",
    content: `<h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 14px; line-height: 1.25; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Elevate Your Email Engagement</h1>`,
  },
  {
    id: "heading-2",
    category: "Typography",
    name: "Section Title (H2)",
    description: "Crisp 20px header for content sections",
    iconName: "Type",
    content: `<h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Key Highlights & Product Updates</h2>`,
  },
  {
    id: "kicker-badge",
    category: "Typography",
    name: "Kicker Badge",
    description: "Uppercase pill tag for categories or alerts",
    iconName: "Sparkles",
    content: `<table border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 12px;"><tr><td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">MAJOR RELEASE</td></tr></table>`,
  },
  {
    id: "paragraph",
    category: "Typography",
    name: "Body Paragraph",
    description: "15px body copy with merge tag personalization",
    iconName: "Type",
    content: `<p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Hi {{first_name|there}}, we've rolled out powerful new capabilities to your {{company|workspace}} account. Discover how our tools help your team achieve inbox placement and high conversion rates.</p>`,
  },
  {
    id: "testimonial",
    category: "Typography",
    name: "Quote Callout",
    description: "Italicized customer testimonial with border",
    iconName: "Sparkles",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; border-left: 4px solid #2563eb; background-color: #f8fafc; border-radius: 0 8px 8px 0; padding: 16px 20px;"><tr><td><p style="margin: 0 0 8px; font-size: 14px; font-style: italic; color: #1e293b; line-height: 1.55; font-family: sans-serif;">&ldquo;NexaReach delivered a 38% bump in open rates across all our cold sequences in the first month alone.&rdquo;</p><p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; font-family: sans-serif;">&mdash; Sarah Jenkins, Head of Revenue at CloudPulse</p></td></tr></table>`,
  },

  // 2. ACTIONS
  {
    id: "button-primary",
    category: "Actions",
    name: "Primary CTA Button",
    description: "High-converting solid blue button with hover style",
    iconName: "MousePointerClick",
    content: `<table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 20px auto;"><tr><td align="center" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);"><a href="https://example.com" target="_blank" style="display: inline-block; padding: 13px 30px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Get Started Now &rarr;</a></td></tr></table>`,
  },
  {
    id: "button-secondary",
    category: "Actions",
    name: "Secondary Outline Button",
    description: "Subtle bordered button for alternative actions",
    iconName: "MousePointerClick",
    content: `<table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 16px auto;"><tr><td align="center" style="border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff;"><a href="https://example.com" target="_blank" style="display: inline-block; padding: 11px 24px; font-size: 13px; font-weight: 600; color: #334155; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Read Documentation</a></td></tr></table>`,
  },
  {
    id: "button-dual",
    category: "Actions",
    name: "Dual CTA Group",
    description: "Side-by-side primary and secondary action pair",
    iconName: "MousePointerClick",
    content: `<table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 20px auto;"><tr><td style="padding: 0 6px;"><table border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color: #2563eb; border-radius: 8px;"><a href="https://example.com/signup" target="_blank" style="display: inline-block; padding: 11px 22px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; font-family: sans-serif;">Start Free Trial &rarr;</a></td></tr></table></td><td style="padding: 0 6px;"><table border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff;"><a href="https://example.com/demo" target="_blank" style="display: inline-block; padding: 11px 22px; font-size: 13px; font-weight: 600; color: #475569; text-decoration: none; font-family: sans-serif;">Watch 2-Min Demo</a></td></tr></table></td></tr></table>`,
  },

  // 3. HERO & CARDS
  {
    id: "hero-banner",
    category: "Hero & Cards",
    name: "Modern Gradient Hero",
    description: "High-impact card with headline, copy, and button",
    iconName: "Sparkles",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); border: 1px solid #dbeafe; border-radius: 12px; padding: 36px 24px; text-align: center; margin: 20px 0;"><tr><td align="center"><table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px;"><tr><td style="background-color: #dbeafe; border-radius: 9999px; padding: 3px 12px; font-size: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">ENTERPRISE DELIVERY</td></tr></table><h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 10px; line-height: 1.25; font-family: sans-serif;">Deliverability at Scale</h1><p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 auto 20px; max-width: 480px; font-family: sans-serif;">Protect your domain sender reputation with automated email verification and reliable Resend dispatch.</p><table border="0" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="background-color: #2563eb; border-radius: 8px;"><a href="https://example.com" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; font-family: sans-serif;">Explore Features &rarr;</a></td></tr></table></td></tr></table>`,
  },
  {
    id: "product-card",
    category: "Hero & Cards",
    name: "Product Offer Card",
    description: "Product image showcase with price and buy button",
    iconName: "ShoppingBag",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 18px 0; font-family: sans-serif;"><tr><td align="center" style="background-color: #f8fafc; padding: 24px;"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&q=80" alt="Product" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" /></td></tr><tr><td style="padding: 20px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td><h3 style="margin: 0 0 6px; font-size: 17px; font-weight: 700; color: #0f172a;">Smart Lead & Verification Pro</h3><p style="margin: 0 0 16px; font-size: 13px; color: #64748b; line-height: 1.5;">Clean up to 50,000 email addresses with deep MX/SMTP and role account verification.</p><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="background-color: #0f172a; border-radius: 8px;"><a href="https://example.com/checkout" target="_blank" style="display: block; padding: 11px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none;">Claim Special Offer ($49) &rarr;</a></td></tr></table></td></tr></table></td></tr></table>`,
  },
  {
    id: "coupon-card",
    category: "Hero & Cards",
    name: "Promo Coupon Box",
    description: "Voucher box with coupon code and discount terms",
    iconName: "TagIcon",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px dashed #3b82f6; background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 18px 0; font-family: sans-serif;"><tr><td align="center"><span style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px;">EXCLUSIVE PROMOTION</span><h2 style="font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0 0 8px;">Take 25% Off Your Next Upgrade</h2><p style="font-size: 13px; color: #3b82f6; margin: 0 0 14px;">Apply this checkout code before this Friday:</p><table border="0" cellpadding="0" cellspacing="0" align="center"><tr><td style="background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 24px; font-family: monospace; font-size: 16px; font-weight: 800; color: #1e40af; letter-spacing: 0.1em;">NEXA25VIP</td></tr></table></td></tr></table>`,
  },
  {
    id: "features-3",
    category: "Hero & Cards",
    name: "3-Feature Highlights",
    description: "3 side-by-side value props with icons",
    iconName: "Sparkles",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; font-family: sans-serif;"><tr><td width="32%" valign="top" style="padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;"><div style="font-size: 20px; margin-bottom: 6px;">⚡</div><strong style="display: block; font-size: 14px; color: #0f172a; margin-bottom: 4px;">Zero Setup</strong><span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block;">Plug-and-play with verified Resend domains.</span></td><td width="2%"></td><td width="32%" valign="top" style="padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;"><div style="font-size: 20px; margin-bottom: 6px;">🛡️</div><strong style="display: block; font-size: 14px; color: #0f172a; margin-bottom: 4px;">99.8% Inbox</strong><span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block;">Eliminate hard bounces and protect your domain.</span></td><td width="2%"></td><td width="32%" valign="top" style="padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;"><div style="font-size: 20px; margin-bottom: 6px;">📊</div><strong style="display: block; font-size: 14px; color: #0f172a; margin-bottom: 4px;">Live Insights</strong><span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block;">Track opens, clicks, and bounces in real-time.</span></td></tr></table>`,
  },

  // 4. MEDIA & LAYOUT
  {
    id: "image-responsive",
    category: "Media & Layout",
    name: "Responsive Banner Image",
    description: "Full-width image container with rounded corners",
    iconName: "ImageIcon",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0;"><tr><td align="center"><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" alt="Email Media" style="max-width: 100%; height: auto; display: block; border-radius: 8px;" /></td></tr></table>`,
  },
  {
    id: "two-columns",
    category: "Media & Layout",
    name: "2-Column Grid",
    description: "Side-by-side columns (50% / 50%) for comparisons",
    iconName: "Columns",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; font-family: sans-serif;"><tr><td width="48%" valign="top" style="padding-right: 2%;"><h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #0f172a;">Core Platform</h3><p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">Build and personalize email sequences that drive customer retention.</p></td><td width="48%" valign="top" style="padding-left: 2%;"><h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #0f172a;">API Integrations</h3><p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">Connect with webhooks, CSV contact lists, and automatic suppression.</p></td></tr></table>`,
  },

  // 5. FOOTER & STRUCTURE
  {
    id: "divider",
    category: "Footer",
    name: "Divider Line",
    description: "Subtle 1px horizontal separator",
    iconName: "Divide",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 22px 0;"><tr><td style="border-top: 1px solid #e2e8f0; font-size: 1px; line-height: 1px; height: 1px;">&nbsp;</td></tr></table>`,
  },
  {
    id: "spacer",
    category: "Footer",
    name: "Vertical Spacer (24px)",
    description: "Clean spacing block to balance layout rhythm",
    iconName: "Divide",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="24" style="font-size: 1px; line-height: 24px;">&nbsp;</td></tr></table>`,
  },
  {
    id: "social-links",
    category: "Footer",
    name: "Social Links",
    description: "Twitter / X, LinkedIn, and GitHub links",
    iconName: "Share2",
    content: `<table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 20px auto; font-family: sans-serif;"><tr><td style="padding: 0 10px;"><a href="https://twitter.com" target="_blank" style="color: #64748b; font-size: 13px; font-weight: 600; text-decoration: none;">Twitter / X</a></td><td style="color: #cbd5e1;">•</td><td style="padding: 0 10px;"><a href="https://linkedin.com" target="_blank" style="color: #64748b; font-size: 13px; font-weight: 600; text-decoration: none;">LinkedIn</a></td><td style="color: #cbd5e1;">•</td><td style="padding: 0 10px;"><a href="https://github.com" target="_blank" style="color: #64748b; font-size: 13px; font-weight: 600; text-decoration: none;">GitHub</a></td></tr></table>`,
  },
  {
    id: "footer-block",
    category: "Footer",
    name: "Legal Footer & Unsubscribe",
    description: "CAN-SPAM compliant address and unsubscribe tag",
    iconName: "Settings",
    content: `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 28px 16px; text-align: center; font-family: sans-serif; border-top: 1px solid #e2e8f0; margin-top: 24px;"><tr><td align="center"><p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">You are receiving this email because you subscribed to {{company|NexaReach}} updates.</p><p style="margin: 0; font-size: 11px; color: #94a3b8;">100 Tech Square, Suite 500 • <a href="{{unsubscribe_url|#}}" target="_blank" style="color: #64748b; text-decoration: underline;">Unsubscribe from list</a></p></td></tr></table>`,
  },
];

function getBlockIcon(name: string) {
  switch (name) {
    case "Type":
      return <Type className="h-4 w-4 text-blue-400" />;
    case "MousePointerClick":
      return <MousePointerClick className="h-4 w-4 text-indigo-400" />;
    case "Sparkles":
      return <Sparkles className="h-4 w-4 text-amber-400" />;
    case "ShoppingBag":
      return <ShoppingBag className="h-4 w-4 text-emerald-400" />;
    case "ImageIcon":
      return <ImageIcon className="h-4 w-4 text-sky-400" />;
    case "Columns":
      return <Columns className="h-4 w-4 text-purple-400" />;
    case "Divide":
      return <Divide className="h-4 w-4 text-slate-400" />;
    case "Share2":
      return <Share2 className="h-4 w-4 text-pink-400" />;
    default:
      return <Layers className="h-4 w-4 text-blue-400" />;
  }
}

function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "#ffffff";
  if (rgb.startsWith("#")) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  const r = parseInt(match[0]).toString(16).padStart(2, "0");
  const g = parseInt(match[1]).toString(16).padStart(2, "0");
  const b = parseInt(match[2]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export default function EmailTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = params?.id as string;
  const returnUrl = searchParams.get("returnUrl");

  // Editor states
  const [template, setTemplate] = useState<{
    id: string;
    name: string;
    category: string;
    status: string;
    subject: string | null;
    preheader: string | null;
    compiledHtml: string | null;
    editorJson: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Studio Navigation Tabs
  const [activeTab, setActiveTab] = useState<"styles" | "tags" | "settings">("styles");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Block catalog filters
  const [blockCategoryFilter, setBlockCategoryFilter] = useState<string>("ALL");
  const [blockSearch, setBlockSearch] = useState<string>("");

  // Style Inspector States
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedHref, setSelectedHref] = useState("");
  const [selectedSrc, setSelectedSrc] = useState("");
  const [selectedColor, setSelectedColor] = useState("#0f172a");
  const [selectedBgColor, setSelectedBgColor] = useState("#ffffff");
  const [selectedFontSize, setSelectedFontSize] = useState("15px");
  const [selectedTextAlign, setSelectedTextAlign] = useState<"left" | "center" | "right">("left");
  const [selectedFontWeight, setSelectedFontWeight] = useState<"normal" | "bold">("normal");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Template Settings state
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templatePreheader, setTemplatePreheader] = useState("");
  const [emailWidth, setEmailWidth] = useState(600);
  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch initial template from API
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/email-marketing/templates/${templateId}`);
        if (!res.ok) {
          router.push("/dashboard/email-marketing/templates");
          return;
        }
        const json = await res.json();
        setTemplate(json.data);
        setTemplateName(json.data.name || "Untitled Template");
        setTemplateSubject(json.data.subject || "");
        setTemplatePreheader(json.data.preheader || "");
      } catch (err) {
        console.error("Failed to load template", err);
      } finally {
        setLoading(false);
      }
    }
    if (templateId) loadTemplate();
  }, [templateId, router]);

  // Save template handler
  const handleSave = useCallback(
    async (silent = false) => {
      if (!editorRef.current || !templateId) return;

      try {
        if (!silent) setSaving(true);

        const editor = editorRef.current;
        if (editor.RichTextEditor?.isActive?.()) {
          editor.RichTextEditor.endEdit?.();
        }

        const innerHtml = editor.getHtml();
        const css = editor.getCss();
        const fullHtml = wrapInEmailContainer(innerHtml, {
          title: templateName,
          preheader: templatePreheader,
          backgroundColor: canvasBgColor || "#ffffff",
          contentWidth: emailWidth,
          css: css,
        });

        const editorJson = editor.getProjectData();

        const res = await fetch(`/api/dashboard/email-marketing/templates/${templateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateName,
            subject: templateSubject,
            preheader: templatePreheader,
            compiledHtml: fullHtml,
            editorJson: editorJson,
          }),
        });

        if (res.ok) {
          setHasUnsavedChanges(false);
          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setLastSavedTime(now);
          if (!silent) {
            setNotice(`Template saved at ${now}`);
            setTimeout(() => setNotice(null), 3000);
          }
        }
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [templateId, templateName, templateSubject, templatePreheader, emailWidth, canvasBgColor]
  );

  // Autosave interval (every 30s if changes exist)
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleSave(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, handleSave]);

  // Initialize GrapesJS
  useEffect(() => {
    if (loading || !template || editorRef.current) return;

    let isMounted = true;

    function initGrapes() {
      if (!isMounted || !containerRef.current) return;

      const editor = grapesjs.init({
        container: containerRef.current,
        fromElement: false,
        height: "100%",
        width: "auto",
        storageManager: false,
        panels: { defaults: [] },
        deviceManager: {
          devices: [
            { id: "desktop", name: "Desktop", width: "100%" },
            { id: "mobile", name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
      });

      // Load initial content from database
      if (template?.editorJson) {
        editor.loadProjectData(template.editorJson);
      } else if (template?.compiledHtml) {
        editor.setComponents(template.compiledHtml);
      }

      // Selection tracking for right panel styling
      editor.on("component:selected", (model: any) => {
        if (!model) {
          setSelectedTag(null);
          return;
        }

        const tag = model.get("tagName")?.toLowerCase() || "element";
        setSelectedTag(tag);

        const el = model.getEl?.();
        const style = model.getStyle() || {};
        const computed = el && el.ownerDocument?.defaultView ? el.ownerDocument.defaultView.getComputedStyle(el) : null;

        const color = style.color || el?.style?.color || (computed ? computed.color : "#0f172a");
        const bgColor = style["background-color"] || el?.style?.backgroundColor || (computed ? computed.backgroundColor : "#ffffff");
        const fontSize = style["font-size"] || el?.style?.fontSize || (computed ? computed.fontSize : "15px");
        const textAlign = (style["text-align"] || el?.style?.textAlign || el?.getAttribute?.("align") || (computed ? computed.textAlign : "left")) as "left" | "center" | "right";
        const fontWeight = (style["font-weight"] || el?.style?.fontWeight || (computed ? computed.fontWeight : "normal"));

        setSelectedColor(color.startsWith("rgb") ? rgbToHex(color) : color);
        setSelectedBgColor(bgColor.startsWith("rgb") ? rgbToHex(bgColor) : bgColor);
        setSelectedFontSize(fontSize || "15px");
        setSelectedTextAlign(textAlign === "center" || textAlign === "right" ? textAlign : "left");
        setSelectedFontWeight(fontWeight === "bold" || parseInt(fontWeight) >= 700 ? "bold" : "normal");

        const attrs = model.getAttributes() || {};
        const href = attrs.href || el?.getAttribute?.("href") || (model.find("a")?.[0]?.getAttributes()?.href || "");
        setSelectedHref(href);

        let src = attrs.src || el?.getAttribute?.("src");
        if (!src && tag !== "img") {
          const innerImg = model.find("img")?.[0];
          src = innerImg?.getAttributes()?.src || innerImg?.getEl?.()?.getAttribute?.("src");
        }
        setSelectedSrc(src || "");

        // Switch to Styles tab so user can immediately customize
        setActiveTab("styles");
      });

      editor.on("component:deselected", () => {
        setSelectedTag(null);
      });

      // Change tracking for autosave and unsaved-changes notice
      const markChanges = () => {
        setHasUnsavedChanges(true);
      };
      editor.on("component:update", markChanges);
      editor.on("component:add", markChanges);
      editor.on("component:remove", markChanges);
      editor.on("style:update", markChanges);

      editorRef.current = editor;
    }

    initGrapes();

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [loading, template]);

  // Insert Block into canvas (Click-to-Add)
  const handleInsertBlock = (block: PresetBlock) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selected = editor.getSelected();

    let newComp;
    if (selected && selected.parent()) {
      const parent = selected.parent();
      const index = selected.index();
      newComp = parent.append(block.content, { at: index + 1 });
    } else {
      newComp = editor.addComponents(block.content);
    }

    if (Array.isArray(newComp) && newComp.length > 0) {
      editor.select(newComp[0]);
    } else if (newComp) {
      editor.select(newComp);
    }

    setHasUnsavedChanges(true);
    setActiveTab("styles");
    setNotice(`Added ${block.name}`);
    setTimeout(() => setNotice(null), 2500);
  };

  // Quick Style updates from right panel (Alignment, Font, Colors)
  const handleUpdateSelectedStyle = (prop: string, val: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selected = editor.getSelected();
    if (!selected) return;

    // 1. Update component model style in GrapesJS
    const curStyle = { ...(selected.getStyle() || {}) };
    curStyle[prop] = val;
    selected.setStyle(curStyle);
    selected.addStyle({ [prop]: val });

    // 2. Update CSS rule in GrapesJS CSS Composer matching this component ID or classes
    const compId = selected.getId?.();
    if (compId && editor.Css) {
      const rule = editor.Css.getRule(`#${compId}`);
      if (rule) {
        rule.addStyle({ [prop]: val });
      }
    }

    // 3. Direct DOM update on canvas element for instant visual feedback
    const el = selected.getEl?.();
    if (el) {
      if (prop === "text-align") {
        el.style.textAlign = val;
        el.style.setProperty("text-align", val, "important");

        // If the element is an image
        if (el.tagName === "IMG") {
          el.style.display = "block";
          if (val === "center") {
            el.style.margin = "0 auto";
            el.style.setProperty("margin", "0 auto", "important");
          } else if (val === "right") {
            el.style.margin = "0 0 0 auto";
            el.style.setProperty("margin", "0 0 0 auto", "important");
          } else {
            el.style.margin = "0";
            el.style.setProperty("margin", "0", "important");
          }
        }

        // If the element itself is a table or td
        if (el.tagName === "TABLE") {
          el.setAttribute("align", val);
          el.style.margin = val === "center" ? "0 auto" : val === "right" ? "0 0 0 auto" : "0";
          el.style.setProperty("margin", val === "center" ? "0 auto" : val === "right" ? "0 0 0 auto" : "0", "important");
        }
        if (el.tagName === "TD") {
          el.setAttribute("align", val);
          el.style.textAlign = val;
          el.style.setProperty("text-align", val, "important");
        }

        // Also check if inside a table / td container
        const td = el.closest("td");
        if (td) {
          td.setAttribute("align", val);
          td.style.textAlign = val;
          td.style.setProperty("text-align", val, "important");
        }
        const table = el.closest("table");
        if (table && table !== el) {
          if (el.tagName === "TABLE" || el.querySelector("table")) {
            table.setAttribute("align", val);
            if (val === "center") table.style.margin = "0 auto";
            else if (val === "right") table.style.margin = "0 0 0 auto";
            else table.style.margin = "0";
          }
        }
      } else if (prop === "font-size") {
        el.style.fontSize = val;
        el.style.setProperty("font-size", val, "important");
      } else if (prop === "color") {
        el.style.color = val;
        el.style.setProperty("color", val, "important");
      } else if (prop === "background-color") {
        el.style.backgroundColor = val;
        el.style.setProperty("background-color", val, "important");
      } else if (prop === "font-weight") {
        el.style.fontWeight = val;
        el.style.setProperty("font-weight", val, "important");
      }

      // Update any matching rule in iframe document stylesheets
      try {
        const doc = el.ownerDocument;
        if (doc) {
          for (const sheet of Array.from(doc.styleSheets)) {
            try {
              for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
                if (compId && (rule as CSSStyleRule).selectorText === `#${compId}`) {
                  (rule as CSSStyleRule).style.setProperty(prop, val, "important");
                }
              }
            } catch {}
          }
        }
      } catch {}

      // Keep inline style attribute on model updated with !important for bulletproof email client rendering
      const existingAttrs = selected.getAttributes() || {};
      let updatedStyleAttr = existingAttrs.style || "";
      const propRegex = new RegExp(`${prop}:\\s*[^;]+;?`, "gi");
      updatedStyleAttr = updatedStyleAttr.replace(propRegex, "").trim();
      if (updatedStyleAttr && !updatedStyleAttr.endsWith(";")) updatedStyleAttr += ";";
      updatedStyleAttr += ` ${prop}: ${val} !important;`;

      el.setAttribute("style", updatedStyleAttr.trim());
      selected.addAttributes({ style: updatedStyleAttr.trim() });
    }

    // 4. Propagate alignment to parent table hierarchy if applicable
    if (prop === "text-align") {
      const tagName = selected.get("tagName")?.toLowerCase();
      if (tagName === "table" || tagName === "td") {
        selected.addAttributes({ align: val });
      }
      let p = selected.parent();
      while (p && p.get("tagName")?.toLowerCase() !== "body") {
        const pTag = p.get("tagName")?.toLowerCase();
        if (pTag === "td") {
          p.addAttributes({ align: val });
          const pEl = p.getEl?.();
          if (pEl) {
            pEl.setAttribute("align", val);
            pEl.style.textAlign = val;
            pEl.style.setProperty("text-align", val, "important");
            const curPStyle = pEl.getAttribute("style") || "";
            p.addAttributes({ style: curPStyle });
          }
        }
        p = p.parent();
      }
    }

    setHasUnsavedChanges(true);
  };

  // Image source update handler
  const handleUpdateImageSrc = (newSrc: string) => {
    setSelectedSrc(newSrc);
    if (!editorRef.current) return;
    const editor = editorRef.current;
    let selected = editor.getSelected();

    if (!selected) {
      const added = editor.addComponents(
        `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0;"><tr><td align="center"><img src="${newSrc}" alt="Email Media" style="max-width: 100%; height: auto; display: block; border-radius: 8px;" /></td></tr></table>`
      );
      if (Array.isArray(added) && added.length > 0) editor.select(added[0]);
      setHasUnsavedChanges(true);
      setNotice("Inserted image block");
      setTimeout(() => setNotice(null), 2500);
      return;
    }

    // Check if selected is an img or contains an img
    const isImg = selected.get("tagName")?.toLowerCase() === "img";
    const imgComps = isImg ? [selected] : selected.find("img");

    if (imgComps && imgComps.length > 0) {
      imgComps.forEach((comp: any) => {
        const a = { ...(comp.getAttributes() || {}) };
        a.src = newSrc;
        comp.set("attributes", a);
        comp.addAttributes({ src: newSrc });
        const compEl = comp.getEl?.();
        if (compEl) {
          compEl.setAttribute("src", newSrc);
          compEl.src = newSrc;
        }
      });
    } else {
      const selEl = selected.getEl?.();
      const domImgs = selEl ? (selEl.tagName === "IMG" ? [selEl] : Array.from(selEl.querySelectorAll("img"))) : [];
      if (domImgs.length > 0) {
        domImgs.forEach((img: any) => {
          img.setAttribute("src", newSrc);
          img.src = newSrc;
        });
        if (selEl) {
          selected.components(selEl.innerHTML);
        }
      } else {
        const newComp = selected.append(
          `<img src="${newSrc}" alt="Email Media" style="max-width: 100%; height: auto; display: block; border-radius: 8px;" />`
        );
        if (Array.isArray(newComp) && newComp.length > 0) {
          editor.select(newComp[0]);
        }
      }
    }

    setHasUnsavedChanges(true);
    setNotice("Image updated on canvas");
    setTimeout(() => setNotice(null), 2500);
  };

  // Cloudinary CDN Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select a valid image file (PNG, JPG, WebP, GIF, SVG)");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    try {
      setIsUploadingImage(true);
      setNotice("Uploading image to Cloudinary CDN...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/dashboard/email-marketing/templates/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image to Cloudinary");
      }

      const data = await res.json();
      if (data.url) {
        handleUpdateImageSrc(data.url);
        setNotice("Image uploaded to Cloudinary CDN successfully!");
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setNotice(err.message || "Upload failed. Please try again.");
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  // Link URL update handler
  const handleUpdateLink = (newHref: string) => {
    setSelectedHref(newHref);
    if (!editorRef.current) return;
    const selected = editorRef.current.getSelected();
    if (!selected) return;

    const el = selected.getEl?.();
    if (el) {
      if (el.tagName === "A") {
        el.setAttribute("href", newHref);
      } else {
        const a = el.querySelector("a");
        if (a) a.setAttribute("href", newHref);
      }
    }

    if (selected.get("tagName")?.toLowerCase() === "a") {
      selected.addAttributes({ href: newHref });
    } else {
      const aComp = selected.find("a")?.[0];
      if (aComp) aComp.addAttributes({ href: newHref });
    }
    setHasUnsavedChanges(true);
  };

  // Personalization variable tag insertion
  const handleInsertTag = (tag: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selected = editor.getSelected();

    if (selected) {
      const el = selected.getEl?.();
      if (el) {
        el.innerHTML = el.innerHTML + ` ${tag}`;
      }
      const cur = selected.get("content") || "";
      selected.set("content", `${cur} ${tag}`);
      setHasUnsavedChanges(true);
      setNotice(`Inserted tag ${tag}`);
    } else {
      editor.addComponents(
        `<p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Hello ${tag}, thank you for choosing NexaReach!</p>`
      );
      setHasUnsavedChanges(true);
      setNotice(`Added text block with ${tag}`);
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(tag).catch(() => {});
    }
    setTimeout(() => setNotice(null), 2500);
  };

  // Filtered blocks based on category & search query
  const filteredBlocks = useMemo(() => {
    return PRESET_BLOCKS.filter((block) => {
      const matchesCategory =
        blockCategoryFilter === "ALL" || block.category === blockCategoryFilter;
      const matchesSearch =
        blockSearch.trim() === "" ||
        block.name.toLowerCase().includes(blockSearch.toLowerCase()) ||
        block.description.toLowerCase().includes(blockSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [blockCategoryFilter, blockSearch]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-300 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-semibold">Loading Email Template Studio...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-200 overflow-hidden select-none">
      {/* 1. TOP STUDIO BAR */}
      <div className="h-16 px-6 bg-[#0a1829] border-b border-slate-800 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-4">
          <Link
            href={returnUrl || "/dashboard/email-marketing/templates"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold border border-slate-700/60"
            title={returnUrl ? "Return to Campaign Builder" : "Return to Templates Gallery"}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{returnUrl ? "Campaign" : "Templates"}</span>
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="bg-transparent text-sm font-bold text-white border border-transparent focus:border-slate-700 focus:bg-slate-800/80 hover:bg-slate-800/60 px-2 py-1 rounded transition-colors max-w-xs md:max-w-sm"
              />
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {template?.category || "TEMPLATE"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 pl-2">
              {hasUnsavedChanges ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  All changes saved {lastSavedTime ? `at ${lastSavedTime}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Device Switcher & Undo/Redo */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-lg border border-slate-700/80 shadow-xs">
          <button
            onClick={() => {
              editorRef.current?.UndoManager?.undo();
              setHasUnsavedChanges(true);
            }}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              editorRef.current?.UndoManager?.redo();
              setHasUnsavedChanges(true);
            }}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => {
              setDeviceMode("desktop");
              editorRef.current?.setDevice("desktop");
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              deviceMode === "desktop"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => {
              setDeviceMode("mobile");
              editorRef.current?.setDevice("mobile");
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              deviceMode === "mobile"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile (375px)</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5">
          {notice && (
            <span className="text-xs text-emerald-400 font-semibold hidden md:inline animate-in fade-in duration-150">
              {notice}
            </span>
          )}

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview & Test</span>
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </div>

      {/* 2. THREE-PANEL STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL A: LEFT (PREBUILT BLOCKS CATALOG) */}
        <div className="w-80 bg-[#0a1829] border-r border-slate-800 flex flex-col shrink-0 select-none">
          <div className="p-3.5 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Content Blocks
              </span>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                Click to Insert
              </span>
            </div>

            {/* Block Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search blocks (button, hero...)"
                value={blockSearch}
                onChange={(e) => setBlockSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px] font-semibold pt-0.5">
              {[
                { id: "ALL", label: "All" },
                { id: "Typography", label: "Text" },
                { id: "Actions", label: "Buttons" },
                { id: "Hero & Cards", label: "Cards" },
                { id: "Media & Layout", label: "Media" },
                { id: "Footer", label: "Footer" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setBlockCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                    blockCategoryFilter === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleInsertBlock(block)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/html", block.content);
                }}
                className="group p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-[#112239] hover:border-blue-500/60 cursor-pointer transition-all duration-150 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-blue-950/80 border border-slate-700/60 group-hover:border-blue-800/60 transition-colors shrink-0">
                    {getBlockIcon(block.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                      {block.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {block.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsertBlock(block);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 group-hover:bg-blue-600 text-[10px] font-bold text-slate-300 group-hover:text-white transition-all shrink-0 mt-0.5"
                >
                  + Add
                </button>
              </div>
            ))}

            {filteredBlocks.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs">
                No blocks match your search query.
              </div>
            )}
          </div>
        </div>

        {/* PANEL B: CENTER (LIVE CANVAS) */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto overflow-x-hidden relative">
          <div
            style={{
              width: deviceMode === "mobile" ? "375px" : `${emailWidth}px`,
              maxWidth: "100%",
              backgroundColor: canvasBgColor,
              minHeight: "750px",
            }}
            className="rounded-xl shadow-2xl border border-slate-800/80 overflow-hidden transition-all duration-200 my-auto sm:my-2 flex flex-col"
          >
            <div ref={containerRef} className="w-full bg-white flex-1 min-h-[750px]" />
          </div>
        </div>

        {/* PANEL C: RIGHT (INSPECTOR, MERGE TAGS & SETTINGS) */}
        <div className="w-80 bg-[#0a1829] border-l border-slate-800 flex flex-col shrink-0">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("styles")}
              className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "styles"
                  ? "bg-slate-800/90 text-blue-400 border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Styles</span>
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "tags"
                  ? "bg-slate-800/90 text-blue-400 border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Merge Tags</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "settings"
                  ? "bg-slate-800/90 text-blue-400 border-b-2 border-blue-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Canvas</span>
            </button>
          </div>

          {/* TAB 1: STYLES INSPECTOR */}
          {activeTab === "styles" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {selectedTag ? (
                <div className="space-y-4">
                  {/* Selected Element Header */}
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/60 flex items-center justify-between">
                    <span className="font-semibold text-blue-300">
                      Selected: &lt;{selectedTag.toUpperCase()}&gt;
                    </span>
                    <button
                      onClick={() => {
                        editorRef.current?.getSelected()?.remove();
                        setSelectedTag(null);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>

                  {/* Text Alignment (Left, Center, Right) */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Text & Block Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/80">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => {
                            setSelectedTextAlign(align);
                            handleUpdateSelectedStyle("text-align", align);
                          }}
                          className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            selectedTextAlign === align
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                          {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                          {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                          <span className="capitalize">{align}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography controls */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Typography
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Font Size</span>
                        <select
                          value={selectedFontSize}
                          onChange={(e) => {
                            setSelectedFontSize(e.target.value);
                            handleUpdateSelectedStyle("font-size", e.target.value);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white"
                        >
                          <option value="12px">12px (Small)</option>
                          <option value="14px">14px (Body)</option>
                          <option value="15px">15px (Standard)</option>
                          <option value="16px">16px (Medium)</option>
                          <option value="18px">18px (Lead)</option>
                          <option value="20px">20px (H3)</option>
                          <option value="24px">24px (H2)</option>
                          <option value="28px">28px (H1)</option>
                          <option value="32px">32px (Display)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Text Color</span>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded p-1">
                          <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => {
                              setSelectedColor(e.target.value);
                              handleUpdateSelectedStyle("color", e.target.value);
                            }}
                            className="h-5 w-6 border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-300">{selectedColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bold Toggle */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          const next = selectedFontWeight === "bold" ? "normal" : "bold";
                          setSelectedFontWeight(next);
                          handleUpdateSelectedStyle("font-weight", next);
                        }}
                        className={`w-full py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          selectedFontWeight === "bold"
                            ? "bg-blue-600/30 border-blue-500 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        <Bold className="h-3.5 w-3.5" />
                        <span>{selectedFontWeight === "bold" ? "Bold Active" : "Regular Weight"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Background & Colors */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Element Background Color
                    </label>
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded p-1.5">
                      <input
                        type="color"
                        value={selectedBgColor}
                        onChange={(e) => {
                          setSelectedBgColor(e.target.value);
                          handleUpdateSelectedStyle("background-color", e.target.value);
                        }}
                        className="h-6 w-8 border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-300">{selectedBgColor}</span>
                    </div>
                  </div>

                  {/* Hyperlink URL (if button or link) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Action Link (URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={selectedHref}
                      onChange={(e) => handleUpdateLink(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                    />
                  </div>

                  {/* Image Controls & Presets */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Image Source & Presets
                    </label>

                    <input
                      type="url"
                      placeholder="Paste Image URL..."
                      value={selectedSrc}
                      onChange={(e) => handleUpdateImageSrc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                    />

                    <label
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition-colors ${
                        isUploadingImage ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                      }`}
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                          <span>Uploading to Cloudinary CDN...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="h-4 w-4 text-blue-400" />
                          <span>Upload Image to Cloudinary</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Instant Royalty-Free Presets */}
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1.5">
                        Or pick a sample preset image:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_IMAGES.map((img) => (
                          <button
                            key={img.name}
                            type="button"
                            onClick={() => handleUpdateImageSrc(img.url)}
                            className="p-1 rounded-lg border border-slate-800 hover:border-blue-500 bg-slate-900 text-left text-[10px] text-slate-300 hover:text-white transition-colors"
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="h-10 w-full object-cover rounded mb-1"
                            />
                            <span className="truncate block">{img.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <MousePointerClick className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-400">
                    Click any block on the canvas to inspect its font, alignment, and styling.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Or select a block from the left panel to insert and automatically open its inspector.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSONALIZATION VARIABLES */}
          {activeTab === "tags" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  Personalization Merge Tags
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Click &ldquo;Insert Tag&rdquo; to add it to your active text block, or copy it to your clipboard. NexaReach replaces these tags dynamically with each recipient&apos;s data when campaigns are dispatched.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    tag: "{{first_name|there}}",
                    name: "Recipient First Name",
                    desc: "Replaced with recipient's first name, or 'there' if missing",
                  },
                  {
                    tag: "{{last_name|Customer}}",
                    name: "Recipient Last Name",
                    desc: "Replaced with recipient's surname",
                  },
                  {
                    tag: "{{company|your team}}",
                    name: "Company Name",
                    desc: "Replaced with workspace or company organization",
                  },
                  {
                    tag: "{{email}}",
                    name: "Recipient Email Address",
                    desc: "Direct contact email address",
                  },
                  {
                    tag: "{{unsubscribe_url|#}}",
                    name: "Unsubscribe URL",
                    desc: "One-click CAN-SPAM compliant unsubscribe link",
                  },
                ].map((item) => (
                  <div
                    key={item.tag}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.name}</span>
                      <code className="text-[10px] text-blue-400 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                        {item.tag}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleInsertTag(item.tag)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Insert on Canvas</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator?.clipboard?.writeText(item.tag);
                          setNotice(`Copied ${item.tag}`);
                          setTimeout(() => setNotice(null), 2000);
                        }}
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CANVAS & TEMPLATE SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Default Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive Update for {{company}}"
                  value={templateSubject}
                  onChange={(e) => {
                    setTemplateSubject(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preview Text (Preheader)
                </label>
                <input
                  type="text"
                  placeholder="Displays in inbox previews before opening"
                  value={templatePreheader}
                  onChange={(e) => {
                    setTemplatePreheader(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Container Width
                </label>
                <select
                  value={emailWidth}
                  onChange={(e) => {
                    setEmailWidth(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                >
                  <option value={600}>600px (Standard Industry Recommendation)</option>
                  <option value={640}>640px (Wide Marketing Format)</option>
                  <option value={560}>560px (Compact Mobile-First Digest)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Canvas Background Color
                </label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded p-1.5">
                  <input
                    type="color"
                    value={canvasBgColor}
                    onChange={(e) => {
                      setCanvasBgColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="h-6 w-8 border-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{canvasBgColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW AND TEST EMAIL MODAL */}
      {isPreviewModalOpen && editorRef.current && (
        <PreviewTestModal
          isOpen={true}
          onClose={() => setIsPreviewModalOpen(false)}
          templateName={templateName}
          templateId={templateId}
          subject={templateSubject}
          preheader={templatePreheader}
          htmlContent={(() => {
            const editor = editorRef.current;
            if (editor?.RichTextEditor?.isActive?.()) {
              editor.RichTextEditor.endEdit?.();
            }
            const inner = editor?.getHtml() || "";
            const css = editor?.getCss() || "";
            return wrapInEmailContainer(inner, {
              title: templateName,
              preheader: templatePreheader,
              backgroundColor: canvasBgColor,
              contentWidth: emailWidth,
              css: css,
            });
          })()}
        />
      )}

      {/* Global CSS overrides for GrapesJS canvas */}
      <style jsx global>{`
        .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
        }
      `}</style>
    </div>
  );
}
