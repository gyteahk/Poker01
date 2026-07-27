"use client";

import { DailyDecision } from "@/components/DailyDecision";
import { InternalLinks } from "@/components/InternalLinks";

export default function DailyPage() {
  return (
    <div className="shell">
      <DailyDecision />
      <InternalLinks current="daily" />
    </div>
  );
}
