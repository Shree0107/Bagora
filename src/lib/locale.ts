import "server-only";
import { cache } from "react";
import type { Lang, Market } from "@/lib/markets";
import { translator, type Translate } from "@/lib/i18n/messages";

export type Locale = { market: Market; lang: Lang; t: Translate };

/** India + English only. Kept as a function so copy stays centralised in messages.ts. */
export const getLocale = cache(async (): Promise<Locale> => ({ market: "in", lang: "en", t: translator() }));
