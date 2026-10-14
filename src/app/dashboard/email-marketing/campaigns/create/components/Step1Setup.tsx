"use client";

import { Mail, User, AtSign, AlignLeft, Info } from "lucide-react";
import { CAMPAIGN_TYPE_LABELS, CampaignType } from "@/lib/types/campaigns";

interface Step1SetupProps {
  formData: {
    name: string;
    type: CampaignType;
    description: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
  };
  onChange: (fields: Partial<Step1SetupProps["formData"]>) => void;
  errors: Record<string, string>;
}

export function Step1Setup({ formData, onChange, errors }: Step1SetupProps) {
  return (
    <div className="space-y-6 max-w-3xl select-none p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Step 1: Campaign Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Define core campaign identity, marketing objective, and sender credentials.
        </p>
      </div>

      <div className="space-y-5">
        {/* Campaign Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Campaign Name *</span>
            <span className="text-[10px] text-slate-400">Internal reference name</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Q4 Product Launch & Platform Upgrade"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors ${
              errors.name ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-blue-500"
            }`}
          />
          {errors.name && <p className="text-[11px] text-rose-600">{errors.name}</p>}
        </div>

        {/* Campaign Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Campaign Objective & Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.entries(CAMPAIGN_TYPE_LABELS) as [CampaignType, string][]).map(([type, label]) => {
              const isSelected = formData.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ type })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {type === "NEWSLETTER" && "Recurring editorial digest"}
                    {type === "PROMOTIONAL" && "Special offers & discount drives"}
                    {type === "PRODUCT_UPDATE" && "New feature announcements"}
                    {type === "EVENT_INVITATION" && "Webinar & conference invites"}
                    {type === "RE_ENGAGEMENT" && "Win-back inactive accounts"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Internal Description & Campaign Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Brief goals, target audience, or campaign thesis..."
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
          />
        </div>

        {/* Sender Details Header */}
        <div className="pt-3 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Sender Credentials & Reply Routing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                <span>From Name *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex from NexaReach"
                value={formData.fromName}
                onChange={(e) => onChange({ fromName: e.target.value })}
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors ${
                  errors.fromName ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-blue-500"
                }`}
              />
              {errors.fromName && <p className="text-[11px] text-rose-600">{errors.fromName}</p>}
            </div>

            {/* From Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <AtSign className="h-3 w-3 text-slate-400" />
                <span>From Email *</span>
              </label>
              <input
                type="email"
                placeholder="e.g. marketing@xspaceweb.com"
                value={formData.fromEmail}
                onChange={(e) => onChange({ fromEmail: e.target.value })}
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors ${
                  errors.fromEmail ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-blue-500"
                }`}
              />
              {errors.fromEmail && <p className="text-[11px] text-rose-600">{errors.fromEmail}</p>}
            </div>
          </div>

          {/* Reply-To Email */}
          <div className="space-y-1.5 mt-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Reply-To Email Address (Optional)</span>
              <span className="text-[10px] text-slate-400">Where recipient responses are directed</span>
            </label>
            <input
              type="email"
              placeholder="e.g. replies@xspaceweb.com (defaults to From Email if blank)"
              value={formData.replyTo}
              onChange={(e) => onChange({ replyTo: e.target.value })}
              className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors ${
                errors.replyTo ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-blue-500"
              }`}
            />
            {errors.replyTo && <p className="text-[11px] text-rose-600">{errors.replyTo}</p>}
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-800">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Deliverability Notice: Using a domain configured and verified in your Resend account ensures DMARC, DKIM, and SPF validation pass successfully for highest inbox placement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
