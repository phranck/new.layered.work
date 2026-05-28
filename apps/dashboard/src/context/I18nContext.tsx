import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { type DashboardLocale, messages } from "@/i18n/messages.ts";

interface I18nContextValue {
  locale: DashboardLocale;
  setLocale: (locale: DashboardLocale) => void;
  messages: (typeof messages)[DashboardLocale];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function loadLocale(): DashboardLocale {
  const saved = localStorage.getItem("dashboard-locale");
  return saved === "de" || saved === "en" ? saved : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [localeState, setLocaleState] = useState<DashboardLocale>(loadLocale);

  const setLocale = (locale: DashboardLocale) => {
    setLocaleState(locale);
    localStorage.setItem("dashboard-locale", locale);
  };

  const value = useMemo(
    () => ({ locale: localeState, setLocale, messages: messages[localeState] }),
    [localeState],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
