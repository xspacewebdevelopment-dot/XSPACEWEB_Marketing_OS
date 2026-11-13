"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone,
  Sparkles,
  Send,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  Info,
  CheckCircle2,
  Lock,
  Tag,
  HelpCircle,
  AlertCircle,
  Copy,
  Layers,
  ArrowRight,
  ShieldCheck,
  Users,
  Check,
  RotateCcw,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  AlertTriangle,
  Save,
  Clock,
  Trash2,
  Loader2,
  FolderOpen,
  PlusCircle,
  ArrowDownToLine,
  Phone,
  User,
} from "lucide-react";
import {
  calculateSmsEncoding,
  validateSenderId,
  isValidPhoneNumber,
  formatPhoneNumber,
  type SmsEncodingInfo,
} from "@/lib/sms/gsm";

interface SmsComposerTabProps {
  phoneContactsCount?: number;
  workspaceId?: string;
  initialDraftId?: string | null;
  initialTemplateId?: string | null;
  initialTestPhone?: string | null;
  initialContactId?: string | null;
}

interface ContactOption {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  smsConsent?: "OPTED_IN" | "OPTED_OUT" | "PENDING";
  lists?: Array<{ id: string; name: string }>;
}

interface ContactListOption {
  id: string;
  name: string;
  contactCount: number;
}

interface ServerDraftSummary {
  id: string;
  name: string;
  protocol: "SMS" | "RCS";
  status: string;
  senderId: string;
  messageText: string;
  rcsCardTitle?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
  rcsMediaUrl?: string | null;
  rcsSuggestion?: string | null;
  audienceType: "ALL" | "LIST" | "TEST";
  listId?: string | null;
  testPhone?: string | null;
  characterCount: number;
  segments: number;
  updatedAt: string;
  createdAt: string;
}

const PRESET_BANNERS = [
  {
    name: "Gradient Blue",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Product Launch",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Special Invitation",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
  },
];

const DEFAULT_SAMPLE_CONTACT = {
  firstName: "Sarah",
  lastName: "Connor",
  name: "Sarah Connor",
  company: "NexaReach Inc",
  phone: "+1 (555) 234-5678",
  email: "sarah.connor@example.com",
  optOutUrl: "https://nexareach.com/opt-out",
};

