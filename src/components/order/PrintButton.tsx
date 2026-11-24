"use client";

import { button } from "@/components/ui/styles";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${button.secondary} ${button.small}`}>
      Print or save as PDF
    </button>
  );
}
