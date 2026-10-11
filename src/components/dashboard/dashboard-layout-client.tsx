"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
}

export function DashboardLayoutClient({
  children,
  user,
  workspace,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-900">
      {/* Sidebar (Fixed on desktop, drawer on mobile) */}
      <Sidebar
        user={user}
        workspace={workspace}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        <Header
          user={user}
          workspace={workspace}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
