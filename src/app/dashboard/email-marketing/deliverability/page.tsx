"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  Users,
  Send,
  AlertTriangle,
  Radio,
  FileText,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { ExecutiveHealthBanner } from "./components/ExecutiveHealthBanner";
import { MetricCards } from "./components/MetricCards";
import { DomainManagementTab } from "./components/DomainManagementTab";
import { EmailListHealthTab } from "./components/EmailListHealthTab";
import { SendingHealthTab } from "./components/SendingHealthTab";
import { RecommendationsTab } from "./components/RecommendationsTab";
import { AddDomainModal } from "./components/AddDomainModal";

export default function DeliverabilityDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview"); // overview, domains, list-health, sending-health, recommendations
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddDomainModalOpen, setIsAddDomainModalOpen] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await fetch("/api/dashboard/email-marketing/deliverability/overview");
      const json = await res.json();

      if (res.ok && json.success) {
        setOverviewData(json.data);
        setError(null);
      } else {
        setError(json.error || "Failed to load deliverability overview.");
      }
    } catch {
      setError("Network error fetching deliverability diagnostics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSyncResend = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/dashboard/email-marketing/deliverability/domains/sync", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchOverview(true);
      } else {
        alert(json.error || "Failed to sync domains from Resend.");
      }
    } catch {
      alert("Network error syncing domains.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading && !overviewData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-bold text-slate-800">
          Running authoritative DNS and provider diagnostics...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Resolving live SPF, DKIM, and DMARC records via public nameservers
        </p>
      </div>
    );
  }

  if (error && !overviewData) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Unable to Load Deliverability Data</h2>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">{error}</p>
        <button
          onClick={() => fetchOverview()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
        >
          Retry Diagnostics
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full select-none">
      {/* Top Breadcrumb & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/email-marketing" className="hover:text-blue-600 transition-colors">
              Email Marketing
            </Link>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Deliverability</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
            <Radio className="h-6 w-6 text-blue-600" />
            Email Deliverability & Domain Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor sender reputation, authenticate DNS protocols (SPF, DKIM, DMARC), and optimize list hygiene for maximum inbox placement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddDomainModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Executive Health Banner */}
      {overviewData && (
        <ExecutiveHealthBanner
          data={overviewData}
          onRefresh={() => fetchOverview(true)}
          isRefreshing={refreshing}
        />
      )}

      {/* High-Level Metric Cards */}
      {overviewData && (
        <MetricCards
          data={overviewData}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs pb-0">
        {[
          { key: "overview", label: "Overview", icon: Radio },
          {
            key: "domains",
            label: "Domain Authentication",
            icon: Globe,
            badge: overviewData?.domains?.total || 0,
          },
          {
            key: "list-health",
            label: "List Health",
            icon: Users,
            badge: overviewData?.listHealth?.totalVerified || 0,
          },
          {
            key: "sending-health",
            label: "Sending Health",
            icon: Send,
            badge: overviewData?.sendingHealth?.totalSent || 0,
          },
          {
            key: "recommendations",
            label: "Recommendations",
            icon: FileText,
            badge: overviewData?.recommendations?.length || 0,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/50 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {overviewData && (
        <div>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Recommendations Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    High-Priority Deliverability Checks
                  </h3>
                  <button
                    onClick={() => setActiveTab("recommendations")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all recommendations</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <RecommendationsTab
                  recommendations={overviewData.recommendations.slice(0, 3)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              </div>

              {/* Quick Split: Sending Domains Summary & Recent Sending */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sending Domains Glance */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        Registered Domains ({overviewData.domains.total})
                      </h4>
                      <button
                        onClick={() => setActiveTab("domains")}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Manage Domains
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      {overviewData.domains.list.slice(0, 3).map((d: any) => (
                        <div
                          key={d.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {d.domain}
                              </span>
                              {d.isDefault && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              SPF: {d.spfStatus} • DKIM: {d.dkimStatus} • DMARC: {d.dmarcStatus}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                              d.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <button
                      onClick={() => setIsAddDomainModalOpen(true)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      + Add Another Domain
                    </button>
                  </div>
                </div>

                {/* Email Verification List Health Glance */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        List Health Breakdown
                      </h4>
                      <button
                        onClick={() => setActiveTab("list-health")}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Inspect List Health
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Valid Mailboxes</span>
                        <span className="font-bold text-emerald-700">
                          {overviewData.listHealth.validCount}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              overviewData.listHealth.totalVerified > 0
                                ? (overviewData.listHealth.validCount /
                                    overviewData.listHealth.totalVerified) *
                                  100
                                : 0
                            }%`,
                          }}
                          className="bg-emerald-500 h-full"
                        />
                        <div
                          style={{
                            width: `${
                              overviewData.listHealth.totalVerified > 0
                                ? (overviewData.listHealth.catchAllCount /
                                    overviewData.listHealth.totalVerified) *
                                  100
                                : 0
                            }%`,
                          }}
                          className="bg-amber-500 h-full"
                        />
                        <div
                          style={{
                            width: `${
                              overviewData.listHealth.totalVerified > 0
                                ? (overviewData.listHealth.invalidCount /
                                    overviewData.listHealth.totalVerified) *
                                  100
                                : 0
                            }%`,
                          }}
                          className="bg-rose-500 h-full"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-center">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Catch-All</span>
                          <span className="font-bold text-amber-700 text-sm">
                            {overviewData.listHealth.catchAllCount}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Invalid</span>
                          <span className="font-bold text-rose-700 text-sm">
                            {overviewData.listHealth.invalidCount}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Suppressed</span>
                          <span className="font-bold text-purple-700 text-sm">
                            {overviewData.listHealth.suppressionCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <Link
                      href="/dashboard/email-verification"
                      className="block text-center w-full py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
                    >
                      Run Bulk Verification via Reoon
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "domains" && (
            <DomainManagementTab
              domains={overviewData.domains.list}
              onRefresh={() => fetchOverview(true)}
              onAddDomain={() => setIsAddDomainModalOpen(true)}
              onSyncResend={handleSyncResend}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === "list-health" && (
            <EmailListHealthTab
              stats={overviewData.listHealth}
              onRefreshOverview={() => fetchOverview(true)}
            />
          )}

          {activeTab === "sending-health" && (
            <SendingHealthTab sendingStats={overviewData.sendingHealth} />
          )}

          {activeTab === "recommendations" && (
            <RecommendationsTab
              recommendations={overviewData.recommendations}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      )}

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={isAddDomainModalOpen}
        onClose={() => setIsAddDomainModalOpen(false)}
        onDomainAdded={() => {
          fetchOverview(true);
          setActiveTab("domains");
        }}
      />
    </div>
  );
}
