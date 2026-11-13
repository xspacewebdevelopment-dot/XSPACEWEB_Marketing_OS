"use client";

import React from "react";
import { SmsCampaignsTab } from "../components/SmsCampaignsTab";

export default function SmsCampaignsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <SmsCampaignsTab />
    </div>
  );
}
