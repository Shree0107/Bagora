"use client";

import { createContext, useContext, type ReactNode } from "react";
import { formatMoney } from "@/lib/markets";
import { translator, type Translate } from "@/lib/i18n/messages";

type LocaleValue = {
  t: Translate;
  /** Format an amount in paise as ₹. */
  money: (minor: number) => string;
};

const value: LocaleValue = { t: translator(), money: (minor) => formatMoney(minor, "inr") };
const LocaleContext = createContext<LocaleValue>(value);

export function LocaleProvider({ children }: { children: ReactNode }) {
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext);
}
