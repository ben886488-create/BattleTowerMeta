import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";

const SECTION_SELECTOR = [
  ".tier-ev-section",
  ".usage-card",
  ".score-card",
  ".tier-table-card",
  ".heatmap-card",
  ".top-decks-wrap .page-header",
  ".top-decks-wrap .filters",
  ".top-decks-wrap .scope-card",
  ".top-decks-wrap .table-card",
  "main.container > .page > .header",
  "main.container > .page > .filters",
  "main.container > .page :is(.hero, .stateCard, .tableWrap, .responsive-table)",
  ".topCardsHero",
  ".topCardsPanel",
  ".player-profile :is(.hero, .summaryPanel, .deckPanel, .tableCard)",
  ".deck-profile :is(.profileFilterGroup, .hero-panel, .table-card)",
  ".homePage .homeHero",
  ".homePage .homeDirectory",
].join(",");

const CHILD_SELECTOR = [
  ".usage-row",
  ".tier-lane",
  ".tier-lane__decklink",
  ".usage-pie-legend__row",
  ".heatmap-cell",
  ".scope-line",
  ".decks-table tbody tr",
  ".tbl tbody tr",
  ".topCardTile",
  ".topCardsSummary__block",
  ".entry",
  ".mobile-card",
  ".deckCard",
  ".profileFilterField",
  ".placement-card",
  ".metric-card",
  ".matchup-tile",
  ".profileCard",
  ".decklist-group",
  ".card",
].join(",");

const SECTION_KIND_BY_ID: Record<string, string> = {
  "tier-list": "ev-01",
  "usage-breakdown": "ev-02",
  "deck-score": "ev-03",
  "matchup-matrix": "ev-04",
};

function canAnimate() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearActiveSectionClasses() {
  Array.from(document.documentElement.classList)
    .filter((className) => className.startsWith("motion-active-"))
    .forEach((className) => document.documentElement.classList.remove(className));
}

function setActiveSection(section: Element) {
  const kind = section.getAttribute("data-motion-kind");
  if (!kind) return;

  clearActiveSectionClasses();
  document.documentElement.classList.add("motion-section-active", `motion-active-${kind}`);
  const boost = kind === "ev-02" || kind === "ev-04" ? "1" : kind.startsWith("ev-") ? "0.72" : "0.42";
  document.documentElement.style.setProperty("--motion-bg-boost", boost);
  document.dispatchEvent(new CustomEvent("btm:motion-section-active", { detail: { kind } }));
}

function markSection(section: HTMLElement, index: number) {
  const isMarked = section.classList.contains("motion-section");

  const kind = SECTION_KIND_BY_ID[section.id] ?? `section-${index + 1}`;
  if (!isMarked) {
    section.classList.add("motion-section", `motion-section--${kind}`);
    section.dataset.motionKind = kind;
    section.style.setProperty("--motion-section-index", String(index));
  }

  const children = Array.from(section.querySelectorAll<HTMLElement>(CHILD_SELECTOR)).slice(0, 80);
  children.forEach((child, childIndex) => {
    child.classList.add("motion-child");
    child.style.setProperty("--motion-child-index", String(childIndex));
  });
}

function isNearViewport(section: HTMLElement) {
  if (typeof window === "undefined") return false;
  const rect = section.getBoundingClientRect();
  const preload = 160;
  return rect.top < window.innerHeight + preload && rect.bottom > -preload;
}

export function useMotionReveal(routeKey: () => string) {
  let observer: IntersectionObserver | null = null;
  let activeObserver: IntersectionObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let motionQuery: MediaQueryList | null = null;
  let refreshTimer = 0;
  let lateRefreshTimer = 0;

  function disconnect() {
    observer?.disconnect();
    activeObserver?.disconnect();
    observer = null;
    activeObserver = null;
  }

  function revealImmediately() {
    document.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach((section, index) => {
      markSection(section, index);
      section.classList.add("is-motion-visible");
    });
  }

  function refresh() {
    if (typeof window === "undefined") return;
    disconnect();

    if (!canAnimate()) {
      revealImmediately();
      clearActiveSectionClasses();
      document.documentElement.style.setProperty("--motion-bg-boost", "0");
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
    sections.forEach(markSection);

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-motion-visible");
          observer?.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: "120px 0px 120px 0px",
        threshold: 0.01,
      },
    );

    activeObserver = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]?.target;
        if (active) setActiveSection(active);
      },
      {
        root: null,
        rootMargin: "-34% 0px -50% 0px",
        threshold: [0.1, 0.24, 0.42, 0.62],
      },
    );

    sections.forEach((section) => {
      if (isNearViewport(section)) {
        section.classList.add("is-motion-visible");
      } else {
        observer?.observe(section);
      }
      activeObserver?.observe(section);
    });
  }

  function scheduleRefresh() {
    if (typeof window === "undefined") return;
    window.clearTimeout(refreshTimer);
    window.clearTimeout(lateRefreshTimer);
    refreshTimer = window.setTimeout(() => {
      void nextTick(refresh);
    }, 80);
    lateRefreshTimer = window.setTimeout(() => {
      void nextTick(refresh);
    }, 620);
  }

  function handleMotionQueryChange() {
    scheduleRefresh();
  }

  onMounted(() => {
    if (typeof window === "undefined") return;

    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", handleMotionQueryChange);
    mutationObserver = new MutationObserver(scheduleRefresh);
    mutationObserver.observe(document.getElementById("app") ?? document.body, {
      childList: true,
      subtree: true,
    });
    scheduleRefresh();
  });

  watch(routeKey, () => {
    scheduleRefresh();
  });

  onBeforeUnmount(() => {
    if (typeof window === "undefined") return;
    window.clearTimeout(refreshTimer);
    window.clearTimeout(lateRefreshTimer);
    motionQuery?.removeEventListener("change", handleMotionQueryChange);
    mutationObserver?.disconnect();
    disconnect();
    clearActiveSectionClasses();
    document.documentElement.classList.remove("motion-section-active");
  });
}
