"use client";

import React from "react";
import { VoiceCampaignsTab } from "../components/VoiceCampaignsTab";

export default function VoiceCampaignsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <VoiceCampaignsTab />
    </div>
  );
}
