import type { Router } from "vue-router";

type GtagCommand = "config" | "event" | "js";

type GtagFunction = (
  command: GtagCommand,
  target: string | Date,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

const defaultMeasurementId = "G-ZT4GKMH93F";
const measurementId = String(
  import.meta.env.VITE_GA_MEASUREMENT_ID || defaultMeasurementId,
).trim();

let initialized = false;
let trackedInitialPage = false;

function hasMeasurementId() {
  return /^G-[A-Z0-9]+$/i.test(measurementId);
}

function ensureGtag(measurement: string) {
  if (typeof document === "undefined") return;

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    } as GtagFunction;
  }

  const hasScript = Array.from(document.scripts).some(
    (script) =>
      script.dataset.ga4Id === measurement ||
      (script.src.includes("googletagmanager.com/gtag/js") &&
        script.src.includes(`id=${measurement}`)),
  );

  if (hasScript) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurement)}`;
  script.dataset.ga4Id = measurement;
  document.head.appendChild(script);
}

function configureAnalytics(measurement: string) {
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurement, {
    send_page_view: false,
    debug_mode: import.meta.env.DEV,
  });
}

function trackPageView(pagePath: string) {
  if (!hasMeasurementId() || typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath || "/",
    language: document.documentElement.lang || navigator.language,
  });
}

export function initGoogleAnalytics(router: Router) {
  if (initialized || typeof window === "undefined" || !hasMeasurementId()) {
    return;
  }

  ensureGtag(measurementId);
  configureAnalytics(measurementId);
  initialized = true;

  void router.isReady().then(() => {
    if (!trackedInitialPage) {
      trackPageView(router.currentRoute.value.fullPath);
      trackedInitialPage = true;
    }

    router.afterEach((to) => {
      window.setTimeout(() => {
        trackPageView(to.fullPath);
      }, 0);
    });
  });
}

export const hasGaMeasurementId = hasMeasurementId();
