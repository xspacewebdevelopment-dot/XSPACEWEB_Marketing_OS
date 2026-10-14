"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Mail,
  MessageSquare,
  Sparkles,
  Paperclip,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Star,
  Archive,
  User,
  Users,
  Tag,
  Building,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Info,
  Sliders,
  MoreVertical,
  CornerDownLeft,
  Bot,
  ShieldCheck,
  AlertCircle,
  X,
  FileText,
  Lock,
} from "lucide-react";

interface DraftConversation {
  id: string;
  senderName: string;
  senderEmail: string;
  avatarColor: string;
  channel: "EMAIL" | "WHATSAPP" | "INSTAGRAM" | "CHAT";
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  priority: "HIGH" | "NORMAL" | "LOW";
  status: "OPEN" | "PENDING" | "RESOLVED";
  campaignName?: string;
  contact: {
    name: string;
    email: string;
    company: string;
    phone: string;
    status: string;
    tags: string[];
  };
  messages: {
    id: string;
    isInternal: boolean;
    sender: string;
    senderEmail?: string;
    timestamp: string;
    body: string;
  }[];
}

const SAMPLE_DRAFT_CONVERSATIONS: DraftConversation[] = [
  {
    id: "conv-1",
    senderName: "Sarah Jenkins",
    senderEmail: "sarah.jenkins@acmecorp.io",
    avatarColor: "bg-blue-600",
    channel: "EMAIL",
    subject: "Re: Introducing NexaReach AI Engine for Acme Corp",
    preview: "Thanks for the update! We are very interested in the drag-and-drop template editor. Does it support custom HTML exports?",
    timestamp: "10:42 AM",
    unread: true,
    priority: "HIGH",
    status: "OPEN",
    campaignName: "New Feature",
    contact: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@acmecorp.io",
      company: "Acme Corp",
      phone: "+1 (555) 234-5678",
      status: "SUBSCRIBED",
      tags: ["VIP Lead", "Enterprise", "Newsletter"],
    },
    messages: [
      {
        id: "msg-1",
        isInternal: false,
        sender: "Sarah Jenkins",
        senderEmail: "sarah.jenkins@acmecorp.io",
        timestamp: "Today at 10:42 AM",
        body: "Hi NexaReach Team,\n\nThanks for reaching out! We saw your email broadcast regarding the AI Engine and the new template builder.\n\nWe are currently evaluating email marketing solutions for our enterprise workspace. Does your system support exporting compiled HTML templates, and what is your average delivery rate for custom domains?\n\nLooking forward to your response.\n\nBest regards,\nSarah Jenkins\nVP of Marketing, Acme Corp",
      },
      {
        id: "msg-2",
        isInternal: true,
        sender: "Arijeet (You)",
        timestamp: "Today at 10:48 AM",
        body: "Internal Note: Sarah is a high-intent enterprise lead from the latest broadcast. Preparing personalized demo link with custom domain instructions.",
      },
    ],
  },
  {
    id: "conv-2",
    senderName: "Marcus Vance",
    senderEmail: "marcus@vancetech.com",
    avatarColor: "bg-violet-600",
    channel: "EMAIL",
    subject: "Pricing inquiry regarding dedicated IP pools",
    preview: "Could you clarify the volume tiers required for dedicated IP warmup schedules?",
    timestamp: "Yesterday",
    unread: false,
    priority: "NORMAL",
    status: "OPEN",
    campaignName: "Weekly Newsletter",
    contact: {
      name: "Marcus Vance",
      email: "marcus@vancetech.com",
      company: "Vance Technologies",
      phone: "+1 (555) 890-1234",
      status: "SUBSCRIBED",
      tags: ["Deliverability", "Prospect"],
    },
    messages: [
      {
        id: "msg-21",
        isInternal: false,
        sender: "Marcus Vance",
        senderEmail: "marcus@vancetech.com",
        timestamp: "Yesterday at 3:15 PM",
        body: "Hello,\n\nWe send around 150k emails per week. Could you clarify if your platform provides dedicated IP pools and automated warmup schedules?\n\nThanks,\nMarcus",
      },
    ],
  },
];

