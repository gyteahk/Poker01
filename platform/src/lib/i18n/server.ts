import { cookies } from "next/headers";
import { Locale, LOCALE_COOKIE, translate } from "@/lib/i18n/dictionaries";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const v = jar.get(LOCALE_COOKIE)?.value;
  if (v === "zh-Hans" || v === "en" || v === "zh-Hant") return v;
  return "zh-Hant";
}

export async function serverT(key: string, vars?: Record<string, string | number>) {
  const locale = await getRequestLocale();
  return translate(locale, key, vars);
}