export function SmsComposerTab({
  phoneContactsCount = 0,
  workspaceId = "default",
  initialDraftId = null,
  initialTemplateId = null,
  initialTestPhone = null,
  initialContactId = null,
}: SmsComposerTabProps) {
  // -------------------------------------------------------------
  // STATE: Active Draft & Content
  // -------------------------------------------------------------
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [pendingTemplateLoad, setPendingTemplateLoad] = useState<any | null>(null);
  const [protocol, setProtocol] = useState<"SMS" | "RCS">("SMS");
  const [workspaceEncodingPreference, setWorkspaceEncodingPreference] = useState<"AUTO" | "GSM-7" | "UCS-2">("AUTO");
  const [campaignTitle, setCampaignTitle] = useState("Product Update Broadcast");
  const [senderId, setSenderId] = useState("NEXAREACH");
  const [messageText, setMessageText] = useState(
    "Hi {{firstName}}, your NexaReach account is upgraded with high-throughput SMS & RCS messaging. Access your portal at https://nexareach.com/d Reply STOP to opt out."
  );

  // RCS specific fields
  const [rcsCardTitle, setRcsCardTitle] = useState("Exclusive NexaReach Feature Update");
  const [rcsActionLabel, setRcsActionLabel] = useState("Explore New Features");
  const [rcsActionUrl, setRcsActionUrl] = useState("https://nexareach.com/dashboard");
  const [rcsMediaUrl, setRcsMediaUrl] = useState(PRESET_BANNERS[0].url);
  const [rcsSuggestion, setRcsSuggestion] = useState("Reply STOP to unsubscribe");

  // Audience & Recipient Selection
  const [audienceType, setAudienceType] = useState<"all" | "list" | "test">(
    initialTestPhone || initialContactId ? "test" : "all"
  );
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [testPhoneNumber, setTestPhoneNumber] = useState(initialTestPhone || "+1 (555) 019-2834");
  const [selectedContactId, setSelectedContactId] = useState<string>(initialContactId || "");

  // Direct single test SMS state
  const [isSendingDirectTest, setIsSendingDirectTest] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<{
    success: boolean;
    status?: string;
    requestId?: string;
    error?: string;
  } | null>(null);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  // Contact and List Data
  const [contactLists, setContactLists] = useState<ContactListOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(true);
  const [showIneligibleList, setShowIneligibleList] = useState<boolean>(false);

  // Server-Side Audience Calculation & Compliance State (Requirements 6 & 7)
  const [serverAudienceData, setServerAudienceData] = useState<{
    totalSelected: number;
    eligibleCount: number;
    excludedCount: number;
    exclusionBreakdown: {
      missingPhone: number;
      invalidPhone: number;
      consentPending: number;
      explicitOptOut: number;
      activeSuppression: number;
    };
    eligibleContacts: any[];
    excludedContacts: Array<{
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      reasonCode: string;
      reasonDescription: string;
    }>;
    estimates: {
      isEstimate: boolean;
      encoding: "GSM-7" | "UCS-2";
      characterCount: number;
      segmentsPerMessage: number;
      estimatedRecipients: number;
      estimatedTotalSegments: number;
      label: string;
    };
  } | null>(null);
  const [isCalculatingAudience, setIsCalculatingAudience] = useState<boolean>(false);

  // Server Drafts Management
  const [serverDrafts, setServerDrafts] = useState<ServerDraftSummary[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [showDraftsDropdown, setShowDraftsDropdown] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // LocalStorage Migration / Import State
  const [localDraftPending, setLocalDraftPending] = useState<any | null>(null);

  // Preview & Simulation Controls
  const [simulatePersonalization, setSimulatePersonalization] = useState<boolean>(true);

  // Validation & Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastNotice, setToastNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localDraftStorageKey = `nexareach_sms_draft_${workspaceId}`;

  // -------------------------------------------------------------
  // FETCH SERVER DRAFTS
  // -------------------------------------------------------------
  const fetchServerDrafts = useCallback(async () => {
    setIsLoadingDrafts(true);
    try {
      const res = await fetch("/api/dashboard/sms-rcs/campaigns?status=DRAFT&limit=20");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.broadcasts)) {
          setServerDrafts(json.broadcasts);
        }
      } else if (res.status === 401) {
        showToast("error", "Session expired. Please log in again to view saved drafts.");
      }
    } catch {
      // Ignore network errors on background fetch
    } finally {
      setIsLoadingDrafts(false);
    }
  }, []);

  // -------------------------------------------------------------
  // FETCH CONTACTS & LISTS + INITIAL SERVER DRAFTS
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingContacts(true);
      try {
        // Fetch contact lists
        const listsRes = await fetch("/api/dashboard/lists");
        if (listsRes.ok) {
          const listsJson = await listsRes.json();
          if (isMounted && listsJson.success && Array.isArray(listsJson.lists)) {
            setContactLists(listsJson.lists);
            if (listsJson.lists.length > 0 && !selectedListId) {
              setSelectedListId(listsJson.lists[0].id);
            }
          }
        }

        // Fetch contacts for recipient calculation
        const contactsRes = await fetch("/api/dashboard/contacts?limit=100");
        if (contactsRes.ok) {
          const contactsJson = await contactsRes.json();
          if (isMounted && contactsJson.success && Array.isArray(contactsJson.contacts)) {
            setContacts(contactsJson.contacts);
            if (initialContactId) {
              const matched = contactsJson.contacts.find((c: any) => c.id === initialContactId);
              if (matched) {
                setSelectedContactId(matched.id);
                if (matched.phone) setTestPhoneNumber(matched.phone);
              }
            }
          }
        }

        // Fetch workspace SMS settings for default sender ID, channel, and encoding preference
        try {
          const settingsRes = await fetch("/api/dashboard/sms-rcs/settings");
          if (settingsRes.ok) {
            const settingsJson = await settingsRes.json();
            if (isMounted && settingsJson.success && settingsJson.settings) {
              const s = settingsJson.settings;
              if (s.encodingPreference) {
                setWorkspaceEncodingPreference(s.encodingPreference);
              }
              // Only apply default senderId / protocol if no initial draft/template is being loaded
              if (!initialDraftId && !initialTemplateId) {
                if (s.defaultSenderId) setSenderId(s.defaultSenderId);
                if (s.defaultChannel) setProtocol(s.defaultChannel);
              }
            }
          }
        } catch {
          // Graceful fallback to existing defaults
        }
      } catch (err) {
        console.warn("Error fetching audience data for SMS composer:", err);
      } finally {
        if (isMounted) setIsLoadingContacts(false);
      }
    }

    loadData();
    fetchServerDrafts();

    // Check for pre-existing local draft in localStorage
    try {
      const savedLocal = localStorage.getItem(localDraftStorageKey);
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed && (parsed.messageText || parsed.campaignTitle)) {
          setLocalDraftPending(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }

    return () => {
      isMounted = false;
    };
  }, [fetchServerDrafts, localDraftStorageKey]);

  // -------------------------------------------------------------
  // SERVER-SIDE AUDIENCE ELIGIBILITY & ESTIMATE ENGINE (Req 6 & 7)
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsCalculatingAudience(true);
      try {
        const res = await fetch("/api/dashboard/sms-rcs/campaigns/audience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audienceType: audienceType.toUpperCase(),
            listId: audienceType === "list" ? selectedListId : null,
            testPhone: audienceType === "test" ? testPhoneNumber : null,
            messageText,
            encodingPreference: workspaceEncodingPreference,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (active && json.success) {
            setServerAudienceData(json);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch server audience calculation:", err);
      } finally {
        if (active) setIsCalculatingAudience(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [audienceType, selectedListId, testPhoneNumber, messageText, workspaceEncodingPreference]);

  // -------------------------------------------------------------
  // POPULATE COMPOSER FROM A SERVER DRAFT
  // -------------------------------------------------------------
  const loadDraftIntoComposer = (draft: ServerDraftSummary) => {
    setActiveDraftId(draft.id);
    setCampaignTitle(draft.name);
    setProtocol(draft.protocol);
    setSenderId(draft.senderId);
    setMessageText(draft.messageText);
    setRcsCardTitle(draft.rcsCardTitle || "Exclusive NexaReach Feature Update");
    setRcsActionLabel(draft.rcsActionLabel || "Explore New Features");
    setRcsActionUrl(draft.rcsActionUrl || "https://nexareach.com/dashboard");
    setRcsMediaUrl(draft.rcsMediaUrl || PRESET_BANNERS[0].url);
    setRcsSuggestion(draft.rcsSuggestion || "Reply STOP to unsubscribe");

    const audType = (draft.audienceType?.toLowerCase() as "all" | "list" | "test") || "all";
    setAudienceType(audType);
    if (draft.listId) setSelectedListId(draft.listId);
    if (draft.testPhone) setTestPhoneNumber(draft.testPhone);

    const formattedTime = new Date(draft.updatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastSavedTime(formattedTime);
    setShowDraftsDropdown(false);
    showToast("info", `Loaded draft: "${draft.name}"`);
  };

  // Reset to brand-new draft
  const handleStartNewDraft = () => {
    setActiveDraftId(null);
    setCampaignTitle("New Broadcast Draft");
    setProtocol("SMS");
    setSenderId("NEXAREACH");
    setMessageText("Hi {{firstName}}, this is a message from NexaReach. Reply STOP to opt out.");
    setLastSavedTime(null);
    setShowDraftsDropdown(false);
    showToast("info", "Started new empty broadcast draft.");
  };

  // -------------------------------------------------------------
  // SAVE AS DRAFT TO SERVER (API POST / PUT)
  // -------------------------------------------------------------
  const handleSaveDraft = async () => {
    if (!campaignTitle.trim()) {
      showToast("error", "Broadcast title cannot be empty when saving draft.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = {
        id: activeDraftId || undefined,
        name: campaignTitle.trim(),
        protocol,
        status: "DRAFT" as const,
        senderId: senderId.trim().toUpperCase() || "NEXAREACH",
        messageText: messageText || "",
        rcsCardTitle: protocol === "RCS" ? rcsCardTitle.trim() || null : null,
        rcsActionLabel: protocol === "RCS" ? rcsActionLabel.trim() || null : null,
        rcsActionUrl: protocol === "RCS" ? rcsActionUrl.trim() || null : null,
        rcsMediaUrl: protocol === "RCS" ? rcsMediaUrl.trim() || null : null,
        rcsSuggestion: protocol === "RCS" ? rcsSuggestion.trim() || null : null,
        audienceType: audienceType.toUpperCase() as "ALL" | "LIST" | "TEST",
        listId: audienceType === "list" ? selectedListId || null : null,
        testPhone: audienceType === "test" ? testPhoneNumber || null : null,
        encoding: encodingInfo.encoding,
        characterCount: encodingInfo.characterCount,
        segments: encodingInfo.segments,
        totalRecipients: serverAudienceData ? serverAudienceData.eligibleCount : eligibleContacts.length,
        totalSegments: serverAudienceData ? serverAudienceData.estimates.estimatedTotalSegments : totalAudienceSegments,
        audienceConfig: serverAudienceData ? {
          totalSelected: serverAudienceData.totalSelected,
          eligibleCount: serverAudienceData.eligibleCount,
          excludedCount: serverAudienceData.excludedCount,
          exclusionBreakdown: serverAudienceData.exclusionBreakdown,
          isEstimate: true,
        } : null,
      };

      const res = await fetch("/api/dashboard/sms-rcs/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          showToast("error", "Session expired. Please log in again to save your draft.");
        } else {
          showToast("error", json.error || "Failed to save draft to database.");
        }
        return;
      }

      // Success
      const saved = json.broadcast;
      setActiveDraftId(saved.id);
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSavedTime(now);

      // Refresh list of server drafts
      fetchServerDrafts();

      // If user had a pending local draft, clear it now that server saved successfully
      if (localDraftPending) {
        localStorage.removeItem(localDraftStorageKey);
        setLocalDraftPending(null);
      }

      showToast("success", `Draft "${saved.name}" saved to database at ${now}`);
    } catch {
      showToast("error", "Network connection error while saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // -------------------------------------------------------------
  // DELETE DRAFT FROM SERVER
  // -------------------------------------------------------------
  const handleDeleteActiveDraft = async () => {
    if (!activeDraftId) {
      handleStartNewDraft();
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this draft from the database?")) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/sms-rcs/campaigns/${activeDraftId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("info", "Draft permanently deleted.");
        handleStartNewDraft();
        fetchServerDrafts();
      } else {
        showToast("error", "Failed to delete draft from server.");
      }
    } catch {
      showToast("error", "Network error while deleting draft.");
    }
  };

  // -------------------------------------------------------------
  // IMPORT PENDING LOCAL DRAFT TO SERVER
  // -------------------------------------------------------------
  const handleImportLocalDraft = async () => {
    if (!localDraftPending) return;

    try {
      setIsSavingDraft(true);
      const payload = {
        name: localDraftPending.campaignTitle || "Imported Local Draft",
        protocol: localDraftPending.protocol || "SMS",
        status: "DRAFT" as const,
        senderId: localDraftPending.senderId || "NEXAREACH",
        messageText: localDraftPending.messageText || "",
        rcsCardTitle: localDraftPending.rcsCardTitle || null,
        rcsActionLabel: localDraftPending.rcsActionLabel || null,
        rcsActionUrl: localDraftPending.rcsActionUrl || null,
        rcsMediaUrl: localDraftPending.rcsMediaUrl || null,
        rcsSuggestion: localDraftPending.rcsSuggestion || null,
        audienceType: (localDraftPending.audienceType?.toUpperCase() || "ALL") as "ALL" | "LIST" | "TEST",
        listId: localDraftPending.selectedListId || null,
      };

      const res = await fetch("/api/dashboard/sms-rcs/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        loadDraftIntoComposer(json.broadcast);
        localStorage.removeItem(localDraftStorageKey);
        setLocalDraftPending(null);
        fetchServerDrafts();
        showToast("success", "Local draft successfully migrated and saved to server database!");
      } else {
        showToast("error", json.error || "Failed to import local draft to server.");
      }
    } catch {
      showToast("error", "Network error during local draft import.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDiscardLocalDraft = () => {
    localStorage.removeItem(localDraftStorageKey);
    setLocalDraftPending(null);
    showToast("info", "Unsaved local draft discarded.");
  };

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToastNotice({ type, text });
    setTimeout(() => {
      setToastNotice(null);
    }, 4500);
  };

  // -------------------------------------------------------------
  // AUTO-LOAD INITIAL DRAFT (e.g. from /campaigns "Edit Draft")
  // -------------------------------------------------------------
  useEffect(() => {
    if (!initialDraftId) return;

    let isMounted = true;
    async function loadInitialDraft() {
      setIsLoadingDrafts(true);
      try {
        const res = await fetch(`/api/dashboard/sms-rcs/campaigns/${initialDraftId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.broadcast) {
            loadDraftIntoComposer(json.broadcast);
          }
        } else if (res.status === 404) {
          showToast("error", "The requested draft was not found or has been removed.");
        }
      } catch (err) {
        console.warn("Failed to load initial draft into composer:", err);
      } finally {
        if (isMounted) setIsLoadingDrafts(false);
      }
    }

    loadInitialDraft();
    return () => {
      isMounted = false;
    };
  }, [initialDraftId]);

  // -------------------------------------------------------------
  // APPLY TEMPLATE HELPER (Fresh composer draft, never overwrites saved draft)
  // -------------------------------------------------------------
  const applyTemplate = (tpl: any) => {
    setActiveDraftId(null);
    setCampaignTitle(`${tpl.name} Broadcast`);
    setProtocol(tpl.protocol || "SMS");
    setMessageText(tpl.messageText || "");
    if (tpl.protocol === "RCS") {
      setRcsCardTitle(tpl.rcsCardTitle || "Exclusive Feature Update");
      setRcsActionLabel(tpl.rcsActionLabel || "Explore Features");
      setRcsActionUrl(tpl.rcsActionUrl || "https://nexareach.com/dashboard");
      setRcsMediaUrl(tpl.rcsMediaUrl || PRESET_BANNERS[0].url);
    }
    setLastSavedTime(null);
    showToast("success", `Template "${tpl.name}" applied as a fresh draft.`);
  };

  // -------------------------------------------------------------
  // AUTO-LOAD INITIAL TEMPLATE (e.g. from /templates "Use in Composer")
  // -------------------------------------------------------------
  useEffect(() => {
    if (!initialTemplateId) return;

    let isMounted = true;
    async function loadTemplate() {
      try {
        const res = await fetch(`/api/dashboard/sms-rcs/templates/${initialTemplateId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.template) {
            const tpl = json.template;
            // Check if user has active inputs or draft loaded
            const isDirty =
              activeDraftId !== null ||
              messageText.trim() !==
                "Hi {{firstName}}, your NexaReach account is upgraded with high-throughput SMS & RCS messaging. Access your portal at https://nexareach.com/d Reply STOP to opt out.";
            if (isDirty) {
              setPendingTemplateLoad(tpl);
            } else {
              applyTemplate(tpl);
            }
          }
        } else if (res.status === 404) {
          showToast("error", "The requested template was not found.");
        }
      } catch (err) {
        console.warn("Failed to load template into composer:", err);
      }
    }

    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [initialTemplateId]);

  // -------------------------------------------------------------
  // TELECOM ENCODING & SEGMENT CALCULATIONS
  // -------------------------------------------------------------
  const encodingInfo: SmsEncodingInfo = useMemo(() => {
    return calculateSmsEncoding(messageText, workspaceEncodingPreference);
  }, [messageText, workspaceEncodingPreference]);

  const senderIdValidation = useMemo(() => {
    return validateSenderId(senderId);
  }, [senderId]);

  // -------------------------------------------------------------
  // RECIPIENT ELIGIBILITY & PHONE RESOLUTION
  // -------------------------------------------------------------
  const filteredAudience = useMemo(() => {
    if (audienceType === "test") {
      const matched = contacts.find((c) => c.id === selectedContactId);
      if (matched) {
        return [matched];
      }
      return [
        {
          id: "manual-test",
          name: "Direct Test Recipient",
          firstName: "Test",
          lastName: "Recipient",
          email: "test@example.com",
          phone: testPhoneNumber,
          company: "Testing Sandbox",
        },
      ];
    }

    if (audienceType === "list") {
      if (!selectedListId) return [];
      return contacts.filter((c) =>
        c.lists?.some((l) => l.id === selectedListId)
      );
    }

    // Default: All workspace contacts
    return contacts;
  }, [audienceType, selectedListId, contacts, testPhoneNumber, selectedContactId]);

  const { eligibleContacts, ineligibleContacts } = useMemo(() => {
    if (serverAudienceData) {
      return {
        eligibleContacts: serverAudienceData.eligibleContacts as ContactOption[],
        ineligibleContacts: serverAudienceData.excludedContacts.map((ex) => ({
          id: ex.id,
          name: ex.name,
          firstName: null,
          lastName: null,
          email: ex.email,
          phone: ex.phone,
          reasonCode: ex.reasonCode,
          reasonDescription: ex.reasonDescription,
        })) as any,
      };
    }

    const eligible: ContactOption[] = [];
    const ineligible: ContactOption[] = [];

    for (const c of filteredAudience) {
      if (isValidPhoneNumber(c.phone)) {
        eligible.push(c);
      } else {
        ineligible.push(c);
      }
    }

    return { eligibleContacts: eligible, ineligibleContacts: ineligible };
  }, [serverAudienceData, filteredAudience]);

  // Total billable segments calculation across audience (calculated only on eligible recipients)
  const totalAudienceSegments = useMemo(() => {
    if (serverAudienceData) {
      return serverAudienceData.estimates.estimatedTotalSegments;
    }
    if (encodingInfo.segments === 0) return 0;
    return eligibleContacts.length * encodingInfo.segments;
  }, [serverAudienceData, eligibleContacts.length, encodingInfo.segments]);

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  // Sample contact for live phone preview
  const sampleContact = useMemo(() => {
    if (selectedContact) {
      return {
        firstName: selectedContact.firstName || selectedContact.name?.split(" ")[0] || "Customer",
        lastName: selectedContact.lastName || selectedContact.name?.split(" ").slice(1).join(" ") || "",
        name: selectedContact.name || [selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") || "Valued Customer",
        company: selectedContact.company || "NexaReach Member",
        phone: selectedContact.phone || testPhoneNumber || "+1 (555) 234-5678",
        email: selectedContact.email || "recipient@example.com",
        optOutUrl: "https://nexareach.com/opt-out",
      };
    }
    if (eligibleContacts.length > 0) {
      const c = eligibleContacts[0];
      return {
        firstName: c.firstName || "Customer",
        lastName: c.lastName || "",
        name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Valued Customer",
        company: c.company || "NexaReach Member",
        phone: c.phone || "+1 (555) 234-5678",
        email: c.email || "recipient@example.com",
        optOutUrl: "https://nexareach.com/opt-out",
      };
    }
    return DEFAULT_SAMPLE_CONTACT;
  }, [selectedContact, eligibleContacts, testPhoneNumber]);

  // Helper to personalize dynamic tags
  const renderMessageContent = (text: string, isPreviewPersonalized: boolean) => {
    if (!text) return "";
    if (!isPreviewPersonalized) return text;

    return text
      .replace(/\{\{firstName\}\}/gi, sampleContact.firstName)
      .replace(/\{\{lastName\}\}/gi, sampleContact.lastName)
      .replace(/\{\{name\}\}/gi, sampleContact.name)
      .replace(/\{\{company\}\}/gi, sampleContact.company)
      .replace(/\{\{phone\}\}/gi, sampleContact.phone)
      .replace(/\{\{email\}\}/gi, sampleContact.email)
      .replace(/\{\{optOutUrl\}\}/gi, sampleContact.optOutUrl);
  };

  const renderedPreviewBody = useMemo(() => {
    return renderMessageContent(messageText, simulatePersonalization);
  }, [messageText, simulatePersonalization, sampleContact]);

  const renderedPreviewTitle = useMemo(() => {
    return renderMessageContent(rcsCardTitle, simulatePersonalization);
  }, [rcsCardTitle, simulatePersonalization, sampleContact]);

  // Dynamic tag insertion into textarea
  const insertTag = (tag: string) => {
    if (!textareaRef.current) {
      setMessageText((prev) => `${prev} ${tag}`);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageText;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setMessageText(`${before}${tag}${after}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // -------------------------------------------------------------
  // VALIDATION & CAMPAIGN REVIEW TRIGGER
  // -------------------------------------------------------------
  const validateCampaign = (): string[] => {
    const errors: string[] = [];

    if (!campaignTitle.trim()) {
      errors.push("Internal Broadcast Title is required.");
    }

    if (!senderIdValidation.valid) {
      errors.push(
        senderIdValidation.message ||
          "Sender ID must be 3-11 alphanumeric characters or a valid phone number."
      );
    }

    if (!messageText.trim()) {
      errors.push("Message text body cannot be empty.");
    }

    if (protocol === "RCS") {
      if (!rcsCardTitle.trim()) {
        errors.push("RCS Card Title is required.");
      }
      if (!rcsActionLabel.trim()) {
        errors.push("RCS Action Button Label is required.");
      }
      if (
        !rcsActionUrl.trim() ||
        (!rcsActionUrl.startsWith("http://") && !rcsActionUrl.startsWith("https://"))
      ) {
        errors.push("RCS Target URL must be a valid HTTP or HTTPS address.");
      }
    }

    if (audienceType === "test") {
      if (!isValidPhoneNumber(testPhoneNumber)) {
        errors.push("Please provide a valid E.164 test phone number (e.g. +1 555-019-2834).");
      }
    } else {
      if (eligibleContacts.length === 0) {
        errors.push(
          "Selected audience has 0 eligible contacts with valid phone numbers. Add contacts with mobile numbers to proceed."
        );
      }
    }

    return errors;
  };

  const handleOpenReview = () => {
    const errors = validateCampaign();
    setValidationErrors(errors);
    if (errors.length === 0) {
      setIsReviewModalOpen(true);
    } else {
      showToast("error", "Please fix validation errors before reviewing broadcast.");
    }
  };

  const handleSendDirectTest = async () => {
    if (!testPhoneNumber.trim()) {
      showToast("error", "Please provide a recipient phone number.");
      return;
    }
    setIsSendingDirectTest(true);
    setDirectTestResult(null);
    try {
      const res = await fetch("/api/dashboard/sms-rcs/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhoneNumber.trim(),
          messageText: renderedPreviewBody || messageText.trim(),
          route: "q",
          confirmLiveSend: true,
          attestedConsent: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDirectTestResult({
          success: true,
          status: data.status,
          requestId: data.requestId,
        });
        showToast("success", `Test SMS submitted to Fast2SMS for ${testPhoneNumber}!`);
      } else {
        setDirectTestResult({
          success: false,
          error: data.error || "Failed to dispatch test message.",
        });
        showToast("error", data.error || "Failed to dispatch test SMS.");
      }
    } catch (err: any) {
      setDirectTestResult({
        success: false,
        error: err.message || "Network error during test send.",
      });
      showToast("error", "Network error during test SMS dispatch.");
    } finally {
      setIsSendingDirectTest(false);
    }
  };

  const handleGrantSelectedContactConsent = async () => {
    if (!selectedContact) return;
    setIsUpdatingConsent(true);
    try {
      const res = await fetch(`/api/dashboard/contacts/${selectedContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smsConsent: "OPTED_IN",
          smsConsentSource: "MANUAL",
          consentNotes: "Opt-in granted via SMS Composer quick action",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === selectedContact.id ? { ...c, smsConsent: "OPTED_IN" } : c
          )
        );
        showToast(
          "success",
          `Opt-in consent granted for ${
            selectedContact.firstName || selectedContact.name || selectedContact.phone
          }! Recipient is now eligible.`
        );
      } else {
        showToast("error", data.error || "Failed to update consent status.");
      }
    } catch {
      showToast("error", "Network error updating consent status.");
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const hasOptOutCompliance = useMemo(() => {
    const lower = messageText.toLowerCase();
    return (
      lower.includes("stop") ||
      lower.includes("opt out") ||
      lower.includes("optout") ||
      lower.includes("unsubscribe") ||
      lower.includes("{{optouturl}}")
    );
  }, [messageText]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            toastNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toastNotice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastNotice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : toastNotice.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span>{toastNotice.text}</span>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-700 px-1 font-bold text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Local Draft Migration Alert (if found from earlier sessions) */}
      {localDraftPending && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/90 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <ArrowDownToLine className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Unsaved local draft detected:</span>{" "}
              <span>
                &ldquo;{localDraftPending.campaignTitle || "Untitled"}&rdquo; from previous browser session.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleImportLocalDraft}
              disabled={isSavingDraft}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer text-[11px]"
            >
              {isSavingDraft ? "Importing..." : "Import to Database"}
            </button>
            <button
              type="button"
              onClick={handleDiscardLocalDraft}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200 transition-colors cursor-pointer text-[11px]"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice & Studio Shell Banner */}
      <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide uppercase text-amber-800">
                Composer & Studio Simulator
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                Carrier Sending Locked
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Draft messages, calculate GSM-7 segment limits, test dynamic contact placeholders, and preview verified RCS business cards. Network provider integration will be connected in the next phase.
            </p>
          </div>
        </div>

        {/* Server Persistence Info & Draft Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {lastSavedTime && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-200">
              <Clock className="h-3 w-3" />
              <span>Saved: {lastSavedTime}</span>
            </div>
          )}

          {/* Saved Drafts Switcher Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDraftsDropdown(!showDraftsDropdown);
                if (!showDraftsDropdown) fetchServerDrafts();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
              <span>Saved Drafts ({serverDrafts.length})</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown Menu of Server Drafts */}
            {showDraftsDropdown && (
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in-50">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Server Database Drafts</span>
                  <button
                    type="button"
                    onClick={handleStartNewDraft}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {isLoadingDrafts ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading drafts...</span>
                    </div>
                  ) : serverDrafts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No saved drafts in database yet.
                    </div>
                  ) : (
                    serverDrafts.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => loadDraftIntoComposer(d)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex flex-col gap-0.5 border-b border-slate-50 transition-colors cursor-pointer ${
                          activeDraftId === d.id ? "bg-blue-50/60 font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                            {d.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {d.protocol}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 truncate">
                          {d.messageText || "Empty message"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Errors Alert if any */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Please correct the following before campaign review:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Studio Grid: Editor (Left) & Real-time Mobile Phone Mockup (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Composer Controls (7 Columns)               */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            {/* Top Draft Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Draft Status:</span>
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-medium">
                  {activeDraftId ? "Editing Saved Draft" : "New Unsaved Draft"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartNewDraft}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Start Fresh</span>
                </button>
              </div>
            </div>

            {/* 1. Protocol Switcher: SMS vs RCS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Select Channel Protocol
                </label>
                <span className="text-[11px] text-slate-400">
                  {protocol === "SMS"
                    ? "Telecommunication Standard SMS"
                    : "Verified Rich Communication Services"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setProtocol("SMS")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    protocol === "SMS"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>Standard SMS (160 char)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProtocol("RCS")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    protocol === "RCS"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>RCS Rich Business Card</span>
                </button>
              </div>
            </div>

            {/* 2. Broadcast Title & Sender ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Broadcast Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autumn Customer Alert"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Sender ID
                  </label>
                  <span
                    className={`text-[10px] font-medium ${
                      senderIdValidation.valid ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {senderIdValidation.valid
                      ? senderIdValidation.type === "PHONE_NUMBER"
                        ? "Valid Number"
                        : "Alphanumeric (3-11)"
                      : "Invalid Format"}
                  </span>
                </div>
                <input
                  type="text"
                  value={senderId}
                  maxLength={16}
                  placeholder="e.g. NEXAREACH or +1555..."
                  onChange={(e) => setSenderId(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono text-slate-800 focus:outline-hidden focus:ring-2 transition-all ${
                    senderIdValidation.valid
                      ? "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                      : "border-rose-300 bg-rose-50/30 focus:ring-rose-500/20 focus:border-rose-500"
                  }`}
                />
              </div>
            </div>

            {/* 3. Recipient Selection & Audience Resolution */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Recipient Target Audience
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {isLoadingContacts ? "Loading audience..." : `${contacts.length} total contacts in workspace`}
                </span>
              </div>

              {/* Source Switcher: All vs List vs Single Test */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceType("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                    audienceType === "all"
                      ? "bg-white border-blue-500 text-blue-700 shadow-xs font-semibold"
                      : "bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  All Workspace Contacts
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType("list")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                    audienceType === "list"
                      ? "bg-white border-blue-500 text-blue-700 shadow-xs font-semibold"
                      : "bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  Specific Contact List
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType("test")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                    audienceType === "test"
                      ? "bg-white border-blue-500 text-blue-700 shadow-xs font-semibold"
                      : "bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  Direct Sandbox Test Number
                </button>
              </div>

              {/* Specific List Dropdown if audienceType === 'list' */}
              {audienceType === "list" && (
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Select Contact List
                  </label>
                  {contactLists.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No contact lists found in this workspace. Create lists under Contacts &gt; Lists &amp; Segments.
                    </p>
                  ) : (
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    >
                      {contactLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.contactCount} contacts)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Single Test Phone Number Input if audienceType === 'test' */}
              {audienceType === "test" && (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Pick from Workspace Contacts <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={selectedContactId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedContactId(id);
                        const match = contacts.find((c) => c.id === id);
                        if (match && match.phone) {
                          setTestPhoneNumber(match.phone);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="">-- Choose from Contacts or enter manually below --</option>
                      {contacts
                        .filter((c) => !!c.phone)
                        .map((c) => {
                          const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.name || c.email;
                          const consentLabel =
                            c.smsConsent === "OPTED_IN"
                              ? "✅ Opted In"
                              : c.smsConsent === "OPTED_OUT"
                              ? "🛑 Opt-Out"
                              : "⏳ Pending";
                          return (
                            <option key={c.id} value={c.id}>
                              {name} ({c.phone}) - {consentLabel}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {selectedContact && (
                    <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold text-indigo-950">
                            {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") ||
                              selectedContact.name ||
                              "Selected Contact"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {selectedContact.smsConsent === "OPTED_IN" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              SMS Opted-In
                            </span>
                          ) : selectedContact.smsConsent === "OPTED_OUT" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              Opted-Out (STOP)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Consent Pending
                            </span>
                          )}

                          {selectedContact.smsConsent !== "OPTED_IN" && (
                            <button
                              type="button"
                              onClick={handleGrantSelectedContactConsent}
                              disabled={isUpdatingConsent}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                              title="Grant SMS opt-in consent for this contact"
                            >
                              {isUpdatingConsent ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : (
                                <Check className="h-2.5 w-2.5" />
                              )}
                              <span>Grant Opt-In</span>
                            </button>
                          )}

                          <Link
                            href={`/dashboard/contacts/${selectedContact.id}`}
                            target="_blank"
                            className="text-slate-400 hover:text-indigo-600 p-1"
                            title="Open Contact Profile"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Email: {selectedContact.email}</span>
                        <span className="font-mono">Phone: {selectedContact.phone}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Direct Test Mobile Number (E.164)
                    </label>
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={(e) => {
                        setTestPhoneNumber(e.target.value);
                      }}
                      placeholder="+91 9876543210 or +1 555-019-2834"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-slate-800"
                    />
                  </div>

                  {/* Quick Live Test Dispatch Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleSendDirectTest}
                      disabled={isSendingDirectTest || !testPhoneNumber.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingDirectTest ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching Test...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Send 1 Live Test SMS Now</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400">
                      Dispatches single SMS via gateway to verify delivery.
                    </span>
                  </div>

                  {directTestResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs space-y-0.5 ${
                        directTestResult.success
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {directTestResult.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        )}
                        <span>
                          {directTestResult.success
                            ? `Submitted: ${directTestResult.status || "SENT"}`
                            : directTestResult.error || "Failed to send test"}
                        </span>
                      </div>
                      {directTestResult.requestId && (
                        <div className="text-[10px] font-mono text-emerald-800">
                          Provider ID: {directTestResult.requestId}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recipient Eligibility Breakdown Card */}
              {/* Recipient Eligibility Breakdown Card (Requirement 7) */}
              <div className="pt-2 border-t border-slate-200/60 space-y-3 text-xs">
                {/* 3 Summary Counters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-100/90 border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Selected Audience</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold text-slate-900">
                        {isCalculatingAudience ? "..." : (serverAudienceData?.totalSelected ?? filteredAudience.length)}
                      </span>
                      <span className="text-[10px] text-slate-500">total selected</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-900">Eligible Recipients</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold text-emerald-900">
                        {isCalculatingAudience ? "..." : (serverAudienceData?.eligibleCount ?? eligibleContacts.length)}
                      </span>
                      <span className="text-[10px] text-emerald-700">consented & valid</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-rose-900">Excluded Contacts</span>
                      {(serverAudienceData?.excludedCount ?? ineligibleContacts.length) > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowIneligibleList(!showIneligibleList)}
                          className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 cursor-pointer"
                        >
                          {showIneligibleList ? "Hide" : "Details"}
                          {showIneligibleList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold text-rose-900">
                        {isCalculatingAudience ? "..." : (serverAudienceData?.excludedCount ?? ineligibleContacts.length)}
                      </span>
                      <span className="text-[10px] text-rose-700">blocked / unverified</span>
                    </div>
                  </div>
                </div>

                {/* Granular Exclusion Reasons Breakdown Badges */}
                {(serverAudienceData?.excludedCount ?? 0) > 0 && (
                  <div className="p-2 rounded-lg bg-slate-100/70 border border-slate-200 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-semibold text-slate-700 mr-1">Exclusion Reasons:</span>
                    {serverAudienceData?.exclusionBreakdown.missingPhone ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium">
                        Missing Phone: {serverAudienceData.exclusionBreakdown.missingPhone}
                      </span>
                    ) : null}
                    {serverAudienceData?.exclusionBreakdown.invalidPhone ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                        Invalid Format: {serverAudienceData.exclusionBreakdown.invalidPhone}
                      </span>
                    ) : null}
                    {serverAudienceData?.exclusionBreakdown.consentPending ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium">
                        Consent Pending: {serverAudienceData.exclusionBreakdown.consentPending}
                      </span>
                    ) : null}
                    {serverAudienceData?.exclusionBreakdown.explicitOptOut ? (
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-medium">
                        Explicit Opt-Out: {serverAudienceData.exclusionBreakdown.explicitOptOut}
                      </span>
                    ) : null}
                    {serverAudienceData?.exclusionBreakdown.activeSuppression ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-medium">
                        Active Suppression: {serverAudienceData.exclusionBreakdown.activeSuppression}
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Telecom Delivery Estimates (Labeled as Estimates based on Eligible Only) */}
                <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-[11px] text-indigo-950">
                  <span className="font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Delivery Estimate:{" "}
                    <strong>
                      {isCalculatingAudience ? "..." : (serverAudienceData?.eligibleCount ?? eligibleContacts.length)} recipients
                    </strong>{" "}
                    ·{" "}
                    <strong>
                      {isCalculatingAudience ? "..." : (serverAudienceData?.estimates.estimatedTotalSegments ?? totalAudienceSegments)} segments
                    </strong>
                  </span>
                  <span className="text-[10px] text-indigo-700 italic">
                    (Estimated for eligible recipients only)
                  </span>
                </div>
              </div>

              {/* Collapsible Granular Ineligible Contacts Details */}
              {showIneligibleList && (serverAudienceData?.excludedContacts.length ?? ineligibleContacts.length) > 0 && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-900 block">
                      Excluded Contacts &amp; Granular Safeguard Reasons:
                    </span>
                    <span className="text-[10px] text-amber-800">
                      {(serverAudienceData?.excludedContacts.length ?? ineligibleContacts.length)} total excluded
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {(serverAudienceData?.excludedContacts || (ineligibleContacts as any)).map((c: any, idx: number) => (
                      <div
                        key={c.id ? `${c.id}-${idx}` : idx}
                        className="flex items-center justify-between text-slate-700 bg-white/90 px-2.5 py-1.5 rounded-md border border-slate-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {c.name || c.email || "Direct Recipient"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {c.phone || "No phone"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            {c.reasonCode || "EXCLUDED"}
                          </span>
                          <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={c.reasonDescription}>
                            {c.reasonDescription || "Missing phone"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Compliance Safeguard: Excluded contacts are prevented from dispatch. Explicit opt-outs and active suppressions are never overridden.
                  </p>
                </div>
              )}
            </div>

            {/* 4. RCS Rich Card Properties (Visible only when protocol === 'RCS') */}
            {protocol === "RCS" && (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>RCS Rich Business Card Configuration</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-200">
                    Interactive Verified Card
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Card Title Header
                  </label>
                  <input
                    type="text"
                    value={rcsCardTitle}
                    onChange={(e) => setRcsCardTitle(e.target.value)}
                    placeholder="e.g. Exclusive Product Preview"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Media Image Banner URL & Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Card Media Banner URL
                    </label>
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-700">
                      <span>Presets:</span>
                      {PRESET_BANNERS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setRcsMediaUrl(preset.url)}
                          className="underline hover:text-indigo-900 cursor-pointer"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="url"
                    value={rcsMediaUrl}
                    onChange={(e) => setRcsMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-[11px]"
                  />
                </div>

                {/* Primary Action Button */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Action Button Label
                    </label>
                    <input
                      type="text"
                      value={rcsActionLabel}
                      onChange={(e) => setRcsActionLabel(e.target.value)}
                      placeholder="e.g. View Dashboard"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Action Target URL
                    </label>
                    <input
                      type="url"
                      value={rcsActionUrl}
                      onChange={(e) => setRcsActionUrl(e.target.value)}
                      placeholder="https://nexareach.com/promo"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Quick Reply Chip */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Suggested Quick Reply Chip
                  </label>
                  <input
                    type="text"
                    value={rcsSuggestion}
                    onChange={(e) => setRcsSuggestion(e.target.value)}
                    placeholder="e.g. Reply STOP to opt out"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* 5. Message Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {protocol === "SMS" ? "SMS Text Message Body" : "RCS Card Description Text"}
                </label>

                {/* Accurate Telecom Encoding Status Badge */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      encodingInfo.encoding === "GSM-7"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    {encodingInfo.encoding === "GSM-7" ? "GSM-7 Encoding" : "UCS-2 Unicode"}
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-slate-700 font-mono font-medium">
                    {encodingInfo.characterCount} chars
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-blue-700 font-mono font-bold">
                    {encodingInfo.segments} {encodingInfo.segments === 1 ? "segment" : "segments"}
                  </span>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your broadcast message content here..."
                className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans leading-relaxed"
              />

              {/* Dynamic Tag Insertion Pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
                  <Tag className="h-3 w-3" />
                  Insert tag:
                </span>
                {[
                  "{{firstName}}",
                  "{{lastName}}",
                  "{{company}}",
                  "{{phone}}",
                  "{{email}}",
                  "{{optOutUrl}}",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
                    title={`Insert ${tag}`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              {/* Detailed Telecom Segment Breakdown Meter */}
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span className="font-medium">
                    Segment Meter: {encodingInfo.charsUsedInCurrentSegment} /{" "}
                    {encodingInfo.maxCharsPerSegment} chars used in current segment
                  </span>
                  <span className="font-mono text-slate-700">
                    {encodingInfo.charsRemainingInCurrentSegment} chars left until next segment
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      encodingInfo.encoding === "UCS-2"
                        ? "bg-amber-500"
                        : encodingInfo.segments > 1
                        ? "bg-indigo-600"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (encodingInfo.charsUsedInCurrentSegment /
                          encodingInfo.maxCharsPerSegment) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                {/* Telecom Explanatory Notes & Unicode Trigger Notice */}
                {encodingInfo.encoding === "UCS-2" && (
                  <p className="text-[10px] text-amber-800 bg-amber-100/60 p-1.5 rounded border border-amber-200">
                    <span className="font-bold">Unicode Encoding Active:</span> Single message limit is 70 characters (67 for concatenated parts).
                    {encodingInfo.nonGsmCharacters.length > 0 && (
                      <span> Triggered by non-GSM characters: {encodingInfo.nonGsmCharacters.join(" ")}</span>
                    )}
                  </p>
                )}

                {encodingInfo.encoding === "GSM-7" && encodingInfo.hasExtendedGsm && (
                  <p className="text-[10px] text-slate-500">
                    Note: Message contains extended GSM-7 characters which count as 2 characters toward limits.
                  </p>
                )}

                {/* TCPA Opt-out Compliance Check */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {hasOptOutCompliance ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span
                      className={
                        hasOptOutCompliance ? "text-emerald-700 font-medium" : "text-amber-700"
                      }
                    >
                      {hasOptOutCompliance
                        ? "TCPA Opt-out instructions included"
                        : "Recommended: Include 'Reply STOP' or {{optOutUrl}} for TCPA compliance"}
                    </span>
                  </div>

                  <span className="text-slate-500 font-mono text-[10px]">
                    Total consumption: {totalAudienceSegments} segments
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Action Bar: Save Draft & Review Broadcast */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingDraft ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 text-blue-600" />
                  )}
                  <span>{isSavingDraft ? "Saving..." : activeDraftId ? "Save Changes" : "Save as Draft"}</span>
                </button>

                {activeDraftId && (
                  <button
                    type="button"
                    onClick={handleDeleteActiveDraft}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete draft from database"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenReview}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Review Broadcast</span>
                </button>

                <button
                  type="button"
                  disabled
                  title="Real carrier dispatch is locked during Studio Preview"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Send (Locked)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Realistic Interactive Mobile Preview (5 Col) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Top Preview Controls */}
          <div className="w-full max-w-[320px] mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-blue-600" />
              Live Phone Preview
            </span>

            {/* Toggle Personalization vs Raw Tags */}
            <button
              type="button"
              onClick={() => setSimulatePersonalization(!simulatePersonalization)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
                simulatePersonalization
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
              title="Toggle previewing with sample recipient data vs raw template tags"
            >
              {simulatePersonalization ? (
                <>
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  <span>Simulated Data</span>
                </>
              ) : (
                <>
                  <Code className="h-3 w-3 text-slate-500" />
                  <span>Raw Tags</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Recipient Indicator */}
          {simulatePersonalization && (
            <div className="w-full max-w-[320px] mb-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Previewing for:</span>
              <span className="font-semibold text-slate-800">
                {sampleContact.name} ({sampleContact.phone})
              </span>
            </div>
          )}

          {/* Device Mockup Shell */}
          <div className="w-[310px] h-[590px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
            {/* Top Speaker / Camera Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-end px-3">
              <div className="h-2 w-2 rounded-full bg-slate-800" />
            </div>

            {/* Mobile Screen Surface */}
            <div className="w-full h-full bg-[#f8fafc] rounded-[36px] overflow-hidden flex flex-col relative text-slate-900">
              {/* Status Bar */}
              <div className="h-8 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">5G</span>
                  <div className="w-4 h-2 rounded-xs border border-slate-600 flex items-center p-0.5">
                    <div className="w-full h-full bg-slate-700 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Message Thread Header */}
              <div className="px-3.5 py-2 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex items-center gap-2.5 shadow-2xs">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                  {senderId.charAt(0) || "N"}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {senderId || "NEXAREACH"}
                    </span>
                    {protocol === "RCS" && (
                      <CheckCircle2 className="h-3 w-3 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {protocol === "RCS" ? "Verified Business Messaging" : "Direct Text Message"}
                  </span>
                </div>
              </div>

              {/* Message Stream Area */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                <div className="text-center my-1">
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    Today 9:41 AM
                  </span>
                </div>

                {protocol === "SMS" ? (
                  /* Standard SMS Bubble */
                  <div className="max-w-[88%] bg-slate-200/90 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-800 leading-relaxed shadow-xs">
                    <p className="whitespace-pre-wrap break-words">
                      {renderedPreviewBody || "Type your message in the composer..."}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 mt-1">
                      <span>9:41 AM</span>
                      <span>•</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                ) : (
                  /* RCS Rich Card Bubble */
                  <div className="max-w-[92%] bg-white rounded-2xl rounded-tl-xs border border-slate-200 overflow-hidden shadow-sm space-y-0">
                    {/* RCS Header Banner */}
                    {rcsMediaUrl ? (
                      <div className="h-28 w-full overflow-hidden bg-slate-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rcsMediaUrl}
                          alt="RCS Banner"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white p-3 text-center">
                        <Sparkles className="h-6 w-6 text-white/80" />
                      </div>
                    )}

                    <div className="p-3 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {renderedPreviewTitle || "Special Announcement"}
                      </h4>
                      <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {renderedPreviewBody || "Type description in the composer..."}
                      </p>

                      <div className="pt-1.5">
                        <a
                          href={rcsActionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <span>{rcsActionLabel || "View Dashboard"}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Quick Suggested Reply Chips */}
                    {rcsSuggestion && (
                      <div className="px-3 pb-2 pt-0 flex flex-wrap gap-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {rcsSuggestion}
                        </span>
                      </div>
                    )}

                    <div className="px-3 pb-2 text-right">
                      <span className="text-[9px] text-slate-400">9:41 AM • Read</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Mockup Message Input */}
              <div className="p-2 border-t border-slate-200 bg-white flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-[11px] text-slate-400">
                  {protocol === "RCS" ? "RCS Chat message..." : "Text message..."}
                </div>
                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Send className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CAMPAIGN REVIEW MODAL (Requirement 7)                    */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Campaign Broadcast Pre-Flight Review
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify telecom encoding, target audience, and carrier compliance before saving.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Safety Disclaimer in Modal */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Live Carrier Dispatch Locked:</span>
                <p className="mt-0.5 text-amber-800">
                  Sending is disabled until external SMS/RCS carrier credentials (e.g., Twilio / Sinch / Infobip / Google RCS) are configured in Settings.
                </p>
              </div>
            </div>

            {/* Campaign Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block">Broadcast Title:</span>
                <span className="font-semibold text-slate-900">{campaignTitle}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block">Channel Protocol:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  {protocol === "SMS" ? (
                    <>
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                      <span>Standard SMS</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>RCS Rich Business Card</span>
                    </>
                  )}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block">Sender ID:</span>
                <span className="font-mono font-bold text-slate-900">{senderId}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[11px] block">Audience Target:</span>
                <span className="font-semibold text-slate-900">
                  {audienceType === "all"
                    ? "All Workspace Contacts"
                    : audienceType === "list"
                    ? `Contact List: ${contactLists.find((l) => l.id === selectedListId)?.name || "Selected"}`
                    : `Direct Test Number: ${testPhoneNumber}`}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                <span className="text-emerald-700 text-[11px] block">Eligible Recipients:</span>
                <span className="font-bold text-emerald-950 text-sm">
                  {serverAudienceData?.eligibleCount ?? eligibleContacts.length} recipients
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  ({serverAudienceData?.excludedCount ?? ineligibleContacts.length} contacts excluded by consent, opt-out, phone format, or active suppression)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 space-y-1">
                <span className="text-blue-700 text-[11px] block">Encoding &amp; Segment Estimates:</span>
                <span className="font-bold text-blue-950 text-sm">
                  {encodingInfo.encoding} • {encodingInfo.characterCount} chars
                </span>
                <span className="text-[10px] text-blue-700 block">
                  {encodingInfo.segments} segment(s)/msg • {serverAudienceData?.estimates.estimatedTotalSegments ?? totalAudienceSegments} estimated total segments (Eligible Only)
                </span>
              </div>
            </div>

            {/* TCPA / Regulatory Check */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">TCPA Opt-Out Instructions:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  hasOptOutCompliance
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {hasOptOutCompliance ? "Compliant (Opt-out included)" : "Advisory (Opt-out missing)"}
              </span>
            </div>

            {/* Sample Rendered Message View */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Sample Personalized Recipient Preview:
              </span>
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                {renderedPreviewBody}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Back to Editing
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveDraft();
                    setIsReviewModalOpen(false);
                  }}
                  disabled={isSavingDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5 text-blue-600" />
                  <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Send Broadcast (Locked)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM TEMPLATE REPLACEMENT MODAL */}
      {pendingTemplateLoad && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-dialog-title"
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 id="template-dialog-title" className="text-base font-semibold text-slate-900">
                  Load Template into Composer?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You currently have unsaved composer inputs. Applying{" "}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{pendingTemplateLoad.name}&rdquo;
                  </span>{" "}
                  will replace your current message text and channel settings with this template.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  This will start a fresh draft and will not overwrite any saved drafts in your database.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingTemplateLoad(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  applyTemplate(pendingTemplateLoad);
                  setPendingTemplateLoad(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