export default function UnifiedInboxPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ASSIGNED" | "RESOLVED">("ALL");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("conv-1");
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [composerMode, setComposerMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [replyText, setReplyText] = useState("");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Filter conversations
  const filteredConversations = SAMPLE_DRAFT_CONVERSATIONS.filter((conv) => {
    if (activeTab === "UNREAD" && !conv.unread) return false;
    if (activeTab === "RESOLVED" && conv.status !== "RESOLVED") return false;
    if (activeTab === "ALL" && conv.status === "RESOLVED") return false;
    if (selectedChannel !== "ALL" && conv.channel !== selectedChannel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        conv.senderName.toLowerCase().includes(q) ||
        conv.subject.toLowerCase().includes(q) ||
        conv.preview.toLowerCase().includes(q) ||
        conv.senderEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedConv = SAMPLE_DRAFT_CONVERSATIONS.find((c) => c.id === selectedId) || null;

  const handleGenerateAiReply = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      setReplyText(
        "Hi Sarah,\n\nThank you for reaching out! Yes, NexaReach fully supports exporting compiled, production-ready HTML templates from our drag-and-drop editor.\n\nFor custom authenticated domains, our deliverability infrastructure leverages deep DNS authentication (SPF, DKIM, DMARC) and automated suppression lists, ensuring 99%+ deliverability.\n\nWould you be open to a quick 10-minute walkthrough this week?\n\nBest,\nNexaReach Team"
      );
      setGeneratingAi(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 select-none overflow-hidden">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs shrink-0 z-10 border-b border-blue-800/40">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-bold tracking-wide">Unified Inbox (UI Draft)</span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <span className="text-slate-300 hidden sm:inline">
            Visual prototype for multi-channel reply aggregation (Email, WhatsApp, Chat).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChannelModal(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Channels Setup
          </button>
        </div>
      </div>

      {/* Main Three-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: FOLDERS & CHANNELS (Left Sidebar) */}
        <div className="w-60 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search inbox..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
            {/* Standard Views */}
            <div className="space-y-0.5">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Views
              </span>
              <button
                onClick={() => setActiveTab("ALL")}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors ${
                  activeTab === "ALL"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-3.5 w-3.5" />
                  <span>All Conversations</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-bold text-slate-600">
                  {SAMPLE_DRAFT_CONVERSATIONS.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("UNREAD")}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors ${
                  activeTab === "UNREAD"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Unread</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 font-bold text-blue-700">
                  1
                </span>
              </button>

              <button
                onClick={() => setActiveTab("ASSIGNED")}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors ${
                  activeTab === "ASSIGNED"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Assigned to me</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-bold text-slate-600">
                  2
                </span>
              </button>

              <button
                onClick={() => setActiveTab("RESOLVED")}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors ${
                  activeTab === "RESOLVED"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolved</span>
                </div>
                <span className="text-[10px] text-slate-400">0</span>
              </button>
            </div>

            {/* Inbound Channels (Future Integrations) */}
            <div className="space-y-0.5 pt-2 border-t border-slate-100">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Channels
              </span>
              <button
                onClick={() => setSelectedChannel("ALL")}
                className={`w-full px-2.5 py-1 rounded-lg text-left text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                  selectedChannel === "ALL" ? "text-blue-700 font-bold bg-blue-50/60" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>All Channels</span>
              </button>

              <button
                onClick={() => setSelectedChannel("EMAIL")}
                className={`w-full px-2.5 py-1 rounded-lg text-left text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                  selectedChannel === "EMAIL" ? "text-blue-700 font-bold bg-blue-50/60" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span>Email Replies</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              </button>

              {/* Coming Soon Channels */}
              <div className="px-2.5 py-1 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-emerald-600 opacity-60" />
                  <span>WhatsApp Business</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                  Soon
                </span>
              </div>

              <div className="px-2.5 py-1 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-pink-600 opacity-60" />
                  <span>Instagram Direct</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                  Soon
                </span>
              </div>

              <div className="px-2.5 py-1 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-blue-700 opacity-60" />
                  <span>Website Live Chat</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                  Soon
                </span>
              </div>
            </div>

            {/* Smart Labels */}
            <div className="space-y-0.5 pt-2 border-t border-slate-100">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Labels
              </span>
              <div className="px-2.5 py-1 text-[11px] text-slate-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>VIP Inquiries</span>
              </div>
              <div className="px-2.5 py-1 text-[11px] text-slate-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Campaign Replies</span>
              </div>
              <div className="px-2.5 py-1 text-[11px] text-slate-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Sales Qualified</span>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center gap-2">
            <Lock className="h-3 w-3 text-slate-400 shrink-0" />
            <span>Encrypted Inbound Sync</span>
          </div>
        </div>

        {/* PANEL 2: CONVERSATION LIST (Middle Panel) */}
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              {filteredConversations.length} Conversation{filteredConversations.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Latest</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No conversations found</p>
                <p className="text-[11px] text-slate-400">
                  Inbound replies from your campaigns will appear here automatically.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`p-3.5 transition-colors cursor-pointer relative ${
                      isSelected ? "bg-blue-50/50 border-l-4 border-blue-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`h-7 w-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${conv.avatarColor}`}
                        >
                          {conv.senderName.charAt(0)}
                        </div>
                        <span className={`text-xs truncate ${conv.unread ? "font-bold text-slate-900" : "text-slate-700"}`}>
                          {conv.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {conv.timestamp}
                      </span>
                    </div>

                    <div className="mt-1">
                      <div className={`text-xs truncate ${conv.unread ? "font-bold text-slate-900" : "text-slate-800"}`}>
                        {conv.subject}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {conv.preview}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold uppercase">
                          {conv.channel}
                        </span>
                        {conv.campaignName && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 truncate max-w-[100px]">
                            {conv.campaignName}
                          </span>
                        )}
                      </div>

                      {conv.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 3: CONVERSATION THREAD & REPLY COMPOSER (Right Panel) */}
        {selectedConv ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 truncate">
                      {selectedConv.subject}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedConv.channel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    From: <span className="text-slate-800 font-medium">{selectedConv.senderName}</span> &lt;{selectedConv.senderEmail}&gt;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    title="Star conversation"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => setShowContactDetails(!showContactDetails)}
                    className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                      showContactDetails
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="Toggle contact info"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Thread Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl text-xs space-y-2 border max-w-2xl ${
                      msg.isInternal
                        ? "bg-amber-50/70 border-amber-200/80 ml-auto"
                        : "bg-white border-slate-200 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{msg.sender}</span>
                        {msg.isInternal && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>
                    </div>

                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {msg.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply Composer */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0 space-y-3">
                {/* Composer Mode Toggles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setComposerMode("REPLY")}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        composerMode === "REPLY"
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Reply to Customer
                    </button>
                    <button
                      onClick={() => setComposerMode("NOTE")}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        composerMode === "NOTE"
                          ? "bg-amber-100 text-amber-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Internal Note
                    </button>
                  </div>

                  {/* AI Assistant Button */}
                  <button
                    onClick={handleGenerateAiReply}
                    disabled={generatingAi}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{generatingAi ? "Generating..." : "Draft with AI"}</span>
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    composerMode === "REPLY"
                      ? "Write a reply to Sarah Jenkins... (or click 'Draft with AI')"
                      : "Add an internal note visible only to your workspace teammates..."
                  }
                  className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:ring-1 resize-none ${
                    composerMode === "NOTE"
                      ? "bg-amber-50/40 border-amber-200 focus:ring-amber-500 text-amber-950"
                      : "bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-blue-500 text-slate-800"
                  }`}
                />

                {/* Bottom Bar: Attachments, Templates & Send */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <button
                      onClick={() => setShowNoticeModal(true)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      title="Attach file (Coming Soon)"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Link
                      href="/dashboard/email-marketing/templates"
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      title="Insert saved template"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  </div>

                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                      composerMode === "NOTE"
                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                    }`}
                  >
                    <span>{composerMode === "NOTE" ? "Save Note" : "Send Reply"}</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Details Drawer (Right-most sub-panel) */}
            {showContactDetails && (
              <div className="w-72 border-l border-slate-200 bg-white p-4 space-y-4 shrink-0 overflow-y-auto text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Contact Profile</h3>
                  <button
                    onClick={() => setShowContactDetails(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {selectedConv.contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{selectedConv.contact.name}</div>
                    <div className="text-[11px] text-slate-500">{selectedConv.contact.company}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Email Address
                    </span>
                    <span className="text-slate-700 font-medium break-all">
                      {selectedConv.contact.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="text-slate-700 font-medium">
                      {selectedConv.contact.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Subscription Consent
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                      <ShieldCheck className="h-3 w-3" />
                      {selectedConv.contact.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Campaign Attribution
                    </span>
                    <span className="text-blue-600 font-bold block mt-0.5">
                      {selectedConv.campaignName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Audience Tags
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedConv.contact.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/dashboard/contacts"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View in Audience Directory</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center text-xs text-slate-500 space-y-3">
            <Inbox className="h-10 w-10 text-slate-300" />
            <h3 className="font-bold text-slate-800 text-sm">Select a Conversation</h3>
            <p className="max-w-xs text-slate-400">
              Pick a customer message from the list to view its full conversation thread and reply.
            </p>
          </div>
        )}
      </div>

      {/* NOTICE MODAL: UI Draft Phase Confirmation */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Unified Inbox Draft</h3>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This is the interactive UI draft for the future NexaReach Unified Inbox.
              Two-way live SMTP/IMAP mailbox synchronization, outbound reply delivery, and multichannel WhatsApp integrations will be connected in the upcoming phase.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700 block">Upcoming Integrations:</span>
              <p>&bull; Automatic campaign reply detection via MX / Webhook routing</p>
              <p>&bull; Automatic sequence pausing upon customer reply</p>
              <p>&bull; WhatsApp Business &amp; Website Live Chat multi-inbox</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANNELS SETUP MODAL */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Inbox Channels Setup</h3>
              </div>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Configure which communication channels aggregate inbound messages into your NexaReach unified queue.
            </p>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-900">Email Broadcast Replies</div>
                    <div className="text-[11px] text-slate-500">
                      Replies to campaigns sent via verified domains (e.g. xspaceweb.com)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Ready for Sync
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-900">WhatsApp Business Cloud API</div>
                    <div className="text-[11px] text-slate-500">
                      Two-way customer service and broadcast messaging
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  Coming Soon
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-pink-600" />
                  <div>
                    <div className="font-bold text-slate-900">Instagram Direct &amp; Messenger</div>
                    <div className="text-[11px] text-slate-500">
                      Social DM aggregation for marketing leads
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  Coming Soon
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowChannelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
