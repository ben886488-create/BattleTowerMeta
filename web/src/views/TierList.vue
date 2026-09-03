<template>
  <section class="tierlist-page">
    <nav
      class="tier-ev-rail"
      :style="{ '--ev-progress': evRailProgress }"
      :aria-label="ui.evRailLabel"
    >
      <button
        v-for="item in evRailItems"
        :key="item.id"
        type="button"
        class="tier-ev-rail__item"
        :class="{
          'tier-ev-rail__item--active': activeEvSectionId === item.id,
          'tier-ev-rail__item--pressed': pressedEvSectionId === item.id,
        }"
        :aria-current="activeEvSectionId === item.id ? 'location' : undefined"
        @click="scrollToEvSection(item.id)"
      >
        <span class="tier-ev-rail__dot" aria-hidden="true"></span>
        <span class="tier-ev-rail__label mono">{{ item.label }}</span>
      </button>
    </nav>

    <div class="tierlist-layout">
      <main class="tierlist-main">
        <header class="tierlist-header">
          <div class="tierlist-header__copy">
            <div class="page-hero-kicker mono">{{ ui.heroEyebrow }}</div>
            <h1
              class="page-title page-hero-title tierlist-hero-title"
              :class="{ 'page-hero-title--cn': locale === 'zh' }"
            >
              <span>{{ ui.heroTitle }}</span>
              <em class="page-hero-title-accent">{{ ui.heroTitleAccent }}</em>
            </h1>
            <p class="page-hero-description tierlist-hero-description">
              {{ ui.heroLead }}
            </p>
            <p class="page-subtitle mono">
              {{
                loadingTournaments
                  ? ui.loadingTournaments
                  : meta?.generated_at
                    ? `${ui.generatedAt} ${meta.generated_at}`
                    : "—"
              }}
            </p>
            <p v-if="tournamentsError" class="page-error mono">
              {{ tournamentsError }}
            </p>
          </div>

          <button
            type="button"
            class="filter-drawer-trigger"
            :aria-label="ui.openFilters"
            @click="filterDrawerOpen = true"
          >
            <span class="filter-drawer-trigger__eyebrow mono">{{ ui.filters }}</span>
            <strong>{{ selectedSetLabel }}</strong>
            <small class="mono">{{ selectedTimeLabel }} / {{ selectedTopCutLabel }}</small>
          </button>
        </header>

        <section class="creator-materials-panel creator-materials-panel--mobile" :aria-label="ui.creatorMaterials">
          <span class="creator-materials-panel__eyebrow mono">// {{ ui.creatorMaterials }}</span>
          <h2>{{ ui.creatorMaterials }}</h2>
          <div class="creator-materials-panel__actions">
            <button
              class="creator-materials-button creator-materials-button--primary mono"
              type="button"
              :disabled="creatorPackActive"
              @click="startCreatorPack('decklists')"
            >
              {{ creatorPackLabel('decklists') }}
            </button>
            <button
              class="creator-materials-button mono"
              type="button"
              :disabled="creatorPackActive"
              @click="startCreatorPack('all')"
            >
              {{ creatorPackLabel('all') }}
            </button>
          </div>
        </section>

        <Transition name="btm-filter" mode="out-in">
        <div :key="contentTransitionKey" class="tierlist-content-motion">
        <div class="tierlist-top-grid">
      <div id="usage-breakdown" class="usage-card tier-ev-section">
        <div class="usage-title-row">
          <div>
            <h2 class="section-title">{{ ui.usageBreakdown }}</h2>
            <p class="usage-subtitle">{{ ui.usageSubtitle }}</p>
          </div>
          <span class="mono subtle">{{ usageTopDeckRows.length }} + {{ ui.other }}</span>
        </div>

        <div v-if="usagePieSegments.length > 0" class="usage-pie-layout">
          <div class="usage-pie-visual">
            <div class="usage-pie" @mouseleave="hoveredUsageSegmentKey = null">
              <svg class="usage-donut" viewBox="0 0 100 100" aria-hidden="true">
                <circle class="usage-donut__track" cx="50" cy="50" r="38" pathLength="100" />
                <g
                  v-for="segment in usagePieSvgSegments"
                  :key="`slice-${segment.key}`"
                  class="usage-donut__segment"
                  :class="{ 'usage-donut__segment--active': hoveredUsageSegmentKey === segment.key }"
                >
                  <circle
                    class="usage-donut__slice-outline"
                    cx="50"
                    cy="50"
                    r="38"
                    pathLength="100"
                    :style="{
                      strokeDasharray: `${segment.share} ${100 - segment.share}`,
                      strokeDashoffset: `${-segment.offset}`,
                    }"
                  />
                  <circle
                    class="usage-donut__slice"
                    cx="50"
                    cy="50"
                    r="38"
                    pathLength="100"
                    :style="{
                      stroke: segment.color,
                      strokeDasharray: `${segment.share} ${100 - segment.share}`,
                      strokeDashoffset: `${-segment.offset}`,
                    }"
                    @mouseenter="hoveredUsageSegmentKey = segment.key"
                    @focus="hoveredUsageSegmentKey = segment.key"
                  />
                </g>
              </svg>
              <div class="usage-pie__center" :title="usagePieActiveSegment?.label ?? ui.noUsageData">
                <strong class="mono">{{ formatUsagePct(usagePieActiveSegment?.usage ?? 0) }}</strong>
                <span>{{ usagePieActiveSegment?.label ?? ui.noUsageData }}</span>
                <div
                  v-if="usagePieActiveSegmentSprites.length > 0"
                  class="usage-pie__center-icons"
                  aria-hidden="true"
                >
                  <img
                    v-for="(src, idx) in usagePieActiveSegmentSprites"
                    :key="`center-${usagePieActiveSegment?.key}-${src}-${idx}`"
                    class="usage-pie__center-icon"
                    :src="src"
                    :alt="usagePieActiveSegment?.label ?? ''"
                    draggable="false"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="usage-overview-panel">
            <div class="usage-summary">
              <div v-for="item in usageSummaryRows" :key="item.label" class="usage-summary__row">
                <span class="usage-summary__label">{{ item.label }}</span>
                <strong class="usage-summary__value mono">{{ item.value }}</strong>
              </div>
            </div>

            <div class="usage-pie-legend">
              <div
                v-for="segment in usagePieSegments"
                :key="segment.key"
                class="usage-pie-legend__row"
                :class="{
                  'usage-pie-legend__row--active': hoveredUsageSegmentKey === segment.key,
                  'usage-pie-legend__row--other': segment.isOther,
                }"
                @mouseenter="hoveredUsageSegmentKey = segment.key"
                @mouseleave="hoveredUsageSegmentKey = null"
                @focusin="hoveredUsageSegmentKey = segment.key"
                @focusout="hoveredUsageSegmentKey = null"
                :title="segment.label"
              >
                <span class="usage-pie-legend__swatch" :style="{ background: segment.color }"></span>
                <RouterLink
                  v-if="!segment.isOther"
                  class="usage-pie-legend__icons"
                  :to="deckProfileTo(segment.key)"
                  :title="segment.label"
                  :aria-label="segment.label"
                >
                  <img
                    v-for="(src, idx) in segment.spriteUrls.slice(0, 2)"
                    :key="`legend-icon-${segment.key}-${src}-${idx}`"
                    class="usage-pie-legend__sprite"
                    :src="src"
                    :alt="segment.label"
                    draggable="false"
                  />
                  <span v-if="segment.spriteUrls.length === 0" class="usage-pie-legend__fallback mono">
                    {{ deckShortLabel(segment.key) || "?" }}
                  </span>
                </RouterLink>
                <span v-else class="usage-pie-legend__icons usage-pie-legend__icons--static" aria-hidden="true">
                  <img
                    v-for="(src, idx) in segment.spriteUrls.slice(0, 2)"
                    :key="`legend-icon-${segment.key}-${src}-${idx}`"
                    class="usage-pie-legend__sprite"
                    :src="src"
                    :alt="segment.label"
                    draggable="false"
                  />
                  <span v-if="segment.spriteUrls.length === 0" class="usage-pie-legend__fallback mono">?</span>
                </span>
                <RouterLink
                  v-if="!segment.isOther"
                  class="usage-pie-legend__name"
                  :to="deckProfileTo(segment.key)"
                  :title="segment.label"
                >
                  {{ segment.label }}
                </RouterLink>
                <span v-else class="usage-pie-legend__name usage-pie-legend__name--static">
                  {{ segment.label }}
                </span>
                <span class="usage-pie-legend__value mono">{{ formatUsagePct(segment.usage) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tier-empty mono">
          {{ loadingTournaments ? ui.loading : ui.noUsageData }}
        </div>
      </div>

      <div id="tier-list" ref="tierPanelCaptureRef" class="tier-table-card tier-ev-section">
        <div class="tier-table-head">
          <h2 class="section-title tier-table-title">{{ ui.tierList }}</h2>
          <div class="tier-table-actions">
            <span class="mono tier-table-meta">{{ tierPanelDeckCount }}/{{ tierRows.length }}</span>
            <button
              type="button"
              class="tier-download-btn"
              data-export-ignore="true"
              :disabled="downloadingTierPanel || tierPanelDeckCount === 0"
              @click="downloadTierPanelPng"
            >
              {{ downloadingTierPanel ? tierPanelDownloadingLabel : tierPanelDownloadLabel }}
            </button>
          </div>
        </div>

        <div v-if="visibleTierGroups.length > 0" class="tier-lanes">
          <div
            v-for="group in visibleTierGroups"
            :key="group.tier"
            class="tier-lane tier-section"
            :class="`tier-section--${normalizeTierKey(group.tier)}`"
          >
            <div class="tier-section__header">
              <div class="tier-section__title mono">
                <span>{{ group.tier }}</span>
                <em>TIER</em>
                <small class="tier-section__descriptor mono">
                  {{ tierSectionDescriptor(group.tier) }}
                </small>
              </div>
            </div>

            <div class="tier-lane__deckbar">
              <RouterLink
                v-for="d in group.rows"
                :key="d.deck"
                :to="deckProfileTo(d.deck)"
                class="tier-lane__decklink"
                :title="usageDeckDisplayName(d)"
              >
                <div
                  class="tier-lane__spritepair"
                  :class="{ 'tier-lane__spritepair--single': (d.spriteUrls?.length ?? 0) < 2 }"
                >
                  <img
                    v-for="(src, idx) in d.spriteUrls ?? []"
                    :key="`${d.deck}-${idx}`"
                    :src="src"
                    class="tier-lane__sprite"
                    :alt="d.deck"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />

                  <span v-if="!d.spriteUrls?.length" class="tier-lane__fallback mono">
                    {{ deckShortLabel(d.deck) }}
                  </span>
                </div>
                <span class="tier-lane__deckname">
                  {{ usageDeckDisplayName(d) }}
                </span>
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-else class="tier-empty mono">
          {{ loadingTournaments ? ui.loadingEllipsis : ui.noTierData }}
        </div>
      </div>

      <div id="deck-score" class="score-card tier-ev-section">
        <div class="usage-title-row">
          <div>
            <h2 class="section-title">{{ ui.deckScore }}</h2>
            <p class="usage-subtitle">{{ ui.scoreSubtitle }}</p>
          </div>
          <span class="mono subtle">{{ scoreBreakdownRows.length }} {{ ui.decks }}</span>
        </div>

        <div v-if="scoreBreakdownRows.length > 0" class="usage-list score-list">
          <div
            v-for="(row, index) in scoreBreakdownRows"
            :key="row.deck"
            class="usage-row score-row"
            :class="{
              'score-row--podium': index < 3,
              'score-row--leader': index === 0,
            }"
          >
            <div class="score-row__identityCluster">
              <div class="usage-row__rank score-row__rank mono">{{ `${index + 1}.` }}</div>

              <RouterLink
                :to="deckProfileTo(row.deck)"
                class="usage-row__identity score-row__identity"
                :title="usageDeckDisplayName(row)"
              >
                <div
                  class="usage-row__spritepair"
                  :class="{ 'usage-row__spritepair--single': (row.spriteUrls?.length ?? 0) < 2 }"
                >
                  <img
                    v-for="(src, idx) in row.spriteUrls ?? []"
                    :key="`${row.deck}-score-${idx}`"
                    :src="src"
                    class="usage-row__sprite"
                    :alt="usageDeckDisplayName(row)"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />

                  <span v-if="!row.spriteUrls?.length" class="usage-row__fallback mono">
                    {{ deckShortLabel(row.deck) }}
                  </span>
                </div>

                <div class="usage-row__copy">
                  <div class="usage-row__name">{{ usageDeckDisplayName(row) }}</div>
                  <div class="usage-row__meta mono">
                    <span
                      class="usage-row__tier"
                      :style="{ backgroundImage: tierBadgeGradient(row.tier) }"
                    >
                      {{ row.tier }}
                    </span>
                    <span class="usage-row__samples">
                      {{ row.total_samples.toLocaleString() }} {{ ui.samples }}
                    </span>
                  </div>
                </div>
              </RouterLink>
            </div>

            <div class="score-row__chart">
              <div class="score-row__barLane">
                <ProgressBarAnimated
                  class="score-row__barGraphic"
                  :width="scoreBarWidth(row.score)"
                  :background="scoreBarFill(row)"
                  height="clamp(28px, 2.2vw, 46px)"
                  :delay="160 + index * 55"
                />
                <MotionNumber
                  class="usage-row__pct score-row__score mono"
                  :title="scoreTooltip(row.score)"
                  :value="relativeScore(row.score)"
                  :digits="1"
                  :delay="220 + index * 56"
                  :duration="980"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tier-empty mono">
          {{ loadingTournaments ? ui.loadingEllipsis : ui.noTierData }}
        </div>
      </div>
    </div>

    <div
      id="matchup-matrix"
      ref="heatmapCardRef"
      class="heatmap-card tier-ev-section"
    >
      <div class="heatmap-title-row">
        <div>
          <h2 class="section-title">{{ ui.winRateMatrix }}</h2>
          <p class="usage-subtitle">{{ ui.winRateSubtitle }}</p>
        </div>
        <span class="mono subtle">
          <template v-if="heatLoading">{{ ui.loadingMatchups }}</template>
          <template v-else>{{ ui.top10Matchups }}</template>
        </span>
      </div>

      <div v-if="matrixOptionRows.length > 0" class="matrix-picker-panel">
        <div class="matrix-picker-panel__label">
          {{ ui.customSlot }}
        </div>

        <div class="matrix-combobox">
          <div class="matrix-combobox__selected">
            <div v-if="matrixSelectedDeckRow" class="matrix-combobox__selected-icons heatmap-sprite-stack">
              <img
                v-for="(src, idx) in matrixSelectedDeckRow.spriteUrls ?? []"
                :key="`${matrixSelectedDeckRow.deck}-picker-selected-${idx}`"
                class="heatmap-sprite heatmap-sprite--picker"
                :src="src"
                :alt="usageDeckDisplayName(matrixSelectedDeckRow)"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </div>
            <div v-else class="matrix-picker__placeholder-icon mono" aria-hidden="true">
              +
            </div>

            <div class="matrix-combobox__selected-copy">
              <strong v-if="matrixSelectedDeckRow">
                {{ usageDeckDisplayName(matrixSelectedDeckRow) }}
              </strong>
              <span v-else>{{ ui.selectCustomSlot }}</span>
              <small v-if="matrixSelectedDeckRow" class="mono">
                <span
                  class="matrix-combobox__tier"
                  :style="{ backgroundImage: tierBadgeGradient(matrixSelectedDeckRow.tier) }"
                >
                  {{ matrixSelectedDeckRow.tier }}
                </span>
                {{ matrixSelectedDeckRow.total_samples.toLocaleString() }} {{ ui.samples }}
              </small>
            </div>

            <button
              v-if="matrixSelectedDeckRow"
              type="button"
              class="matrix-combobox__clear mono"
              :aria-label="ui.clearCustomSlot"
              @click="clearMatrixDeck"
            >
              ×
            </button>
          </div>

          <div class="matrix-combobox__search">
            <input
              v-model="matrixSearchQuery"
              class="matrix-combobox__input"
              type="search"
              role="combobox"
              :aria-label="ui.matrixSearchLabel"
              :aria-expanded="matrixSearchOpen"
              :aria-controls="matrixSearchOpen ? 'matrix-deck-search-results' : undefined"
              :aria-activedescendant="matrixSearchActiveDescendant"
              :placeholder="ui.matrixSearchPlaceholder"
              autocomplete="off"
              spellcheck="false"
              @focus="openMatrixSearch"
              @input="openMatrixSearch"
              @keydown.down.prevent="moveMatrixSearchActive(1)"
              @keydown.up.prevent="moveMatrixSearchActive(-1)"
              @keydown.enter.prevent="selectActiveMatrixSearchResult"
              @keydown.esc.prevent="closeMatrixSearch"
              @blur="scheduleMatrixSearchClose"
            />

            <div
              v-if="matrixSearchOpen"
              id="matrix-deck-search-results"
              class="matrix-combobox__menu"
              role="listbox"
              :aria-label="ui.matrixSearchResults"
              @mousedown.prevent
            >
              <button
                v-for="(option, index) in matrixSearchResults"
                :id="matrixSearchOptionId(index)"
                :key="option.deck"
                type="button"
                class="matrix-combobox__option"
                :class="{ 'matrix-combobox__option--active': index === matrixSearchActiveIndex }"
                role="option"
                :aria-selected="matrixExtraDeck === option.deck"
                @mouseenter="matrixSearchActiveIndex = index"
                @click="selectMatrixDeck(option.deck)"
              >
                <span class="heatmap-sprite-stack">
                  <img
                    v-for="(src, idx) in option.spriteUrls ?? []"
                    :key="`${option.deck}-picker-option-${idx}`"
                    class="heatmap-sprite heatmap-sprite--picker"
                    :src="src"
                    :alt="usageDeckDisplayName(option)"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                </span>

                <span class="matrix-combobox__option-copy">
                  <strong>{{ usageDeckDisplayName(option) }}</strong>
                  <small class="mono">
                    <span
                      class="matrix-combobox__tier"
                      :style="{ backgroundImage: tierBadgeGradient(option.tier) }"
                    >
                      {{ option.tier }}
                    </span>
                    {{ formatUsagePct(option.usage) }} · {{ option.total_samples.toLocaleString() }} {{ ui.samples }}
                  </small>
                </span>
              </button>

              <div v-if="matrixSearchResults.length === 0" class="matrix-combobox__empty mono">
                {{ ui.matrixSearchEmpty }}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div
        v-if="topDeckRows.length > 0"
        ref="heatmapWorkspaceRef"
        class="heatmap-workspace"
        @mouseleave="clearHoveredHeatCell"
      >
      <div class="heatmap-shell" @scroll="scheduleMatchupTooltipPosition">
        <table class="heatmap-table" :aria-label="ui.winRateMatrix">
          <thead>
            <tr>
              <th class="heatmap-corner">
                <span class="heatmap-corner__label mono">{{ ui.matrixRowsLabel }}</span>
                <span class="heatmap-corner__label heatmap-corner__label--muted mono">{{ ui.matrixColumnsLabel }}</span>
              </th>

              <th
                v-for="(c, index) in matrixAxisRows"
                :key="c?.deck ?? `matrix-column-${index}`"
                class="heatmap-col-label"
                :class="{ 'heatmap-col-label--active': isHeatmapColumnActive(index) }"
              >
                <RouterLink
                  v-if="c"
                  :to="deckProfileTo(c.deck)"
                  class="heatmap-label-link"
                  :title="usageDeckDisplayName(c)"
                  :aria-label="usageDeckDisplayName(c)"
                >
                  <div
                    class="heatmap-axis-chip"
                    :class="{
                      'heatmap-axis-chip--picker': isMatrixSelectedDeck(c),
                      'heatmap-axis-chip--active': isHeatmapColumnActive(index),
                    }"
                    :data-deck-name="usageDeckDisplayName(c)"
                  >
                    <div class="heatmap-sprite-stack">
                      <img
                        v-for="(src, idx) in c.spriteUrls ?? []"
                        :key="`${c.deck}-hdr-${idx}`"
                        class="heatmap-sprite"
                        :src="src"
                        :alt="usageDeckDisplayName(c)"
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                    <span class="heatmap-axis-name">{{ matrixDeckShortName(c) }}</span>
                  </div>
                </RouterLink>

                <div v-else class="heatmap-picker-cell heatmap-picker-cell--empty">
                  <span class="heatmap-picker-label mono">
                    {{ ui.customSlot }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(r, i) in matrixAxisRows"
              :key="r?.deck ?? `matrix-row-${i}`"
              :class="{ 'heatmap-row--active': isHeatmapRowActive(i) }"
            >
              <th class="heatmap-row-label" :class="{ 'heatmap-row-label--active': isHeatmapRowActive(i) }">
                <RouterLink
                  v-if="r"
                  :to="deckProfileTo(r.deck)"
                  class="heatmap-label-link"
                  :title="usageDeckDisplayName(r)"
                  :aria-label="usageDeckDisplayName(r)"
                >
                  <div
                    class="heatmap-axis-chip heatmap-axis-chip--row"
                    :class="{
                      'heatmap-axis-chip--picker': isMatrixSelectedDeck(r),
                      'heatmap-axis-chip--active': isHeatmapRowActive(i),
                    }"
                    :data-deck-name="usageDeckDisplayName(r)"
                  >
                    <div class="heatmap-row-sprite-stack">
                    <img
                      v-for="(src, idx) in r.spriteUrls ?? []"
                      :key="`${r.deck}-row-${idx}`"
                      class="heatmap-sprite"
                      :src="src"
                      :alt="usageDeckDisplayName(r)"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                    </div>
                    <span class="heatmap-axis-name heatmap-axis-name--row">{{ matrixDeckShortName(r) }}</span>
                  </div>
                </RouterLink>

                <div v-else class="heatmap-axis-chip heatmap-axis-chip--row heatmap-axis-chip--picker">
                  <span class="heatmap-picker-row-label mono">
                    {{ ui.customDeck }}
                  </span>
                </div>
              </th>

              <td
                v-for="(c, j) in matrixAxisRows"
                :key="`${r?.deck ?? 'matrix-row'}__${c?.deck ?? 'matrix-col'}__${j}`"
                class="heatmap-cell"
                :class="{
                  'heatmap-cell--hovered': isHeatmapCellActive(i, j),
                  'heatmap-cell--row-highlight': isHeatmapRowActive(i),
                  'heatmap-cell--column-highlight': isHeatmapColumnActive(j),
                }"
              >
                <div
                  v-if="heatCells[i]?.[j]?.winrate != null"
                  class="heatmap-cell__inner"
                  :class="[
                    heatCells[i][j].confidenceClass,
                    {
                      'heatmap-cell__inner--active': isHeatmapCellActive(i, j),
                      'heatmap-cell__inner--related': isHeatmapCellRelated(i, j),
                      'heatmap-cell__inner--row-highlight': isHeatmapRowActive(i),
                      'heatmap-cell__inner--column-highlight': isHeatmapColumnActive(j),
                    },
                  ]"
                  :style="heatCells[i][j].style"
                  :aria-label="heatCells[i][j].tooltip"
                  tabindex="0"
                  @mouseenter="setHoveredHeatCell(r, c, heatCells[i][j], i, j, $event)"
                  @mouseleave="clearHoveredHeatCell"
                  @focus="setHoveredHeatCell(r, c, heatCells[i][j], i, j, $event)"
                  @blur="clearHoveredHeatCell"
                >
                  <span class="heatmap-cell__copy">
                    <span class="heatmap-cell__rate mono">{{ heatCells[i][j].text }}</span>
                    <span class="heatmap-cell__record mono">{{ heatCells[i][j].recordText }}</span>
                  </span>
                </div>

                <div
                  v-else-if="heatCells[i]?.[j]?.isMirror"
                  class="heatmap-cell__inner heatmap-cell__inner--mirror"
                >
                  <span class="mono">—</span>
                </div>

                <div v-else class="heatmap-cell__inner heatmap-cell__inner--empty">—</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      <Teleport to="body">
        <div
          v-if="matchupDetail"
          ref="matchupTooltipRef"
          class="matchup-tooltip"
          :style="matchupTooltipStyle"
          role="tooltip"
          aria-live="polite"
        >
          <div class="heatmap-detail-panel__header">
            <span class="heatmap-detail-panel__eyebrow mono">{{ ui.matchupDetailTitle }}</span>
            <strong class="mono">{{ matchupDetail.cell.text }}</strong>
          </div>

          <div class="heatmap-detail-panel__versus">
            <div class="heatmap-detail-deck" :title="usageDeckDisplayName(matchupDetail.row)">
              <span class="heatmap-detail-deck__label mono">{{ ui.tooltipYourDeck }}</span>
              <span class="heatmap-detail-deck__icons" aria-hidden="true">
                <img
                  v-for="(src, idx) in matchupDetail.row.spriteUrls ?? []"
                  :key="`${matchupDetail.row.deck}-tooltip-row-${idx}`"
                  class="heatmap-detail-deck__sprite"
                  :src="src"
                  :alt="usageDeckDisplayName(matchupDetail.row)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </span>
              <strong>{{ usageDeckDisplayName(matchupDetail.row) }}</strong>
            </div>

            <span class="heatmap-detail-panel__vs mono">{{ ui.versus }}</span>

            <div class="heatmap-detail-deck" :title="usageDeckDisplayName(matchupDetail.col)">
              <span class="heatmap-detail-deck__label mono">{{ ui.tooltipOpponentDeck }}</span>
              <span class="heatmap-detail-deck__icons" aria-hidden="true">
                <img
                  v-for="(src, idx) in matchupDetail.col.spriteUrls ?? []"
                  :key="`${matchupDetail.col.deck}-tooltip-col-${idx}`"
                  class="heatmap-detail-deck__sprite"
                  :src="src"
                  :alt="usageDeckDisplayName(matchupDetail.col)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </span>
              <strong>{{ usageDeckDisplayName(matchupDetail.col) }}</strong>
            </div>
          </div>

          <div class="heatmap-detail-metrics">
            <div class="heatmap-detail-metric heatmap-detail-metric--primary">
              <span class="mono">{{ ui.tooltipWinRate }}</span>
              <strong class="mono">{{ matchupDetail.cell.text }}</strong>
            </div>
            <div class="heatmap-detail-metric">
              <span class="mono">{{ ui.tooltipRecord }}</span>
              <strong class="mono">{{ matchupDetail.cell.recordText }}</strong>
            </div>
            <div class="heatmap-detail-metric">
              <span class="mono">{{ ui.detailTotalGames }}</span>
              <strong class="mono">{{ matchupDetail.cell.total }}</strong>
            </div>
            <div class="heatmap-detail-metric">
              <span class="mono">{{ ui.detailConfidence }}</span>
              <strong class="mono">{{ matchupDetail.cell.confidence }}</strong>
            </div>
          </div>

          <div class="heatmap-detail-legend">
            <span class="heatmap-detail-legend__title mono">{{ ui.detailColorLegend }}</span>
            <span><i class="heatmap-detail-legend__swatch heatmap-detail-legend__swatch--bad"></i>{{ ui.detailDisadvantaged }}</span>
            <span><i class="heatmap-detail-legend__swatch heatmap-detail-legend__swatch--even"></i>{{ ui.detailEven }}</span>
            <span><i class="heatmap-detail-legend__swatch heatmap-detail-legend__swatch--good"></i>{{ ui.detailFavored }}</span>
          </div>

          <p class="heatmap-detail-panel__note mono">{{ ui.detailConfidenceNote }}</p>
        </div>
      </Teleport>

      <div v-if="topDeckRows.length > 0" class="heatmap-mobile">
        <label class="heatmap-mobile-picker">
          <span class="heatmap-mobile-picker__label mono">{{ ui.mobileMatrixDeck }}</span>
          <select v-model="mobileMatrixDeckKey" class="heatmap-mobile-picker__select">
            <option v-for="deck in mobileHeatDeckOptions" :key="deck.deck" :value="deck.deck">
              {{ usageDeckDisplayName(deck) }}
            </option>
          </select>
        </label>

        <section v-if="mobileSelectedHeatEntry?.row" class="heatmap-mobile__section">
          <div class="heatmap-mobile__header">
            <RouterLink
              :to="deckProfileTo(mobileSelectedHeatEntry.row.deck)"
              class="heatmap-mobile__deck"
              :title="usageDeckDisplayName(mobileSelectedHeatEntry.row)"
            >
              <div class="heatmap-row-sprite-stack">
                <img
                  v-for="(src, idx) in mobileSelectedHeatEntry.row.spriteUrls ?? []"
                  :key="`${mobileSelectedHeatEntry.row.deck}-mobile-row-${idx}`"
                  class="heatmap-sprite heatmap-sprite--mobile"
                  :src="src"
                  :alt="usageDeckDisplayName(mobileSelectedHeatEntry.row)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>
              <div class="heatmap-mobile__deck-name">
                {{ usageDeckDisplayName(mobileSelectedHeatEntry.row) }}
              </div>
            </RouterLink>
          </div>

          <div class="heatmap-mobile__grid">
            <div
              v-for="matchup in mobileSelectedHeatEntry.matchups"
              :key="`${mobileSelectedHeatEntry.row.deck}-${matchup.col.deck}-${matchup.index}`"
              class="heatmap-mobile__cell"
            >
              <div
                v-if="matchup.cell.winrate != null"
                class="heatmap-mobile__cellInner"
                :class="matchup.cell.confidenceClass"
                :style="matchup.cell.style"
                :data-tooltip="matchup.cell.tooltip"
                :aria-label="matchup.cell.tooltip"
                tabindex="0"
              >
                <div class="heatmap-mobile__versus mono">{{ ui.versus }}</div>
                <RouterLink
                  :to="deckProfileTo(matchup.col.deck)"
                  class="heatmap-mobile__opponent"
                  :title="usageDeckDisplayName(matchup.col)"
                >
                  <img
                    v-for="(src, idx) in matchup.col.spriteUrls ?? []"
                    :key="`${matchup.col.deck}-mobile-col-${idx}`"
                    class="heatmap-sprite heatmap-sprite--mobile"
                    :src="src"
                    :alt="usageDeckDisplayName(matchup.col)"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                  <span class="heatmap-mobile__opponent-name">{{ matrixDeckShortName(matchup.col) }}</span>
                </RouterLink>
                <div class="heatmap-mobile__rate mono">{{ matchup.cell.text }}</div>
                <div class="heatmap-mobile__record mono">{{ matchup.cell.recordText }}</div>
              </div>
            </div>
          </div>
        </section>

        <div v-else class="heatmap-mobile__empty mono">
          {{ ui.chooseCustomDeck }}
        </div>
      </div>

      <div v-else class="tier-empty mono">
        {{ heatLoading ? ui.loadingEllipsis : ui.noMatchupData }}
      </div>
    </div>
        </div>
        </Transition>
      </main>

      <aside class="filter-sidebar" :aria-label="ui.filters">
        <div class="filter-sidebar__sticky">
        <div class="filter-panel filter-panel--sticky">
          <div class="filter-panel__header">
            <span class="filter-panel__eyebrow mono">{{ ui.filterSignal }}</span>
            <h2>{{ ui.filters }}</h2>
          </div>

          <p class="filter-scope-line mono" aria-label="Current filter scope">
            {{ compactFilterScope }}
          </p>

          <div class="filters">
            <div class="f">
              <label>{{ ui.players }}</label>
              <input
                v-model.number="filters.minPlayers"
                type="number"
                inputmode="numeric"
                min="0"
                :placeholder="ui.playersPlaceholder"
              />
            </div>

            <div class="f">
              <label>{{ ui.time }}</label>
              <select v-model="filters.time">
                <option v-for="option in timeOptionGroups.base" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
                <optgroup v-if="timeOptionGroups.months.length" :label="ui.month">
                  <option v-for="option in timeOptionGroups.months" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="f">
              <label>{{ ui.set }}</label>
              <select v-model="filters.set">
                <option v-for="o in setOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </div>

            <div class="f">
              <label>{{ ui.topCut }}</label>
              <select v-model="filters.topCut">
                <option v-for="o in topCutOptions" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="filter-actions">
            <button type="button" class="filter-action filter-action--secondary mono" @click="resetFilters">
              {{ ui.reset }}
            </button>
            <button type="button" class="filter-action filter-action--primary mono" @click="applyFilters">
              {{ ui.apply }}
            </button>
          </div>
        </div>

        <section class="creator-materials-panel" :aria-label="ui.creatorMaterials">
          <span class="creator-materials-panel__eyebrow mono">// {{ ui.creatorMaterials }}</span>
          <h2>{{ ui.creatorMaterials }}</h2>
          <div class="creator-materials-panel__actions">
            <button
              class="creator-materials-button creator-materials-button--primary mono"
              type="button"
              :disabled="creatorPackActive"
              @click="startCreatorPack('decklists')"
            >
              {{ creatorPackLabel('decklists') }}
            </button>
            <button
              class="creator-materials-button mono"
              type="button"
              :disabled="creatorPackActive"
              @click="startCreatorPack('all')"
            >
              {{ creatorPackLabel('all') }}
            </button>
          </div>
        </section>
        </div>
      </aside>
    </div>

    <div v-if="filterDrawerOpen" class="filter-drawer-shell">
      <button
        type="button"
        class="filter-drawer-backdrop"
        :aria-label="ui.closeFilters"
        @click="closeFilterDrawer"
      ></button>

      <div class="filter-panel filter-panel--drawer" role="dialog" aria-modal="true" :aria-label="ui.filters">
        <div class="filter-panel__header filter-panel__header--drawer">
          <div>
            <span class="filter-panel__eyebrow mono">{{ ui.filterSignal }}</span>
            <h2>{{ ui.filters }}</h2>
          </div>
          <button type="button" class="filter-close mono" :aria-label="ui.closeFilters" @click="closeFilterDrawer">
            ×
          </button>
        </div>

        <p class="filter-scope-line mono" aria-label="Current filter scope">
          {{ compactFilterScope }}
        </p>

        <div class="filters">
          <div class="f">
            <label>{{ ui.players }}</label>
            <input
              v-model.number="filters.minPlayers"
              type="number"
              inputmode="numeric"
              min="0"
              :placeholder="ui.playersPlaceholder"
            />
          </div>

          <div class="f">
            <label>{{ ui.time }}</label>
            <select v-model="filters.time">
              <option v-for="option in timeOptionGroups.base" :key="`drawer-${option.value}`" :value="option.value">
                {{ option.label }}
              </option>
              <optgroup v-if="timeOptionGroups.months.length" :label="ui.month">
                <option
                  v-for="option in timeOptionGroups.months"
                  :key="`drawer-${option.value}`"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="f">
            <label>{{ ui.set }}</label>
            <select v-model="filters.set">
              <option v-for="o in setOptions" :key="`drawer-${o.value}`" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>

          <div class="f">
            <label>{{ ui.topCut }}</label>
            <select v-model="filters.topCut">
              <option v-for="o in topCutOptions" :key="`drawer-${o.value}`" :value="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="filter-actions">
          <button type="button" class="filter-action filter-action--secondary mono" @click="resetFilters">
            {{ ui.reset }}
          </button>
          <button type="button" class="filter-action filter-action--primary mono" @click="applyFilters">
            {{ ui.apply }}
          </button>
        </div>
      </div>
    </div>

    <DeckProfile
      v-if="creatorPackActive"
      class="tierlistCreatorMount"
      auto-download-creator-pack
      :creator-pack-asset-mode="creatorPackMode"
      @creator-pack-finished="creatorPackActive = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import substituteIcon from "../assets/deck-icons/substitute.png";
import { getLocalizedDeckName, getLocalizedPokemonName } from "../assets/pokemonNames";
import MotionNumber from "../components/ui/MotionNumber.vue";
import ProgressBarAnimated from "../components/ui/ProgressBarAnimated.vue";
import {
  buildTierEmaScores,
  calculateTierScore,
  resolveDeckTier,
  type TierEmaInput,
} from "../lib/deckTier";
import {
  buildStandingLookup,
  lookupStandingForPairingSide,
  parsePairingResult,
} from "../lib/pairingResolver";
import {
  buildTopDecksScopeKey,
  loadTopDecksPrecomputed,
  type PrecomputedTopDeckScope,
  type PrecomputedTopDecksPayload,
} from "../lib/precomputedViews";

const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";
const DeckProfile = defineAsyncComponent(() => import("./DeckProfile.vue"));

type TierRow = {
  deck: string;
  tier: string;
  score: number;
  raw_name?: string;
  isOther?: boolean;
  iconKeys: string[];
  spriteUrls: string[];
  usage: number;
  total_samples: number;
  data1_top32_appearances: number;
  data2_weighted_points: number;
  data3_top32_share_pct: number;
  data4_ema_score?: number;
};

type Meta = {
  generated_at: string;
  days_back: number;
  min_players: number;
  usage_threshold: number;
  tournaments_count: number;
};

type MatchupRecord = {
  deckA: string;
  deckB: string;
  winsA: number;
  lossesA: number;
  ties: number;
  total: number;
  winrateA: number;
};

type TournamentListItem = {
  id: string;
  date: string;
  players?: number;
  game?: string;
  format?: string;
  set?: string;
  swiss?: string | null;
};

type NormalizedTournament = TournamentListItem & {
  startMs: number;
  versionCode: string;
  swiss?: SwissLabel;
};

type StandingRow = Record<string, any>;
type PairingRow = Record<string, any>;

type DeckIdentity = {
  key: string;
  rawName: string;
  iconKeys: string[];
};

type DeckAggregate = {
  key: string;
  rawName: string;
  iconKeys: string[];
  allSamples: number;
  baselineTop32Samples: number;
  weightedPoints: number;
};

interface VersionMarker {
  code: string;
  name: string;
  startMs: number;
}

interface VersionWindow extends VersionMarker {
  label: string;
  endMs: number;
}

const VERSION_MARKERS: VersionMarker[] = [
  { code: "A1", name: "Genetic Apex", startMs: utcMs(2024, 10, 30) },
  { code: "A1a", name: "Mythical Island", startMs: utcMs(2024, 12, 17) },
  { code: "A2", name: "Space-Time Smackdown", startMs: utcMs(2025, 1, 29) },
  { code: "A2a", name: "Triumphant Light", startMs: utcMs(2025, 2, 28) },
  { code: "A2b", name: "Shining Revelry", startMs: utcMs(2025, 3, 27) },
  { code: "A3", name: "Celestial Guardians", startMs: utcMs(2025, 4, 30) },
  { code: "A3a", name: "Extradimensional Crisis", startMs: utcMs(2025, 5, 29) },
  { code: "A3b", name: "Eevee Grove", startMs: utcMs(2025, 6, 26) },
  { code: "A4", name: "Wisdom of Sea and Sky", startMs: utcMs(2025, 7, 30) },
  { code: "A4a", name: "Secluded Springs", startMs: utcMs(2025, 8, 28) },
  { code: "A4b", name: "Deluxe Pack: ex", startMs: utcMs(2025, 9, 30) },
  { code: "B1", name: "Mega Rising", startMs: utcMs(2025, 10, 30) },
  { code: "B1a", name: "Crimson Blaze", startMs: utcMs(2025, 12, 17) },
  { code: "B2", name: "Fantastical Parade", startMs: utcMs(2026, 1, 29) },
  { code: "B2a", name: "Paldean Wonders", startMs: utcMs(2026, 2, 26) },
  { code: "B2b", name: "Mega Shine", startMs: utcMs(2026, 3, 25) },
  { code: "B3", name: "Pulsing Aura", startMs: utcMs(2026, 4, 28) },
  { code: "B3a", name: "Paradox Drive", startMs: utcMs(2026, 5, 28) },
  { code: "B3b", name: "Everyday Wonders", startMs: utcMs(2026, 6, 30) },
  { code: "B4", name: "Ruler of the Skies", startMs: utcMs(2026, 7, 30) },
  { code: "B4a", name: "Team Rocket's Ambition", startMs: utcMs(2026, 8, 27) },
];

const VERSION_WINDOWS: VersionWindow[] = VERSION_MARKERS.map((item, index, arr) => ({
  ...item,
  label: `${item.code} - ${item.name}`,
  endMs: arr[index + 1]?.startMs ?? Number.POSITIVE_INFINITY,
}));

function inferVersionByStartMs(ms: number): VersionWindow | null {
  let hit: VersionWindow | null = null;
  for (const version of VERSION_WINDOWS) {
    if (ms >= version.startMs) hit = version;
    else break;
  }
  return hit;
}

const route = useRoute();
const tierPanelCaptureRef = ref<HTMLElement | null>(null);
const downloadingTierPanel = ref(false);
const creatorPackActive = ref(false);
const creatorPackMode = ref<"all" | "decklists">("decklists");

const locale = computed<"zh" | "en">(() => {
  return String(route.path).split("/")[1] === "en" ? "en" : "zh";
});

const ui = computed(() => {
  if (locale.value === "en") {
    return {
      pageTitle: "Tier List",
      heroEyebrow: "BTM/01 — COMPETITION INTELLIGENCE",
      heroTitle: "The Pocket meta.",
      heroTitleAccent: "Decoded.",
      heroLead:
        "Tournament results, deck performance, matchups and card usage — rebuilt into one live competitive ledger.",
      loadingTournaments: "Loading tournaments…",
      generatedAt: "Generated:",
      players: "Players",
      playersPlaceholder: "e.g. 32",
      time: "Time",
      month: "Month",
      set: "Set",
      topCut: "Top Cut",
      filters: "Filters",
      creatorMaterials: "Creator assets",
      decklistsZip: "Download decklists ZIP",
      fullCreatorZip: "Download full creator ZIP",
      buildingDecklistsZip: "Building decklists ZIP...",
      buildingCreatorZip: "Building creator ZIP...",
      evRailLabel: "Tier List sections",
      filterSignal: "QUERY CONTROL",
      filterSubtitle: "Scope controls stay active while the report scrolls.",
      openFilters: "Open filters",
      closeFilters: "Close filters",
      activeScope: "Scope",
      activeTime: "Time",
      activeTopCut: "Cut",
      sampleSize: "Sample",
      lastUpdated: "Updated",
      reset: "Reset",
      apply: "Apply",
      usageBreakdown: "Usage Breakdown",
      usageSubtitle: "Top 10 shown individually; remaining decks grouped as other",
      topDeckMetric: "Top deck",
      top10ShareMetric: "Top 10 share",
      othersMetric: "Others",
      metaSpreadMetric: "Meta spread",
      metaSpreadHigh: "High",
      metaSpreadMedium: "Medium",
      metaSpreadLow: "Low",
      deckScore: "Deck Score",
      scoreSubtitle: "Scores normalized to top deck = 100",
      decks: "decks",
      other: "other",
      samples: "samples",
      loading: "Loading...",
      loadingEllipsis: "Loading…",
      noUsageData: "No usage data",
      tierList: "Tier List",
      noTierData: "No tier data",
      winRateMatrix: "Win Rate Matrix",
      winRateSubtitle:
        "Top 10 by score with one image-based custom slot. Rows are your deck; columns are opponent decks. Low-sample matchups are dimmed.",
      loadingMatchups: "Loading matchups…",
      top10Matchups: "Top 10 matchups",
      slot: "slot",
      customSlot: "Custom slot",
      selectCustomSlot: "Search or select a deck",
      matrixSearchLabel: "Search custom matchup deck",
      matrixSearchPlaceholder: "Search deck name, Pokemon, tier",
      matrixSearchResults: "Deck search results",
      matrixSearchEmpty: "No matching decks",
      allDecksInFilter: "All decks in current filter",
      clearCustomSlot: "Clear custom slot",
      customDeck: "Custom deck",
      versus: "vs.",
      chooseCustomDeck: "Choose a custom deck above to fill this slot.",
      noMatchupData: "No matchup data",
      matrixCornerLabel: "Your \\ Opponent",
      matrixRowsLabel: "Rows: Your deck",
      matrixColumnsLabel: "Columns: Opponent",
      mobileMatrixDeck: "Your deck",
      tooltipYourDeck: "Your deck",
      tooltipOpponentDeck: "Opponent deck",
      tooltipWinRate: "Win rate",
      tooltipRecord: "Record",
      tooltipTotalGames: "Total games",
      tooltipConfidence: "Confidence level",
      matchupDetailTitle: "Matchup detail",
      matchupDetailEmpty: "Point at a matchup cell to inspect details.",
      detailColorLegend: "Color legend",
      detailDisadvantaged: "Red = disadvantaged",
      detailEven: "Dark = even",
      detailFavored: "Green = favored",
      detailConfidenceNote: "Low-sample matchups reduce color intensity.",
      detailTotalGames: "Total games",
      detailConfidence: "Confidence",
    };
  }

  return {
    pageTitle: "牌組環境",
    heroEyebrow: "BTM/01 — 競技情報終端",
    heroTitle: "牌組環境，",
    heroTitleAccent: "已解碼。",
    heroLead: "把賽事、牌組表現、對局與卡片投入率，整理成一套每日更新的 PTCG Pocket 競技情報。",
    loadingTournaments: "載入賽事中…",
    generatedAt: "生成時間:",
    players: "玩家數",
    playersPlaceholder: "例如 32",
    time: "時間",
    month: "月份",
    set: "版本",
    topCut: "淘汰賽段位",
    filters: "篩選器",
    creatorMaterials: "創作者素材",
    decklistsZip: "下載牌組 ZIP",
    fullCreatorZip: "下載完整素材 ZIP",
    buildingDecklistsZip: "製作牌組 ZIP 中...",
    buildingCreatorZip: "製作素材 ZIP 中...",
    evRailLabel: "牌組環境頁面區塊",
    filterSignal: "QUERY CONTROL",
    filterSubtitle: "篩選條件會在報告滾動時停留於可視區域。",
    openFilters: "開啟篩選器",
    closeFilters: "關閉篩選器",
    activeScope: "條件",
    activeTime: "時間",
    activeTopCut: "段位",
    sampleSize: "樣本",
    lastUpdated: "更新",
    reset: "重設",
    apply: "套用",
    usageBreakdown: "使用率分布",
    usageSubtitle: "前 10 名獨立顯示，其餘牌組合併為 other",
    topDeckMetric: "最高牌組",
    top10ShareMetric: "前 10 佔比",
    othersMetric: "其他",
    metaSpreadMetric: "Meta 分散度",
    metaSpreadHigh: "高",
    metaSpreadMedium: "中",
    metaSpreadLow: "低",
    deckScore: "牌組分數",
    scoreSubtitle: "分數以第 1 名為 100 標準化",
    decks: "牌組",
    other: "其他",
    samples: "樣本",
    loading: "載入中...",
    loadingEllipsis: "載入中…",
    noUsageData: "沒有使用率資料",
    tierList: "牌組分級",
    noTierData: "沒有可顯示的牌組",
    winRateMatrix: "勝率矩陣",
    winRateSubtitle: "依分數前 10 名，外加 1 個自選牌組欄位。橫列為己方牌組，直欄為對手牌組；低樣本對局會降低顏色強度。",
    loadingMatchups: "載入對戰中…",
    top10Matchups: "Top 10 對局",
    slot: "欄位",
    customSlot: "自選牌組",
    selectCustomSlot: "搜尋或選擇一副牌組",
    matrixSearchLabel: "搜尋自選對局牌組",
    matrixSearchPlaceholder: "搜尋牌組名稱、寶可夢、tier",
    matrixSearchResults: "牌組搜尋結果",
    matrixSearchEmpty: "沒有符合的牌組",
    allDecksInFilter: "目前篩選內所有牌組",
    clearCustomSlot: "清空自選牌組格",
    customDeck: "自選牌組",
    versus: "對",
    chooseCustomDeck: "先在上方選擇一副牌組，這裡才會顯示對戰資料。",
    noMatchupData: "沒有對戰資料",
    matrixCornerLabel: "己方 \\ 對手",
    matrixRowsLabel: "行: 己方牌組",
    matrixColumnsLabel: "列: 對手牌組",
    mobileMatrixDeck: "己方牌組",
    tooltipYourDeck: "己方牌組",
    tooltipOpponentDeck: "對手牌組",
    tooltipWinRate: "Win rate",
    tooltipRecord: "Record",
    tooltipTotalGames: "Total games",
    tooltipConfidence: "Confidence level",
    matchupDetailTitle: "對局細節",
    matchupDetailEmpty: "指向對局格子查看詳細資料。",
    detailColorLegend: "色彩圖例",
    detailDisadvantaged: "紅 = 劣勢",
    detailEven: "深色 = 均勢",
    detailFavored: "綠 = 優勢",
    detailConfidenceNote: "低樣本對局會降低顏色強度。",
    detailTotalGames: "總對局",
    detailConfidence: "可信度",
  };
});

const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

const meta = ref<Meta | null>(null);
const tierRows = ref<TierRow[]>([]);
const rawMatrixTierRows = ref<TierRow[]>([]);
const precomputedTopDecks = ref<PrecomputedTopDecksPayload | null>(null);
const precomputedTopDecksLoading = ref(false);
const hoveredUsageSegmentKey = ref<string | null>(null);
const filterDrawerOpen = ref(false);

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_DECK_LIMIT = 10;
const EV_RAIL_ITEMS = [
  { id: "tier-list", label: "EV/01" },
  { id: "usage-breakdown", label: "EV/02" },
  { id: "deck-score", label: "EV/03" },
  { id: "matchup-matrix", label: "EV/04" },
] as const;
const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";
const MATRIX_EXTRA_DECK_STORAGE_KEY = "btm:tier-list:matrix-extra-deck";
const SCORE_BAR_GRADIENT = "linear-gradient(90deg, #4da3ff 0%, #7ccbff 54%, #ffd166 100%)";
const USAGE_PIE_COLORS = [
  "#4DA3FF",
  "#FFD166",
  "#00D084",
  "#FF3B4F",
  "#B86BFF",
  "#FF2D75",
  "#00E5FF",
  "#7CFF00",
  "#7CCBFF",
  "#2563EB",
] as const;
const evRailItems = EV_RAIL_ITEMS;
const activeEvSectionId = ref<string>(EV_RAIL_ITEMS[0].id);
const pressedEvSectionId = ref<string | null>(null);
let evRailRaf = 0;
let evRailPressTimer: ReturnType<typeof window.setTimeout> | undefined;

const evRailProgress = computed(() => {
  const index = Math.max(0, EV_RAIL_ITEMS.findIndex((item) => item.id === activeEvSectionId.value));
  return EV_RAIL_ITEMS.length <= 1 ? 0 : index / (EV_RAIL_ITEMS.length - 1);
});
type TimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;
type SetFilterValue = "" | string;
type SwissLabel = "BO1" | "BO3" | "Other";
type SwissValue = "" | SwissLabel;
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return (await response.json()) as T;
}

function utcMs(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

const filters = reactive<{
  minPlayers: number | undefined;
  time: TimeFilterValue;
  set: SetFilterValue;
  topCut: TopCutValue;
}>({
  minPlayers: undefined,
  time: "past7",
  set: "",
  topCut: "all",
});

const contentTransitionKey = computed(() => {
  return [filters.minPlayers ?? "", filters.time, filters.set, filters.topCut].join("|");
});

function resetFilters() {
  filters.minPlayers = undefined;
  filters.time = "past7";
  filters.set = currentVersionWindow.value?.code ?? "";
  filters.topCut = "all";
}

function closeFilterDrawer() {
  filterDrawerOpen.value = false;
}

function applyFilters() {
  closeFilterDrawer();
}

function startCreatorPack(mode: "all" | "decklists") {
  if (creatorPackActive.value) return;
  creatorPackMode.value = mode;
  creatorPackActive.value = true;
}

function creatorPackLabel(mode: "all" | "decklists") {
  const isActiveMode = creatorPackActive.value && creatorPackMode.value === mode;
  if (mode === "decklists") {
    return isActiveMode ? ui.value.buildingDecklistsZip : ui.value.decklistsZip;
  }
  return isActiveMode ? ui.value.buildingCreatorZip : ui.value.fullCreatorZip;
}

function updateActiveEvSection() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const viewportTarget = window.innerHeight * 0.42;
  let nextActive = EV_RAIL_ITEMS[0].id;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const item of EV_RAIL_ITEMS) {
    const element = document.getElementById(item.id);
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    const sectionAnchor = rect.top + Math.min(rect.height, window.innerHeight) * 0.24;
    const overlapsTarget = rect.top <= viewportTarget && rect.bottom >= viewportTarget;
    const distance = overlapsTarget ? 0 : Math.abs(sectionAnchor - viewportTarget);

    if (distance < bestDistance) {
      bestDistance = distance;
      nextActive = item.id;
    }
  }

  activeEvSectionId.value = nextActive;
}

function scheduleEvRailUpdate() {
  if (typeof window === "undefined") return;
  if (evRailRaf) return;
  evRailRaf = window.requestAnimationFrame(() => {
    evRailRaf = 0;
    updateActiveEvSection();
  });
}

function scrollToEvSection(id: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.clearTimeout(evRailPressTimer);
  pressedEvSectionId.value = id;
  evRailPressTimer = window.setTimeout(() => {
    pressedEvSectionId.value = null;
  }, 260);

  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  window.setTimeout(updateActiveEvSection, 520);
}

const legacySetOptions = computed(() => {
  const isZh = locale.value === "zh";

  function versionLabel(version: VersionWindow, includeCurrentSuffix: boolean) {
    const isCurrent = currentVersionWindow.value?.code === version.code;
    const suffix = includeCurrentSuffix && isCurrent ? (isZh ? "（目前）" : " (current)") : "";
    return `${version.code} - ${version.name}${suffix}`;
  }

  return [
    { value: "" as SetFilterValue, label: isZh ? "全部資料" : "All data" },
    {
      value: PRESET_CURRENT_7 as SetFilterValue,
      label: isZh ? "近 7 天（僅目前版本）" : "Past 7 days (current set only)",
    },
    {
      value: PRESET_CURRENT_14 as SetFilterValue,
      label: isZh ? "近 14 天（僅目前版本）" : "Past 14 days (current set only)",
    },
    ...[...VERSION_WINDOWS].reverse().map((v) => ({
      value: v.code as SetFilterValue,
      label: versionLabel(v, true),
    })),
  ];
});

const legacyTopCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => {
  return [
    { value: "all", label: locale.value === "en" ? "All" : "全部" },
    { value: "64", label: "Top 64" },
    { value: "32", label: "Top 32" },
    { value: "16", label: "Top 16" },
    { value: "8", label: "Top 8" },
    { value: "4", label: "Top 4" },
    { value: "2", label: "Top 2" },
    { value: "1", label: locale.value === "en" ? "Winner" : "冠軍" },
  ];
});

void legacySetOptions;
void legacyTopCutOptions;

function versionLabel(version: VersionWindow, includeCurrentSuffix = true) {
  const isZh = locale.value === "zh";
  const isCurrent = currentVersionWindow.value?.code === version.code;
  const suffix = includeCurrentSuffix && isCurrent ? (isZh ? " (目前版本)" : " (current)") : "";
  return `${version.code} - ${version.name}${suffix}`;
}

const setOptions = computed<Array<{ value: SetFilterValue; label: string }>>(() => {
  return [
    { value: "", label: locale.value === "en" ? "All" : "全部" },
    ...[...VERSION_WINDOWS].reverse().map((version) => ({
      value: version.code,
      label: versionLabel(version),
    })),
  ];
});

const topCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => {
  return [
    { value: "all", label: locale.value === "en" ? "All" : "全部" },
    { value: "64", label: "Top 64" },
    { value: "32", label: "Top 32" },
    { value: "16", label: "Top 16" },
    { value: "8", label: "Top 8" },
    { value: "4", label: "Top 4" },
    { value: "2", label: "Top 2" },
    { value: "1", label: locale.value === "en" ? "Winner" : "冠軍" },
  ];
});

async function loadPrecomputedTopDecksForTierList() {
  if (import.meta.env.SSR) return;
  precomputedTopDecksLoading.value = true;

  try {
    precomputedTopDecks.value = await loadTopDecksPrecomputed();
  } catch (error) {
    precomputedTopDecks.value = null;
    console.warn("[TierList] precomputed data unavailable; falling back to raw JSON.", error);
  } finally {
    precomputedTopDecksLoading.value = false;
  }
}

const activePrecomputedTierScope = computed<PrecomputedTopDeckScope | null>(() => {
  if (!precomputedTopDecks.value) return null;
  if ((filters.minPlayers ?? 0) > 0) return null;

  const key = buildTopDecksScopeKey({
    time: String(filters.time),
    set: String(filters.set ?? ""),
    topCut: filters.topCut,
    minPlayers: filters.minPlayers,
  });

  return precomputedTopDecks.value.scopes[key] ?? null;
});

const matrixVersionCode = computed(() => {
  const selectedSet = String(filters.set ?? "").trim();
  if (selectedSet && selectedSet !== PRESET_CURRENT_7 && selectedSet !== PRESET_CURRENT_14) {
    return selectedSet;
  }
  return precomputedTopDecks.value?.currentVersionCode || currentVersionWindow.value?.code || "";
});

const activePrecomputedMatrixScope = computed<PrecomputedTopDeckScope | null>(() => {
  if (!precomputedTopDecks.value) return null;

  const versionCode = matrixVersionCode.value;
  if (!versionCode) return null;

  const key = buildTopDecksScopeKey({
    time: "all",
    set: versionCode,
    topCut: "all",
  });

  return precomputedTopDecks.value.scopes[key] ?? null;
});

function tierRowFromPrecomputed(row: PrecomputedTopDeckScope["rows"][number]): TierRow {
  return {
    deck: row.key,
    tier: row.tier,
    score: row.score,
    raw_name: row.rawName,
    iconKeys: row.iconKeys,
    spriteUrls: resolveDeckSpriteUrlsFromIconKeys(row.iconKeys),
    usage: row.topCutShare,
    total_samples: row.selectedSamples,
    data1_top32_appearances: row.baselineTop32Samples,
    data2_weighted_points: row.weightedPoints,
    data3_top32_share_pct: row.baselineTop32SharePct,
    data4_ema_score: row.emaScore,
  };
}

const matrixTierRows = computed<TierRow[]>(() => {
  if (tierRows.value.length) return tierRows.value;
  if (rawMatrixTierRows.value.length) return rawMatrixTierRows.value;

  const scope = activePrecomputedMatrixScope.value;
  return scope ? scope.rows.slice(0, 2000).map(tierRowFromPrecomputed) : [];
});

const topDeckRows = computed(() => {
  return [...matrixTierRows.value].sort((a, b) => b.score - a.score).slice(0, TOP_DECK_LIMIT);
});

const usageTopDeckRows = computed(() => {
  return [...tierRows.value]
    .sort((a, b) => {
      return (
        b.usage - a.usage ||
        b.total_samples - a.total_samples ||
        b.score - a.score ||
        a.deck.localeCompare(b.deck)
      );
    })
    .slice(0, TOP_DECK_LIMIT);
});

function isSetToken(token: string) {
  return /^[ab]\d+[a-z]?$/i.test(token);
}

function normalizeTierKey(tier: string) {
  const key = String(tier ?? "F").trim().toLowerCase();
  return key || "f";
}

function tierColor(tier: string) {
  switch (normalizeTierKey(tier)) {
    case "sss":
    case "ss":
    case "s":
      return "rgba(255, 59, 79, 0.96)";
    case "a":
      return "rgba(255, 209, 102, 0.94)";
    case "b":
      return "rgba(77, 163, 255, 0.92)";
    case "c":
      return "rgba(0, 208, 132, 0.86)";
    case "d":
      return "rgba(77, 163, 255, 0.78)";
    case "e":
      return "rgba(184, 107, 255, 0.76)";
    case "f":
      return "rgba(100, 116, 139, 0.9)";
    default:
      return "rgba(168, 179, 199, 0.42)";
  }
}

function tierBadgeGradient(tier: string) {
  switch (normalizeTierKey(tier)) {
    case "sss":
    case "ss":
    case "s":
      return "linear-gradient(180deg, rgba(255, 59, 79, 0.96) 0%, rgba(92, 21, 34, 0.98) 100%)";
    case "a":
      return "linear-gradient(180deg, rgba(255, 209, 102, 0.95) 0%, rgba(88, 63, 12, 0.98) 100%)";
    case "b":
      return "linear-gradient(180deg, rgba(77, 163, 255, 0.95) 0%, rgba(24, 55, 102, 0.98) 100%)";
    case "c":
      return "linear-gradient(180deg, rgba(0, 208, 132, 0.94) 0%, rgba(18, 82, 58, 0.98) 100%)";
    case "d":
      return "linear-gradient(180deg, rgba(82, 113, 255, 0.94) 0%, rgba(46, 61, 86, 0.98) 100%)";
    case "e":
      return "linear-gradient(180deg, rgba(105, 92, 140, 0.94) 0%, rgba(59, 49, 84, 0.98) 100%)";
    case "f":
      return "linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%)";
    default:
      return "linear-gradient(180deg, rgba(95, 105, 120, 0.94) 0%, rgba(50, 58, 70, 0.98) 100%)";
  }
}

function tierSectionDescriptor(tier: string) {
  switch (normalizeTierKey(tier)) {
    case "sss":
      return "FORMAT BREAKER / SINGULAR";
    case "ss":
      return "DOMINANT / META DEFINING";
    case "s":
      return "DOMINANT / META DEFINING";
    case "a":
      return "STRONG / CONSISTENT";
    case "b":
      return "VIABLE / SPECIFIC MATCHUPS";
    case "c":
      return "PLAYABLE / NICHE";
    case "d":
      return "FRINGE / COUNTER META";
    case "e":
      return "LIMITED / SPECIALIST";
    default:
      return "OBSERVED / LOW SIGNAL";
  }
}

function deckShortLabel(deckKey: string) {
  const tokens = String(deckKey ?? "")
    .split("-")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !isSetToken(t));

  const mapped = tokens.map((part) => {
    const lower = part.toLowerCase();
    if (lower === "ex") return "EX";
    if (lower === "gx") return "GX";
    if (lower === "vstar") return "VSTAR";
    if (lower === "vmax") return "VMAX";
    if (lower === "mega") return "Mega";
    if (lower === "x" || lower === "y") return lower.toUpperCase();
    if (part.length <= 1) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  return mapped.slice(0, 2).join(" ");
}

function deckProfileTo(deckKey: string) {
  return {
    path: `/${locale.value}/top-decks/${encodeURIComponent(deckKey)}`,
    query: {
      time: filters.time,
      set: filters.set,
      topCut: filters.topCut,
      minPlayers:
        filters.minPlayers != null && Number.isFinite(filters.minPlayers)
          ? String(filters.minPlayers)
          : undefined,
    },
  };
}

const TIER_PANEL_ORDER = ["SSS", "SS", "S", "A", "B", "C"] as const;

const tierPanelRows = computed(() => {
  const tierSet = new Set<string>(TIER_PANEL_ORDER);
  return tierRows.value.filter((row) => tierSet.has(String(row.tier ?? "F").toUpperCase()));
});

const tierGroups = computed<Record<string, TierRow[]>>(() => {
  const out: Record<string, TierRow[]> = {};
  for (const r of tierPanelRows.value) {
    const t = String(r.tier ?? "F").toUpperCase();
    if (!out[t]) out[t] = [];
    out[t].push(r);
  }
  return out;
});

const visibleTierGroups = computed(() => {
  return TIER_PANEL_ORDER.map((tier) => ({
    tier,
    rows: tierGroups.value[tier] ?? [],
  })).filter((group) => group.rows.length > 0);
});

const tierPanelDeckCount = computed(() => tierPanelRows.value.length);

const topDeckKeySet = computed(() => new Set(topDeckRows.value.map((row) => row.deck)));
const usageTopDeckKeySet = computed(() => new Set(usageTopDeckRows.value.map((row) => row.deck)));

const otherUsageRow = computed<TierRow | null>(() => {
  const others = tierRows.value.filter((row) => !usageTopDeckKeySet.value.has(row.deck));
  if (others.length === 0) return null;

  return {
    deck: "__other__",
    tier: "OTHER",
    score: -1,
    raw_name: locale.value === "en" ? "Other Decks" : "其他牌組",
    isOther: true,
    iconKeys: ["substitute"],
    spriteUrls: [substituteIcon],
    usage: others.reduce((sum, row) => sum + row.usage, 0),
    total_samples: others.reduce((sum, row) => sum + row.total_samples, 0),
    data1_top32_appearances: others.reduce((sum, row) => sum + row.data1_top32_appearances, 0),
    data2_weighted_points: others.reduce((sum, row) => sum + row.data2_weighted_points, 0),
    data3_top32_share_pct: others.reduce((sum, row) => sum + row.data3_top32_share_pct, 0),
  };
});

const usageBreakdownRows = computed(() => {
  return otherUsageRow.value ? [...usageTopDeckRows.value, otherUsageRow.value] : [...usageTopDeckRows.value];
});

const usageMax = computed(() => {
  return usageTopDeckRows.value.reduce((max, row) => Math.max(max, row.usage), 0);
});

type UsagePieSegment = {
  key: string;
  label: string;
  usage: number;
  color: string;
  isOther: boolean;
  iconKeys: string[];
  spriteUrls: string[];
};

const usagePieSegments = computed<UsagePieSegment[]>(() => {
  return usageBreakdownRows.value
    .filter((row) => row.usage > 0)
    .map((row, index) => ({
      key: row.deck,
      label: usageDeckDisplayName(row),
      usage: row.usage,
      color: usagePieColor(row, index),
      isOther: Boolean(row.isOther),
      iconKeys: row.iconKeys ?? [],
      spriteUrls: row.spriteUrls ?? [],
    }));
});

const usagePieLead = computed(() => usagePieSegments.value[0] ?? null);

const usagePieActiveSegment = computed(() => {
  if (hoveredUsageSegmentKey.value) {
    const hovered = usagePieSegments.value.find((segment) => segment.key === hoveredUsageSegmentKey.value);
    if (hovered) return hovered;
  }
  return usagePieLead.value;
});

const usagePieActiveSegmentSprites = computed(() => {
  return (usagePieActiveSegment.value?.spriteUrls ?? []).slice(0, 2);
});

const usagePieTotal = computed(() => {
  return usagePieSegments.value.reduce((sum, segment) => sum + segment.usage, 0);
});

const usagePieSvgSegments = computed(() => {
  const total = usagePieSegments.value.reduce((sum, segment) => sum + segment.usage, 0);
  if (total <= 0) return [];

  let offset = 0;
  return usagePieSegments.value.map((segment) => {
    const share = Math.max(0, (segment.usage / total) * 100);
    const out = {
      ...segment,
      share,
      offset,
    };
    offset += share;
    return out;
  });
});

const usageTop10Share = computed(() => {
  return usageTopDeckRows.value.reduce((sum, row) => sum + row.usage, 0);
});

const usageOtherShare = computed(() => {
  if (otherUsageRow.value) return otherUsageRow.value.usage;
  return Math.max(0, usagePieTotal.value - usageTop10Share.value);
});

const metaSpreadKey = computed<"high" | "medium" | "low">(() => {
  const topDeckUsage = usagePieLead.value?.usage ?? 0;
  const top10Share = usageTop10Share.value;
  if (topDeckUsage <= 0.1 && top10Share <= 0.5) return "high";
  if (topDeckUsage <= 0.16 && top10Share <= 0.7) return "medium";
  return "low";
});

const metaSpreadText = computed(() => {
  if (metaSpreadKey.value === "high") return ui.value.metaSpreadHigh;
  if (metaSpreadKey.value === "medium") return ui.value.metaSpreadMedium;
  return ui.value.metaSpreadLow;
});

const usageSummaryRows = computed(() => {
  return [
    { label: ui.value.topDeckMetric, value: formatUsagePct(usagePieLead.value?.usage ?? 0) },
    { label: ui.value.top10ShareMetric, value: formatUsagePct(usageTop10Share.value) },
    { label: ui.value.othersMetric, value: formatUsagePct(usageOtherShare.value) },
    { label: ui.value.metaSpreadMetric, value: metaSpreadText.value },
  ];
});

const scoreBreakdownRows = computed(() => [...topDeckRows.value]);

const scoreMax = computed(() => {
  return scoreBreakdownRows.value.reduce((max, row) => Math.max(max, row.score), 0);
});

function usageDeckDisplayName(row: TierRow) {
  if (row.isOther) {
    return locale.value === "en" ? "Other Decks" : "其他牌組";
  }

  if (locale.value === "zh") {
    const localized = getLocalizedDeckName(row.raw_name, row.iconKeys ?? [], "zh");
    if (localized) return localized;
  }

  return String(row.raw_name ?? "").trim() || humanizeDeckId(row.deck);
}

function matrixDeckShortName(row: TierRow) {
  return usageDeckDisplayName(row);
}

function formatUsagePct(usage: number) {
  return `${(usage * 100).toFixed(1)}%`;
}

function rawScoreText(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : "0.0000";
}

function relativeScore(value: number) {
  const topRawScore = scoreMax.value;
  if (!Number.isFinite(value) || !topRawScore || value <= 0) return 0;
  return Math.max(0, Math.min(100, (value / topRawScore) * 100));
}

function scoreTooltip(value: number) {
  return `Raw score: ${rawScoreText(value)}`;
}

function usagePieColor(row: TierRow, index: number) {
  if (row.isOther) return "rgba(100, 116, 139, 0.9)";
  return USAGE_PIE_COLORS[index % USAGE_PIE_COLORS.length];
}

function usageBarWidth(usage: number) {
  const max = usageMax.value;
  if (!max || usage <= 0) return "0%";
  return `${Math.max(3, Math.min(100, (usage / max) * 100)).toFixed(2)}%`;
}

function usageBarFill(row: TierRow) {
  if (row.isOther) {
    return "linear-gradient(90deg, rgba(100, 116, 139, 0.95), rgba(168, 179, 199, 0.72))";
  }
  const tier = row.tier;
  const accent = tierColor(tier).replace(/0\.\d+\)/, "0.98)");
  return `linear-gradient(90deg, rgba(77, 163, 255, 0.98), ${accent})`;
}

function scoreBarWidth(score: number) {
  return `${relativeScore(score).toFixed(2)}%`;
}

function scoreBarFill(row: TierRow) {
  void row;
  return SCORE_BAR_GRADIENT;
}

const matrixExtraDeck = ref("");
const matrixSearchQuery = ref("");
const matrixSearchOpen = ref(false);
const matrixSearchActiveIndex = ref(0);
const heatmapCardRef = ref<HTMLElement | null>(null);
const heatmapWorkspaceRef = ref<HTMLElement | null>(null);
const matchupTooltipRef = ref<HTMLElement | null>(null);
const matchupTooltipStyle = ref<Record<string, string>>({});
const hoveredHeatCellElement = ref<HTMLElement | null>(null);
const matrixCellSizePx = ref(0);
const matrixAxisSizePx = ref(0);
let matrixSizingRaf = 0;
let matrixResizeObserver: ResizeObserver | null = null;
let matchupTooltipRaf = 0;
let matrixSearchCloseTimer = 0;

function restoreMatrixExtraDeckPreference() {
  if (import.meta.env.SSR) return;
  try {
    matrixExtraDeck.value = window.localStorage.getItem(MATRIX_EXTRA_DECK_STORAGE_KEY) || "";
  } catch {
    matrixExtraDeck.value = "";
  }
}

function persistMatrixExtraDeckPreference(deckKey: string) {
  if (import.meta.env.SSR) return;
  try {
    if (deckKey) {
      window.localStorage.setItem(MATRIX_EXTRA_DECK_STORAGE_KEY, deckKey);
    } else {
      window.localStorage.removeItem(MATRIX_EXTRA_DECK_STORAGE_KEY);
    }
  } catch {
    // Storage can be blocked in private modes; the picker still works for the current session.
  }
}

const matrixOptionRows = computed(() => {
  return [...matrixTierRows.value]
    .sort((a, b) => {
      return (
        b.usage - a.usage ||
        b.total_samples - a.total_samples ||
        b.score - a.score ||
        b.data2_weighted_points - a.data2_weighted_points ||
        b.data1_top32_appearances - a.data1_top32_appearances ||
        a.deck.localeCompare(b.deck)
      );
    });
});

function normalizeMatrixSearchText(value: string) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_/|+]+/g, " ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function matrixDeckSearchHaystack(row: TierRow) {
  const iconKeys = row.iconKeys ?? [];
  const localizedNames = [
    getLocalizedDeckName(row.raw_name, iconKeys, "zh"),
    getLocalizedDeckName(row.raw_name, iconKeys, "en"),
    ...iconKeys.flatMap((key) => [
      getLocalizedPokemonName(key, "zh"),
      getLocalizedPokemonName(key, "en"),
    ]),
  ];

  return normalizeMatrixSearchText(
    [
      usageDeckDisplayName(row),
      row.raw_name,
      row.deck,
      row.tier,
      ...iconKeys,
      ...localizedNames,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

const matrixSearchResults = computed(() => {
  const query = normalizeMatrixSearchText(matrixSearchQuery.value);
  const terms = query.split(/\s+/).filter(Boolean);
  const rows = matrixOptionRows.value;
  if (!terms.length) return rows.slice(0, 8);

  return rows
    .filter((row) => {
      const haystack = matrixDeckSearchHaystack(row);
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, 10);
});

function matrixSearchOptionId(index: number) {
  return `matrix-deck-search-option-${index}`;
}

const matrixSearchActiveDescendant = computed(() => {
  if (!matrixSearchOpen.value || matrixSearchResults.value.length === 0) return undefined;
  return matrixSearchOptionId(matrixSearchActiveIndex.value);
});

function clearMatrixSearchCloseTimer() {
  if (!matrixSearchCloseTimer) return;
  if (typeof window === "undefined") {
    matrixSearchCloseTimer = 0;
    return;
  }
  window.clearTimeout(matrixSearchCloseTimer);
  matrixSearchCloseTimer = 0;
}

function openMatrixSearch() {
  clearMatrixSearchCloseTimer();
  matrixSearchOpen.value = true;
  if (matrixSearchActiveIndex.value >= matrixSearchResults.value.length) {
    matrixSearchActiveIndex.value = 0;
  }
}

function closeMatrixSearch() {
  clearMatrixSearchCloseTimer();
  matrixSearchOpen.value = false;
  matrixSearchActiveIndex.value = 0;
}

function scheduleMatrixSearchClose() {
  if (typeof window === "undefined") {
    closeMatrixSearch();
    return;
  }
  clearMatrixSearchCloseTimer();
  matrixSearchCloseTimer = window.setTimeout(() => {
    closeMatrixSearch();
  }, 140);
}

function moveMatrixSearchActive(direction: number) {
  openMatrixSearch();
  const count = matrixSearchResults.value.length;
  if (count === 0) return;
  matrixSearchActiveIndex.value = (matrixSearchActiveIndex.value + direction + count) % count;
}

function selectActiveMatrixSearchResult() {
  openMatrixSearch();
  const option = matrixSearchResults.value[matrixSearchActiveIndex.value];
  if (option) {
    void selectMatrixDeck(option.deck);
  }
}

async function refreshHeatmapForMatrixDeckChange() {
  heatLoading.value = true;
  await recomputeHeatmapForTopCut();
  heatLoading.value = false;
  await nextTick();
  scheduleMatrixSizingUpdate();
}

async function setMatrixDeck(deckKey: string) {
  const changed = matrixExtraDeck.value !== deckKey;
  matrixExtraDeck.value = deckKey;
  matrixSearchQuery.value = "";
  closeMatrixSearch();
  if (changed) {
    await refreshHeatmapForMatrixDeckChange();
  }
}

async function clearMatrixDeck() {
  await setMatrixDeck("");
}

async function selectMatrixDeck(deckKey: string) {
  await setMatrixDeck(deckKey);
}

const pieLegendSegments = computed<Array<{ tier: string; count: number }>>(() => []);

const pieConicGradient = computed(() => {
  const total = topDeckRows.value.length || 1;
  let angle = 0;
  const stops: string[] = [];

  for (const seg of pieLegendSegments.value) {
    const part = seg.count / total;
    const start = angle;
    angle += part * 360;
    const end = angle;
    const color = tierColor(seg.tier);
    stops.push(`${color} ${start}deg ${end}deg`);
  }

  if (stops.length === 0) return "conic-gradient(rgba(255,255,255,0.18) 0deg 360deg)";
  return `conic-gradient(from 90deg, ${stops.join(", ")})`;
});

const pieCenterText = computed(() => {
  const seg = [...pieLegendSegments.value].sort((a, b) => b.count - a.count)[0];
  return seg?.tier ?? "—";
});

const legacyPieCompat = [pieLegendSegments, pieConicGradient, pieCenterText];
void legacyPieCompat;
const matrixSelectedDeckRow = computed(() => {
  return matrixTierRows.value.find((row) => row.deck === matrixExtraDeck.value) ?? null;
});

const matrixAxisRows = computed<Array<TierRow | null>>(() => {
  const rows: Array<TierRow | null> = [...topDeckRows.value].slice(0, TOP_DECK_LIMIT);
  const selected = matrixSelectedDeckRow.value;
  if (!selected || rows.some((row) => row?.deck === selected.deck)) {
    return rows;
  }

  return [selected, ...rows.filter((row) => row?.deck !== selected.deck)].slice(0, TOP_DECK_LIMIT);
});

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clearMatrixSizingVars() {
  heatmapCardRef.value?.style.removeProperty("--matrix-cell-size");
  heatmapCardRef.value?.style.removeProperty("--matrix-axis-size");
}

function applyMatrixSizingVars(cellSize: number, axisSize: number) {
  heatmapCardRef.value?.style.setProperty("--matrix-cell-size", `${cellSize}px`);
  heatmapCardRef.value?.style.setProperty("--matrix-axis-size", `${axisSize}px`);
}

function updateMatrixSizing() {
  if (typeof window === "undefined") return;

  const workspace = heatmapWorkspaceRef.value;
  const axisDeckCount = matrixAxisRows.value.filter((row): row is TierRow => row !== null).length;
  if (!workspace || axisDeckCount <= 0 || window.innerWidth <= 760) {
    matrixCellSizePx.value = 0;
    matrixAxisSizePx.value = 0;
    clearMatrixSizingVars();
    return;
  }

  const workspaceWidth = workspace.clientWidth;
  const availableMatrixWidth = Math.max(0, workspaceWidth);
  const columnCount = axisDeckCount + 1;
  const matrixGap = 4;
  const spacingWidth = matrixGap * (columnCount + 1);
  const rawCellSize = (availableMatrixWidth - spacingWidth) / columnCount;
  const minCellSize = window.innerWidth >= 1180 ? 58 : 52;
  const maxCellSize = 148;
  const cellSize = Math.floor(clampNumber(rawCellSize, minCellSize, maxCellSize));

  matrixCellSizePx.value = cellSize;
  matrixAxisSizePx.value = cellSize;
  applyMatrixSizingVars(cellSize, cellSize);
}

function scheduleMatrixSizingUpdate() {
  if (typeof window === "undefined") return;
  if (matrixSizingRaf) window.cancelAnimationFrame(matrixSizingRaf);
  matrixSizingRaf = window.requestAnimationFrame(() => {
    matrixSizingRaf = 0;
    updateMatrixSizing();
  });
}

function onMatrixViewportChange() {
  scheduleMatrixSizingUpdate();
}

function bindMatrixResizeObserver() {
  if (typeof window === "undefined") return;
  matrixResizeObserver?.disconnect();
  matrixResizeObserver = null;

  const workspace = heatmapWorkspaceRef.value;
  if (workspace && "ResizeObserver" in window) {
    matrixResizeObserver = new ResizeObserver(() => scheduleMatrixSizingUpdate());
    matrixResizeObserver.observe(workspace);
  }

  scheduleMatrixSizingUpdate();
}

function isMatrixSelectedDeck(row: TierRow | null) {
  return Boolean(row && matrixSelectedDeckRow.value?.deck === row.deck);
}

const matchupMap = ref<Map<string, MatchupRecord>>(new Map());

function hasVisibleSelectedMatchups(map: Map<string, MatchupRecord>, selectedDeck: string) {
  if (!selectedDeck) return true;
  const axisDecks = matrixAxisRows.value
    .map((row) => row?.deck ?? "")
    .filter((deck): deck is string => !!deck);

  return axisDecks.every((deck) => {
    if (deck === selectedDeck) return true;
    return map.has(`${selectedDeck}__${deck}`) && map.has(`${deck}__${selectedDeck}`);
  });
}
const heatLoading = ref(true);

type HeatCell = {
  winrate: number | null;
  total: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  text: string;
  recordText: string;
  style: Record<string, string>;
  tooltip: string;
  confidence: "Low" | "Medium" | "High";
  confidenceClass: string;
  isMirror: boolean;
};

function getConfidence(games: number | null | undefined): "Low" | "Medium" | "High" {
  const total = Math.max(0, Number(games ?? 0));
  if (total < 3) return "Low";
  if (total < 10) return "Medium";
  return "High";
}

function heatConfidenceStrength(games: number | null | undefined) {
  const total = Math.max(0, Number(games ?? 0));
  if (total < 3) return 0.34;
  if (total <= 5) return 0.58;
  if (total < 10) return 0.78;
  return 1;
}

function heatConfidenceClass(games: number | null | undefined) {
  const confidence = getConfidence(games);
  if (confidence === "Low") return "heatmap-cell__inner--confidence-low";
  if (confidence === "Medium") return "heatmap-cell__inner--confidence-medium";
  return "heatmap-cell__inner--confidence-high";
}

function getHeatmapColor(winrate: number | null, games: number | null | undefined): Record<string, string> {
  const confidence = heatConfidenceStrength(games);
  const neutral = {
    background:
      `linear-gradient(135deg, rgba(77, 163, 255, ${0.04 * confidence}), transparent 62%), rgba(12, 27, 48, 0.78)`,
    borderColor: `rgba(148, 163, 184, ${0.18 + 0.12 * confidence})`,
    color: "#eaf4ff",
    boxShadow: "inset 0 1px 0 rgba(248, 250, 252, 0.035)",
  };

  if (winrate == null) return neutral;

  const pct = Math.max(0, Math.min(100, winrate * 100));
  if (pct >= 45 && pct <= 55) return neutral;

  if (pct > 55) {
    const distance = Math.min(1, (pct - 55) / 45);
    const strength = (0.22 + distance * 0.58) * confidence;
    return {
      background:
        `linear-gradient(135deg, rgba(77, 163, 255, ${0.06 + strength * 0.08}), transparent 58%), rgba(0, 148, 130, ${0.16 + strength * 0.46})`,
      borderColor: `rgba(0, 255, 200, ${0.16 + strength * 0.38})`,
      color: "#f8fafc",
      boxShadow: `inset 0 1px 0 rgba(248, 250, 252, ${0.025 + strength * 0.035}), 0 0 18px rgba(0, 229, 255, ${strength * 0.1})`,
    };
  }

  const distance = Math.min(1, (45 - pct) / 45);
  const strength = (0.22 + distance * 0.58) * confidence;
  return {
    background:
      `linear-gradient(135deg, rgba(255, 59, 79, ${0.04 + strength * 0.08}), transparent 60%), rgba(111, 18, 34, ${0.14 + strength * 0.42})`,
    borderColor: `rgba(255, 96, 118, ${0.14 + strength * 0.34})`,
    color: "#fff7f8",
    boxShadow: `inset 0 1px 0 rgba(248, 250, 252, ${0.02 + strength * 0.025}), 0 0 16px rgba(255, 59, 79, ${strength * 0.08})`,
  };
}

function formatRecord(wins: number | null | undefined, losses: number | null | undefined, ties = 0) {
  const w = Math.max(0, Number(wins ?? 0));
  const l = Math.max(0, Number(losses ?? 0));
  const t = Math.max(0, Number(ties ?? 0));
  return t > 0 ? `${w}–${l}–${t}` : `${w}–${l}`;
}

function formatWinRate(winrate: number) {
  const pct = winrate * 100;
  const rounded = Math.round(pct);
  return Math.abs(pct - rounded) < 0.05 ? `${rounded}%` : `${pct.toFixed(1)}%`;
}

function matchupTooltip(
  rowDeck: TierRow,
  colDeck: TierRow,
  winrate: number,
  wins: number,
  losses: number,
  ties: number,
  total: number,
) {
  const confidence = getConfidence(total);
  return [
    `${ui.value.tooltipYourDeck}: ${usageDeckDisplayName(rowDeck)}`,
    `${ui.value.tooltipOpponentDeck}: ${usageDeckDisplayName(colDeck)}`,
    `${ui.value.tooltipWinRate}: ${formatWinRate(winrate)}`,
    `${ui.value.tooltipRecord}: ${formatRecord(wins, losses, ties)}`,
    `${ui.value.tooltipTotalGames}: ${total}`,
    `${ui.value.tooltipConfidence}: ${confidence}`,
  ].join("\n");
}

const heatCells = computed<HeatCell[][]>(() => {
  const decks = matrixAxisRows.value;
  const map = matchupMap.value;

  return decks.map((rowDeck) => {
    return decks.map((colDeck) => {
      if (!rowDeck || !colDeck) {
        return {
          winrate: null,
          total: null,
          wins: null,
          losses: null,
          ties: null,
          text: "—",
          recordText: "",
          style: {},
          tooltip: "",
          confidence: "Low",
          confidenceClass: "heatmap-cell__inner--confidence-low",
          isMirror: false,
        };
      }

      const rowKey = rowDeck.deck;
      const colKey = colDeck.deck;

      if (rowKey === colKey) {
        return {
          winrate: null,
          total: null,
          wins: null,
          losses: null,
          ties: null,
          text: "mirror",
          recordText: "",
          style: {},
          tooltip: "",
          confidence: "Low",
          confidenceClass: "heatmap-cell__inner--mirror",
          isMirror: true,
        };
      }

      const direct = map.get(`${rowKey}__${colKey}`);
      if (direct) {
        const wr = direct.winrateA;
        const total = Number(direct.total ?? 0);
        const wins = Number(direct.winsA ?? 0);
        const losses = Number(direct.lossesA ?? 0);
        const ties = Number(direct.ties ?? 0);

        return {
          winrate: wr,
          total,
          wins,
          losses,
          ties,
          text: formatWinRate(wr),
          recordText: formatRecord(wins, losses, ties),
          style: getHeatmapColor(wr, total),
          tooltip: matchupTooltip(rowDeck, colDeck, wr, wins, losses, ties, total),
          confidence: getConfidence(total),
          confidenceClass: heatConfidenceClass(total),
          isMirror: false,
        };
      }

      return {
        winrate: null,
        total: null,
        wins: null,
        losses: null,
        ties: null,
        text: "—",
        recordText: "",
        style: {},
        tooltip: "",
        confidence: "Low",
        confidenceClass: "heatmap-cell__inner--confidence-low",
        isMirror: false,
      };
    });
  });
});

type HoveredHeatCell = {
  row: TierRow;
  col: TierRow;
  cell: HeatCell;
  rowIndex: number;
  colIndex: number;
};

const hoveredHeatCell = ref<HoveredHeatCell | null>(null);
const matchupDetail = computed(() => hoveredHeatCell.value);

function setHoveredHeatCell(
  row: TierRow | null,
  col: TierRow | null,
  cell: HeatCell,
  rowIndex: number,
  colIndex: number,
  event?: MouseEvent | FocusEvent,
) {
  if (!row || !col || cell.winrate == null) return;
  hoveredHeatCell.value = { row, col, cell, rowIndex, colIndex };

  const target =
    typeof HTMLElement !== "undefined" && event?.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : null;
  hoveredHeatCellElement.value = target;
  positionMatchupTooltip(target);
  void nextTick(() => positionMatchupTooltip(target));
}

function clearHoveredHeatCell() {
  hoveredHeatCell.value = null;
  hoveredHeatCellElement.value = null;
  matchupTooltipStyle.value = {};
}

function positionMatchupTooltip(target = hoveredHeatCellElement.value) {
  if (typeof window === "undefined" || !target) return;

  const rect = target.getBoundingClientRect();
  const tooltip = matchupTooltipRef.value;
  const tooltipWidth = tooltip?.offsetWidth || 360;
  const tooltipHeight = tooltip?.offsetHeight || 300;
  const gutter = 10;
  let left = rect.right + gutter;

  if (left + tooltipWidth + gutter > window.innerWidth) {
    left = rect.left - tooltipWidth - gutter;
  }

  left = clampNumber(left, gutter, Math.max(gutter, window.innerWidth - tooltipWidth - gutter));

  let top = rect.top;
  if (top + tooltipHeight + gutter > window.innerHeight) {
    top = window.innerHeight - tooltipHeight - gutter;
  }
  top = clampNumber(top, gutter, Math.max(gutter, window.innerHeight - tooltipHeight - gutter));

  matchupTooltipStyle.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}

function scheduleMatchupTooltipPosition() {
  if (typeof window === "undefined" || !hoveredHeatCell.value) return;
  if (matchupTooltipRaf) window.cancelAnimationFrame(matchupTooltipRaf);
  matchupTooltipRaf = window.requestAnimationFrame(() => {
    matchupTooltipRaf = 0;
    positionMatchupTooltip();
  });
}

function onMatchupViewportChange() {
  scheduleMatchupTooltipPosition();
}

function isHeatmapRowActive(index: number) {
  return hoveredHeatCell.value?.rowIndex === index;
}

function isHeatmapColumnActive(index: number) {
  return hoveredHeatCell.value?.colIndex === index;
}

function isHeatmapCellActive(rowIndex: number, colIndex: number) {
  const active = hoveredHeatCell.value;
  return active?.rowIndex === rowIndex && active?.colIndex === colIndex;
}

function isHeatmapCellRelated(rowIndex: number, colIndex: number) {
  const active = hoveredHeatCell.value;
  if (!active) return false;
  return active.rowIndex === rowIndex || active.colIndex === colIndex;
}

const mobileMatrixDeckKey = ref("");

const emptyHeatCell: HeatCell = {
  winrate: null,
  total: null,
  wins: null,
  losses: null,
  ties: null,
  text: "—",
  recordText: "",
  style: {},
  tooltip: "",
  confidence: "Low",
  confidenceClass: "heatmap-cell__inner--confidence-low",
  isMirror: false,
};

const mobileHeatDeckOptions = computed(() => {
  return matrixAxisRows.value.filter((row): row is TierRow => row !== null);
});

const mobileSelectedHeatEntry = computed(() => {
  const options = mobileHeatDeckOptions.value;
  const selected = options.find((row) => row.deck === mobileMatrixDeckKey.value) ?? options[0] ?? null;
  if (!selected) return null;

  const rowIndex = matrixAxisRows.value.findIndex((row) => row?.deck === selected.deck);
  const matchups = matrixAxisRows.value
    .map((col, matchupIndex) => ({
      col,
      index: matchupIndex,
      cell: rowIndex >= 0 ? (heatCells.value[rowIndex]?.[matchupIndex] ?? emptyHeatCell) : emptyHeatCell,
    }))
    .filter(
      (item): item is { col: TierRow; index: number; cell: HeatCell } =>
        item.col !== null && item.col.deck !== selected.deck,
    );

  return {
    row: selected,
    index: rowIndex,
    matchups,
  };
});

watch(
  mobileHeatDeckOptions,
  (rows) => {
    if (!rows.length) {
      mobileMatrixDeckKey.value = "";
      return;
    }

    if (!rows.some((row) => row.deck === mobileMatrixDeckKey.value)) {
      mobileMatrixDeckKey.value = rows[0]?.deck ?? "";
    }
  },
  { immediate: true },
);

const tournaments = ref<NormalizedTournament[]>([]);
const loadingTournaments = ref(false);
const tournamentsError = ref("");

const standingsCache = reactive<Record<string, StandingRow[]>>({});
const pairingsCache = reactive<Record<string, PairingRow[]>>({});
const detailsCache = reactive<Record<string, Record<string, any> | null>>({});
const standingsLoading = reactive<Record<string, boolean>>({});
const pairingsLoading = reactive<Record<string, boolean>>({});
const detailsLoading = reactive<Record<string, boolean>>({});

function dataUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function tournamentsUrl() {
  return dataUrl("data/tournaments.json");
}

function standingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/standings.json`);
}

function pairingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/pairings.json`);
}

function detailsUrl(id: string) {
  return dataUrl(`data/raw/${id}/details.json`);
}

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(standingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(pairingsCache, id);
}

function hasDetails(id: string) {
  return Object.prototype.hasOwnProperty.call(detailsCache, id);
}

function startOfUtcDayMs(ms: number) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

function parseMs(value: unknown): number {
  const ms = Date.parse(String(value ?? ""));
  return Number.isFinite(ms) ? ms : NaN;
}

function normalizeSwissValue(raw: unknown): SwissLabel | undefined {
  const text = String(raw ?? "").trim().toUpperCase();
  if (!text) return undefined;
  if (text === "BO1") return "BO1";
  if (text === "BO3") return "BO3";
  return "Other";
}

function swissLabelFromDetails(details: Record<string, any> | null | undefined): SwissLabel {
  const phases = Array.isArray(details?.phases) ? details.phases : [];
  const phase1 = phases.find((phase: any) => phase?.phase === 1) ?? phases[0];
  const phaseType = String(phase1?.type ?? "").trim().toUpperCase();
  const phaseMode = String(phase1?.mode ?? "").trim().toUpperCase();

  if (phaseType !== "SWISS") return "Other";
  if (phaseMode === "BO1") return "BO1";
  if (phaseMode === "BO3") return "BO3";
  return "Other";
}

const monthOptions = computed<Array<{ value: TimeFilterValue; label: string }>>(() => {
  const seen = new Set<string>();
  const items: Array<{ value: TimeFilterValue; label: string }> = [];

  for (const tournament of tournaments.value) {
    const date = new Date(tournament.startMs);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      value: `month:${key}`,
      label: locale.value === "en" ? key : key.replace("-", " 年 ") + " 月",
    });
  }

  return items.sort((a, b) => (a.value < b.value ? 1 : -1));
});

const timeOptionGroups = computed(() => {
  const baseOptions = [
    { value: "all" as TimeFilterValue, label: locale.value === "en" ? "All" : "全部" },
    { value: "past7" as TimeFilterValue, label: locale.value === "en" ? "Past 7 days" : "近 7 天" },
    { value: "prev7" as TimeFilterValue, label: locale.value === "en" ? "Previous 7 days" : "前 7 天" },
    { value: "past4w" as TimeFilterValue, label: locale.value === "en" ? "Past 4 weeks" : "近 4 週" },
  ];

  return {
    base: baseOptions,
    months: monthOptions.value,
  };
});

function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? String(value || "—");
}

const selectedTimeLabel = computed(() => {
  return optionLabel([...timeOptionGroups.value.base, ...timeOptionGroups.value.months], filters.time);
});

const selectedSetLabel = computed(() => {
  return optionLabel(setOptions.value, filters.set);
});

const selectedTopCutLabel = computed(() => {
  return optionLabel(topCutOptions.value, filters.topCut);
});

function compactSetScopeLabel(value: SetFilterValue) {
  const selected = String(value ?? "").trim();
  if (!selected) return currentVersionWindow.value?.code ?? selectedSetLabel.value;
  if (selected === PRESET_CURRENT_7 || selected === PRESET_CURRENT_14) {
    return currentVersionWindow.value?.code ?? selectedSetLabel.value;
  }
  return VERSION_WINDOWS.find((version) => version.code === selected)?.code ?? selectedSetLabel.value;
}

const compactFilterScope = computed(() => {
  return [selectedTimeLabel.value, compactSetScopeLabel(filters.set), selectedTopCutLabel.value]
    .filter(Boolean)
    .join(" · ");
});

function inTimeRange(tournament: NormalizedTournament) {
  if (filters.time === "all") return true;

  const now = Date.now();
  if (filters.time === "past7") return tournament.startMs >= now - 7 * DAY_MS;
  if (filters.time === "prev7") {
    return tournament.startMs < now - 7 * DAY_MS && tournament.startMs >= now - 14 * DAY_MS;
  }
  if (filters.time === "past4w") return tournament.startMs >= now - 28 * DAY_MS;

  if (String(filters.time).startsWith("month:")) {
    const ym = String(filters.time).slice("month:".length);
    const [yearText, monthText] = ym.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return true;
    const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
    return tournament.startMs >= start && tournament.startMs < end;
  }

  return true;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, Math.min(limit, queue.length)) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.allSettled(workers);
}

async function ensureTournamentDataForIds(ids: string[]) {
  const standingsMissing = ids.filter((id) => !hasStandings(id) && !standingsLoading[id]);
  const pairingsMissing = ids.filter((id) => !hasPairings(id) && !pairingsLoading[id]);

  await runWithConcurrency(standingsMissing, 4, async (id) => {
    standingsLoading[id] = true;
    try {
      const rows = await fetchJson<StandingRow[]>(standingsUrl(id));
      standingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      standingsCache[id] = [];
    } finally {
      standingsLoading[id] = false;
    }
  });

  await runWithConcurrency(pairingsMissing, 4, async (id) => {
    pairingsLoading[id] = true;
    try {
      const rows = await fetchJson<PairingRow[]>(pairingsUrl(id));
      pairingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      pairingsCache[id] = [];
    } finally {
      pairingsLoading[id] = false;
    }
  });
}

async function ensureSwissForIds(ids: string[]) {
  const missing = ids.filter((id) => !hasDetails(id) && !detailsLoading[id]);

  await runWithConcurrency(missing, 4, async (id) => {
    detailsLoading[id] = true;
    try {
      const details = await fetchJson<Record<string, any>>(detailsUrl(id));
      detailsCache[id] = details ?? null;
    } catch {
      detailsCache[id] = null;
    } finally {
      detailsLoading[id] = false;
    }
  });

  if (ids.length === 0) return;
  const idSet = new Set(ids);
  tournaments.value = tournaments.value.map((tournament) => {
    if (!idSet.has(tournament.id)) return tournament;
    const swiss =
      normalizeSwissValue(tournament.swiss) ??
      swissLabelFromDetails(detailsCache[tournament.id]);
    return { ...tournament, swiss };
  });
}

function normalizeStringArray(value: unknown): string[] {
  const input = Array.isArray(value) ? value : value == null ? [] : [value];
  const mapped = input
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const hit = (item as any).src ?? (item as any).url ?? (item as any).path ?? (item as any).name ?? "";
        return String(hit).trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
  return [...new Set(mapped)];
}

function isInvalidDeckToken(value: string) {
  const s = String(value ?? "").trim().toLowerCase();
  return !s || ["unknown", "undefined", "null", "none", "nan"].includes(s);
}

function cleanDeckText(value: string) {
  return isInvalidDeckToken(value) ? "" : String(value).trim();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const tierPanelDownloadLabel = computed(() => {
  return locale.value === "en" ? "Download PNG" : "\u4e0b\u8f09 PNG";
});

const tierPanelDownloadingLabel = computed(() => {
  return locale.value === "en" ? "Downloading..." : "\u4e0b\u8f09\u4e2d...";
});

async function waitForTierPanelImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          img.removeEventListener("load", finish);
          img.removeEventListener("error", finish);
          resolve();
        };

        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 2000);
      });
    }),
  );
}

async function downloadTierPanelPng() {
  if (downloadingTierPanel.value || !tierPanelCaptureRef.value || tierPanelDeckCount.value === 0) return;

  downloadingTierPanel.value = true;

  try {
    await nextTick();
    await waitForTierPanelImages(tierPanelCaptureRef.value);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(tierPanelCaptureRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      filter: (node) => {
        return !(node instanceof HTMLElement && node.dataset.exportIgnore === "true");
      },
    });

    const setSegment = filters.set || currentVersionWindow.value?.code || "all-sets";
    const timeSegment = filters.time || "all-time";
    const topCutSegment = filters.topCut === "all" ? "all" : `top-${filters.topCut}`;
    const fileName =
      slugify(`tier-list-${timeSegment}-${setSegment}-${topCutSegment}`) || "tier-list-top10";

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
  } catch (error) {
    console.error("[TierList] downloadTierPanelPng failed:", error);
  } finally {
    downloadingTierPanel.value = false;
  }
}

function humanizeDeckId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (/^[ab]\d+[a-z]?$/i.test(part)) return part.toUpperCase();
      if (lower === "ex") return "ex";
      if (lower === "gx") return "GX";
      if (lower === "vstar") return "VSTAR";
      if (lower === "vmax") return "VMAX";
      if (lower === "mega") return "Mega";
      if (lower === "x" || lower === "y") return lower.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function parseTwoFromDeckId(deckId?: string) {
  if (!deckId) return [];
  const tokens = String(deckId).toLowerCase().split("-").filter(Boolean);
  const mons: string[] = [];
  let cur: string[] = [];

  for (const t of tokens) {
    if (isSetToken(t)) {
      if (cur.length) mons.push(cur.join("-"));
      cur = [];
      continue;
    }
    cur.push(t);
  }
  if (cur.length) mons.push(cur.join("-"));
  return mons.slice(0, 2);
}

function parseTwoFromDeckName(deckName?: string) {
  if (!deckName) return [];
  const s = String(deckName).trim();
  const re = /\bex\b/gi;
  const hits: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(s)) && hits.length < 2) hits.push(m.index + m[0].length);
  if (hits.length < 2) return s ? [s] : [];

  const firstEnd = hits[0];
  const secondEnd = hits[1];
  const part1 = s.slice(0, firstEnd).trim();
  const part2 = s.slice(firstEnd, secondEnd).trim();
  return [part1, part2].filter(Boolean);
}

function extractDeckIconKeys(row: StandingRow) {
  const deck = row?.deck ?? {};
  const direct = normalizeStringArray(
    deck?.icons ?? deck?.icon ?? deck?.pokemon ?? deck?.pokemons ?? deck?.iconKeys ?? row?.deckIconKeys,
  );
  if (direct.length > 0) return direct.slice(0, 2);

  const main =
    deck?.primaryIconKey ??
    deck?.mainIconKey ??
    row?.deckIconKeyMain ??
    row?.primaryIconKey ??
    row?.mainIconKey ??
    deck?.mainPokemon ??
    deck?.main;

  const sub =
    deck?.secondaryIconKey ??
    deck?.subIconKey ??
    row?.deckIconKeySub ??
    row?.secondaryIconKey ??
    row?.subIconKey ??
    deck?.subPokemon ??
    deck?.sub;

  const paired = normalizeStringArray([main, sub]);
  if (paired.length > 0) return paired.slice(0, 2);

  const fromId = parseTwoFromDeckId(String(deck?.id ?? ""));
  if (fromId.length > 0) return fromId.slice(0, 2);

  const fromName = parseTwoFromDeckName(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  return fromName.slice(0, 2);
}

function buildDeckIdentity(row: StandingRow): DeckIdentity | null {
  const deck = row?.deck ?? {};
  const rawName = cleanDeckText(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  const rawId = cleanDeckText(String(deck?.id ?? ""));
  const iconKeys = extractDeckIconKeys(row);
  const key = rawId || slugify(rawName) || slugify(iconKeys.join("-"));

  if (!key || isInvalidDeckToken(key)) return null;
  return { key, rawName: rawName || humanizeDeckId(key), iconKeys };
}

function getPlace(row: StandingRow): number | null {
  const value = Number(row?.placing);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function pointsForPlace(place: number | null) {
  if (place == null) return 0;
  if (place === 1) return 10;
  if (place === 2) return 8;
  if (place >= 3 && place <= 4) return 6;
  if (place >= 5 && place <= 8) return 4;
  if (place >= 9 && place <= 16) return 2;
  if (place >= 17 && place <= 32) return 1;
  return 0;
}

type TopCutValueLocal = typeof filters.topCut;

function qualifiesByTopCut(place: number | null, cut: TopCutValueLocal) {
  if (cut === "all") return true;
  if (place == null) return false;
  return place <= Number(cut);
}

function mapNumberRecord(input: Record<string, number>, fn: (value: number) => number) {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) out[key] = fn(value);
  return out;
}

function minmaxScale(input: Record<string, number>) {
  const entries = Object.entries(input);
  if (entries.length === 0) return {};
  const values = entries.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    const fill = entries.length === 1 ? 1 : 0;
    return Object.fromEntries(entries.map(([key]) => [key, fill]));
  }

  return Object.fromEntries(entries.map(([key, value]) => [key, (value - min) / (max - min)]));
}

function tierLabel(score: number, nextScoreGap: number, isLeader: boolean) {
  return resolveDeckTier(score, nextScoreGap, isLeader);
}

function uniqStrings(list: string[]) {
  return [...new Set(list)];
}

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const deckIconSrcBySlug = new Map<string, string>();

function normalizeIconLookupKey(raw: string) {
  let text = String(raw ?? "").trim();
  if (!text) return "";
  text = text.split("?")[0]?.split("#")[0] ?? text;
  text = text.replace(/\\/g, "/");
  text = text.split("/").pop() ?? text;
  text = text.replace(/\.[a-z0-9]+$/i, "");
  text = text.replace(/_/g, "-");
  return slugify(text);
}

function rawIconVariants(raw: string) {
  const first = normalizeIconLookupKey(raw);
  if (!first) return [];

  const queue = [first];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (key.startsWith("mega-")) queue.push(`${key.slice(5)}-mega`);
    if (key.endsWith("-mega")) queue.push(`mega-${key.slice(0, -5)}`);
    if (key.endsWith("-ex")) queue.push(key.slice(0, -3));
    if (key.endsWith("-gx")) queue.push(key.slice(0, -3));
    if (key.endsWith("-v")) queue.push(key.slice(0, -2));
  }

  return [...seen];
}

for (const [filePath, url] of Object.entries(deckIconModules)) {
  const fileName = filePath.split("/").pop() ?? "";

  for (const key of rawIconVariants(fileName)) {
    if (!deckIconSrcBySlug.has(key)) {
      deckIconSrcBySlug.set(key, url);
    }
  }
}

function resolveDeckSpriteUrlsFromIconKeys(iconKeys: string[]) {
  const urls: string[] = [];

  for (const iconKey of iconKeys ?? []) {
    if (/^https?:\/\//i.test(String(iconKey))) {
      urls.push(String(iconKey));
      continue;
    }

    const candidates = rawIconVariants(String(iconKey));
    let resolved = false;

    for (const cand of candidates) {
      const hit = deckIconSrcBySlug.get(cand);
      if (hit) {
        urls.push(hit);
        resolved = true;
        break;
      }
    }

    if (!resolved) {
      urls.push(substituteIcon);
    }
  }

  return uniqStrings(urls).slice(0, 2);
}

const recomputeToken = { tier: 0, heat: 0 };

function tournamentMatchesCurrentFilters(tournament: NormalizedTournament) {
  if (filters.minPlayers != null && Number.isFinite(filters.minPlayers)) {
    if ((tournament.players ?? 0) < filters.minPlayers) return false;
  }

  if (!inTimeRange(tournament)) return false;
  if (filters.set && tournament.versionCode !== filters.set) return false;
  return true;
}

async function filteredTournamentsForCurrentFilters() {
  return tournaments.value.filter(tournamentMatchesCurrentFilters);
}

async function filteredTournamentsForMatrixScope() {
  const versionCode = matrixVersionCode.value;
  return tournaments.value.filter((tournament) => {
    if (!versionCode) return true;
    return tournament.versionCode === versionCode;
  });
}

async function recomputeTierRows() {
  const token = ++recomputeToken.tier;
  const scopedTournaments = await filteredTournamentsForCurrentFilters();
  const ids = scopedTournaments.map((tournament) => tournament.id);
  const tournamentById = new Map(scopedTournaments.map((tournament) => [tournament.id, tournament]));
  const precomputedScope = activePrecomputedTierScope.value;

  if (meta.value) {
    meta.value = {
      ...meta.value,
      days_back:
        filters.time === "past7" ? 7 : filters.time === "prev7" ? 14 : filters.time === "past4w" ? 28 : 0,
      min_players: filters.minPlayers ?? 0,
      tournaments_count: scopedTournaments.length,
    };
  }

  if (precomputedScope) {
    tierRows.value = precomputedScope.rows.slice(0, 2000).map(tierRowFromPrecomputed);
    return;
  }

  if (!ids.length) {
    tierRows.value = [];
    return;
  }

  await runWithConcurrency(
    ids.filter((id) => !hasStandings(id) && !standingsLoading[id]),
    4,
    async (id) => {
      standingsLoading[id] = true;
      try {
        const rows = await fetchJson<StandingRow[]>(standingsUrl(id));
        standingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        standingsCache[id] = [];
      } finally {
        standingsLoading[id] = false;
      }
    },
  );

  const deckMap = new Map<string, DeckAggregate>();
  const emaRecords: TierEmaInput[] = [];
  let totalBaselineTop32Samples = 0;
  let totalAllSamples = 0;

  for (const tid of ids) {
    const standings = standingsCache[tid];
    const tournament = tournamentById.get(tid);
    if (!Array.isArray(standings)) continue;

    for (const row of standings) {
      const deck = buildDeckIdentity(row);
      if (!deck) continue;

      const place = getPlace(row);
      if (!qualifiesByTopCut(place, filters.topCut)) continue;
      let hit = deckMap.get(deck.key);

      if (!hit) {
        hit = {
          key: deck.key,
          rawName: deck.rawName,
          iconKeys: deck.iconKeys,
          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,
        };
        deckMap.set(deck.key, hit);
      } else if (hit.iconKeys.length < deck.iconKeys.length) {
        hit.iconKeys = deck.iconKeys;
      }

      hit.allSamples += 1;
      totalAllSamples += 1;

      if (place != null && place <= 32) {
        hit.baselineTop32Samples += 1;
        totalBaselineTop32Samples += 1;
        const weightedPoints = pointsForPlace(place);
        hit.weightedPoints += weightedPoints;

        if (tournament?.startMs) {
          emaRecords.push({
            dayMs: startOfUtcDayMs(tournament.startMs),
            deckKey: deck.key,
            top32Count: 1,
            weightedPoints,
          });
        }
      }
    }
  }

  if (token !== recomputeToken.tier) return;

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of deckMap.values()) {
    data1[item.key] = item.baselineTop32Samples;
    data2[item.key] = item.weightedPoints;
    data3[item.key] =
      totalBaselineTop32Samples > 0 ? (item.baselineTop32Samples / totalBaselineTop32Samples) * 100 : 0;
  }
  const data4 = buildTierEmaScores(deckMap.keys(), emaRecords);

  const log1 = mapNumberRecord(data1, (value) => Math.log1p(value));
  const log2 = mapNumberRecord(data2, (value) => Math.log1p(value));
  const log3 = mapNumberRecord(data3, (value) => Math.log1p(value));

  const std1 = minmaxScale(log1);
  const std2 = minmaxScale(log2);
  const std3 = minmaxScale(log3);
  const std4 = minmaxScale(data4);

  const baseRows = Array.from(deckMap.values()).map((item) => {
    const top32SharePct = data3[item.key] ?? 0;
    const score = calculateTierScore({
      top32: std1[item.key] ?? 0,
      weightedPoints: std2[item.key] ?? 0,
      top32Share: std3[item.key] ?? 0,
      emaTrend: std4[item.key] ?? 0,
    });

    return {
      deck: item.key,
      tier: "F",
      score,
      raw_name: item.rawName,
      iconKeys: item.iconKeys,
      spriteUrls: resolveDeckSpriteUrlsFromIconKeys(item.iconKeys),
      usage: totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0,
      total_samples: item.allSamples,
      data1_top32_appearances: item.baselineTop32Samples,
      data2_weighted_points: item.weightedPoints,
      data3_top32_share_pct: top32SharePct,
      data4_ema_score: data4[item.key] ?? 0,
    } satisfies TierRow;
  });

  baseRows.sort((a, b) => {
    return (
      b.score - a.score ||
      b.data2_weighted_points - a.data2_weighted_points ||
      b.data1_top32_appearances - a.data1_top32_appearances ||
      b.total_samples - a.total_samples
    );
  });

  const finalized = baseRows.map((row, index, arr) => {
    const nextScore = arr[index + 1]?.score ?? null;
    const nextScoreGap = nextScore == null ? row.score : row.score - nextScore;
    const tier = tierLabel(row.score, nextScoreGap, index === 0);
    return { ...row, tier };
  });

  tierRows.value = finalized.slice(0, 2000);
}

function computeMatrixTierRowsFromCachedStandings(scopedTournaments: NormalizedTournament[]) {
  const deckMap = new Map<string, DeckAggregate>();
  const emaRecords: TierEmaInput[] = [];
  let totalBaselineTop32Samples = 0;
  let totalAllSamples = 0;

  for (const tournament of scopedTournaments) {
    const standings = standingsCache[tournament.id];
    if (!Array.isArray(standings)) continue;

    for (const row of standings) {
      const deck = buildDeckIdentity(row);
      if (!deck) continue;

      const place = getPlace(row);
      let hit = deckMap.get(deck.key);

      if (!hit) {
        hit = {
          key: deck.key,
          rawName: deck.rawName,
          iconKeys: deck.iconKeys,
          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,
        };
        deckMap.set(deck.key, hit);
      } else if (hit.iconKeys.length < deck.iconKeys.length) {
        hit.iconKeys = deck.iconKeys;
      }

      hit.allSamples += 1;
      totalAllSamples += 1;

      if (place != null && place <= 32) {
        hit.baselineTop32Samples += 1;
        totalBaselineTop32Samples += 1;
        const weightedPoints = pointsForPlace(place);
        hit.weightedPoints += weightedPoints;

        emaRecords.push({
          dayMs: startOfUtcDayMs(tournament.startMs),
          deckKey: deck.key,
          top32Count: 1,
          weightedPoints,
        });
      }
    }
  }

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of deckMap.values()) {
    data1[item.key] = item.baselineTop32Samples;
    data2[item.key] = item.weightedPoints;
    data3[item.key] =
      totalBaselineTop32Samples > 0 ? (item.baselineTop32Samples / totalBaselineTop32Samples) * 100 : 0;
  }
  const data4 = buildTierEmaScores(deckMap.keys(), emaRecords);

  const log1 = mapNumberRecord(data1, (value) => Math.log1p(value));
  const log2 = mapNumberRecord(data2, (value) => Math.log1p(value));
  const log3 = mapNumberRecord(data3, (value) => Math.log1p(value));

  const std1 = minmaxScale(log1);
  const std2 = minmaxScale(log2);
  const std3 = minmaxScale(log3);
  const std4 = minmaxScale(data4);

  const baseRows = Array.from(deckMap.values()).map((item) => {
    const top32SharePct = data3[item.key] ?? 0;
    const score = calculateTierScore({
      top32: std1[item.key] ?? 0,
      weightedPoints: std2[item.key] ?? 0,
      top32Share: std3[item.key] ?? 0,
      emaTrend: std4[item.key] ?? 0,
    });

    return {
      deck: item.key,
      tier: "F",
      score,
      raw_name: item.rawName,
      iconKeys: item.iconKeys,
      spriteUrls: resolveDeckSpriteUrlsFromIconKeys(item.iconKeys),
      usage: totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0,
      total_samples: item.allSamples,
      data1_top32_appearances: item.baselineTop32Samples,
      data2_weighted_points: item.weightedPoints,
      data3_top32_share_pct: top32SharePct,
      data4_ema_score: data4[item.key] ?? 0,
    } satisfies TierRow;
  });

  baseRows.sort((a, b) => {
    return (
      b.score - a.score ||
      b.data2_weighted_points - a.data2_weighted_points ||
      b.data1_top32_appearances - a.data1_top32_appearances ||
      b.total_samples - a.total_samples
    );
  });

  return baseRows.map((row, index, arr) => {
    const nextScore = arr[index + 1]?.score ?? null;
    const nextScoreGap = nextScore == null ? row.score : row.score - nextScore;
    const tier = tierLabel(row.score, nextScoreGap, index === 0);
    return { ...row, tier };
  });
}

async function recomputeHeatmapForTopCut() {
  const token = ++recomputeToken.heat;
  const precomputedScope = activePrecomputedMatrixScope.value;

  if (!matrixAxisRows.value.some((row) => row !== null)) {
    matchupMap.value = new Map();
    return;
  }

  if (precomputedScope) {
    const map = new Map<string, MatchupRecord>();
    const coveredDecks = new Set<string>();
    for (const item of precomputedScope.matchups ?? []) {
      coveredDecks.add(item.deckA);
      coveredDecks.add(item.deckB);
      map.set(`${item.deckA}__${item.deckB}`, {
        deckA: item.deckA,
        deckB: item.deckB,
        winsA: Number(item.winsA ?? 0),
        lossesA: Number(item.lossesA ?? 0),
        ties: Number(item.ties ?? 0),
        total: Number(item.total ?? 0),
        winrateA: Number(item.winrateA ?? 0),
      });
    }

    const missingAxisDeck = matrixAxisRows.value.some((row) => row?.deck && !coveredDecks.has(row.deck));
    const selectedDeck = matrixSelectedDeckRow.value?.deck ?? "";
    const hasSelectedMatchups = hasVisibleSelectedMatchups(map, selectedDeck);
    if (!missingAxisDeck && (!selectedDeck || (coveredDecks.has(selectedDeck) && hasSelectedMatchups))) {
      rawMatrixTierRows.value = [];
      matchupMap.value = map;
      return;
    }
  }

  const matrixTournaments = await filteredTournamentsForMatrixScope();
  const ids = matrixTournaments.map((tournament) => tournament.id);
  await ensureTournamentDataForIds(ids);
  rawMatrixTierRows.value = computeMatrixTierRowsFromCachedStandings(matrixTournaments).slice(0, 2000);

  const pairMap = new Map<string, { wins: number; losses: number; ties: number }>();

  for (const tid of ids) {
    const standings = standingsCache[tid];
    const pairings = pairingsCache[tid];
    if (!Array.isArray(standings) || !Array.isArray(pairings)) continue;

    const standingLookup = buildStandingLookup(standings, (standingRow) => {
      const deck = buildDeckIdentity(standingRow);
      if (!deck) return null;
      return { key: deck.key };
    });

    for (const match of pairings) {
      const side1 = lookupStandingForPairingSide(standingLookup, match, 1);
      const side2 = lookupStandingForPairingSide(standingLookup, match, 2);
      if (!side1 || !side2) continue;

      const result = parsePairingResult(match, side1.player, side2.player);
      if (!result) continue;

      const deck1 = side1.deck.key;
      const deck2 = side2.deck.key;

      if (qualifiesByTopCut(side1.place, "all")) {
        const key = `${deck1}__${deck2}`;
        const rec = pairMap.get(key) ?? { wins: 0, losses: 0, ties: 0 };
        if (result.p1 === 1) rec.wins += 1;
        else if (result.p1 === 0) rec.losses += 1;
        else rec.ties += 1;
        pairMap.set(key, rec);
      }

      if (qualifiesByTopCut(side2.place, "all")) {
        const key = `${deck2}__${deck1}`;
        const rec = pairMap.get(key) ?? { wins: 0, losses: 0, ties: 0 };
        if (result.p2 === 1) rec.wins += 1;
        else if (result.p2 === 0) rec.losses += 1;
        else rec.ties += 1;
        pairMap.set(key, rec);
      }
    }
  }

  if (token !== recomputeToken.heat) return;

  const map = new Map<string, MatchupRecord>();
  for (const [key, value] of pairMap.entries()) {
    const total = value.wins + value.losses + value.ties;
    const winrateA = total > 0 ? (value.wins + value.ties * 0.5) / total : 0;

    const parts = key.split("__");
    const deckA = parts[0] ?? "";
    const deckB = parts[1] ?? "";

    if (!deckA || !deckB) continue;

    map.set(key, {
      deckA,
      deckB,
      winsA: value.wins,
      lossesA: value.losses,
      ties: value.ties,
      total,
      winrateA,
    });
  }

  matchupMap.value = map;
}

async function loadTournaments() {
  if (loadingTournaments.value) return;

  loadingTournaments.value = true;
  tournamentsError.value = "";

  try {
    const rows = await fetchJson<TournamentListItem[]>(tournamentsUrl());
    const normalized = Array.isArray(rows)
      ? rows
          .map((r): NormalizedTournament | null => {
            const startMs = parseMs(r.date);
            if (!Number.isFinite(startMs)) return null;
            const versionCode = inferVersionByStartMs(startMs)?.code ?? "";
            return {
              ...r,
              startMs,
              versionCode,
              swiss: normalizeSwissValue(r.swiss),
            };
          })
          .filter((r): r is NormalizedTournament => r !== null)
          .sort((a, b) => b.startMs - a.startMs)
      : [];

    tournaments.value = normalized;
    if (!filters.set && currentVersionWindow.value?.code) {
      filters.set = currentVersionWindow.value.code;
    }
    meta.value = {
      generated_at: new Date().toISOString(),
      days_back:
        filters.time === "past7" ? 7 : filters.time === "prev7" ? 14 : filters.time === "past4w" ? 28 : 0,
      min_players: filters.minPlayers ?? 0,
      usage_threshold: 0,
      tournaments_count: normalized.length,
    };
  } catch (e: any) {
    tournamentsError.value = e?.message ?? "Failed to load tournaments";
    tournaments.value = [];
  } finally {
    loadingTournaments.value = false;
  }
}

watch(
  () => [filters.minPlayers ?? "", filters.time, filters.set].join("|"),
  async () => {
    heatLoading.value = true;
    await recomputeTierRows();
    await recomputeHeatmapForTopCut();
    heatLoading.value = false;
  },
);

watch(
  () => filters.topCut,
  async () => {
    heatLoading.value = true;
    await recomputeTierRows();
    await recomputeHeatmapForTopCut();
    heatLoading.value = false;
  },
);

watch(matrixExtraDeck, (deckKey) => {
  persistMatrixExtraDeckPreference(deckKey);
});

watch(
  () => matrixOptionRows.value.map((row) => row.deck).join("|"),
  () => {
    if (matrixExtraDeck.value && !matrixOptionRows.value.some((row) => row.deck === matrixExtraDeck.value)) {
      matrixExtraDeck.value = "";
    }
  },
);

watch(
  () => matrixSearchResults.value.length,
  (count) => {
    if (count === 0) {
      matrixSearchActiveIndex.value = 0;
      return;
    }
    if (matrixSearchActiveIndex.value >= count) {
      matrixSearchActiveIndex.value = count - 1;
    }
  },
);

watch(contentTransitionKey, () => {
  clearHoveredHeatCell();
  void nextTick(() => {
    scheduleEvRailUpdate();
    scheduleMatrixSizingUpdate();
  });
});

watch(
  () => matrixAxisRows.value.map((row) => row?.deck ?? "").join("|"),
  () => {
    void nextTick(scheduleMatrixSizingUpdate);
  },
);

watch(heatmapWorkspaceRef, () => {
  void nextTick(bindMatrixResizeObserver);
});

function onEvRailViewportChange() {
  scheduleEvRailUpdate();
}

onMounted(() => {
  if (typeof window === "undefined") return;

  void nextTick(() => {
    updateActiveEvSection();
    window.addEventListener("scroll", onEvRailViewportChange, { passive: true });
    window.addEventListener("resize", onEvRailViewportChange);
    window.addEventListener("resize", onMatrixViewportChange);
    window.addEventListener("scroll", onMatchupViewportChange, { passive: true });
    window.addEventListener("resize", onMatchupViewportChange);
    bindMatrixResizeObserver();
  });
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;

  window.removeEventListener("scroll", onEvRailViewportChange);
  window.removeEventListener("resize", onEvRailViewportChange);
  window.removeEventListener("resize", onMatrixViewportChange);
  window.removeEventListener("scroll", onMatchupViewportChange);
  window.removeEventListener("resize", onMatchupViewportChange);
  window.clearTimeout(evRailPressTimer);
  if (evRailRaf) {
    window.cancelAnimationFrame(evRailRaf);
    evRailRaf = 0;
  }
  if (matrixSizingRaf) {
    window.cancelAnimationFrame(matrixSizingRaf);
    matrixSizingRaf = 0;
  }
  matrixResizeObserver?.disconnect();
  matrixResizeObserver = null;
  if (matchupTooltipRaf) {
    window.cancelAnimationFrame(matchupTooltipRaf);
    matchupTooltipRaf = 0;
  }
  clearMatrixSearchCloseTimer();
});

onMounted(async () => {
  await loadPrecomputedTopDecksForTierList();
  await loadTournaments();
  await nextTick();
  bindMatrixResizeObserver();
  heatLoading.value = true;
  await recomputeTierRows();
  restoreMatrixExtraDeckPreference();
  if (matrixExtraDeck.value && !matrixOptionRows.value.some((row) => row.deck === matrixExtraDeck.value)) {
    matrixExtraDeck.value = "";
    persistMatrixExtraDeckPreference("");
  }
  await recomputeHeatmapForTopCut();
  heatLoading.value = false;
  await nextTick();
  scheduleMatrixSizingUpdate();
});
</script>

<style scoped>
.tierlist-page {
  color: rgba(255, 255, 255, 0.92);
  width: 100%;
  max-width: none;
  margin: 0;
  overflow-x: clip;
  overflow-y: visible;
}

.tier-ev-section {
  scroll-margin-top: 122px;
}

.tier-ev-rail {
  position: fixed;
  top: 112px;
  bottom: 76px;
  left: clamp(14px, 1.45vw, 28px);
  z-index: 22;
  width: 62px;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  padding: 18px 0;
  pointer-events: auto;
}

.tier-ev-rail::before,
.tier-ev-rail::after {
  content: "";
  position: absolute;
  top: 24px;
  bottom: 24px;
  left: 6px;
  width: 1px;
  pointer-events: none;
}

.tier-ev-rail::before {
  background: linear-gradient(
    180deg,
    transparent,
    rgba(148, 163, 184, 0.22) 12%,
    rgba(148, 163, 184, 0.22) 88%,
    transparent
  );
}

.tier-ev-rail::after {
  background: linear-gradient(180deg, rgba(77, 163, 255, 0.18), #4da3ff);
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.38);
  transform-origin: top center;
  transform: scaleY(var(--ev-progress, 0));
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.tier-ev-rail__item {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 0 0 0 0;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  text-align: left;
  transform-origin: 0 0;
  transition:
    color 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.tier-ev-rail__item:hover {
  color: #a8b3c7;
  transform: translateX(3px);
}

.tier-ev-rail__item--pressed {
  transform: translateX(4px) scale(1.015);
}

.tier-ev-rail__dot {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  margin-top: 3px;
  border: 1px solid rgba(100, 116, 139, 0.92);
  border-radius: 999px;
  background: #02040a;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.tier-ev-rail__label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
}

.tier-ev-rail__item:hover .tier-ev-rail__dot {
  border-color: rgba(77, 163, 255, 0.8);
  box-shadow: 0 0 12px rgba(77, 163, 255, 0.34);
}

.tier-ev-rail__item--active {
  color: #4da3ff;
}

.tier-ev-rail__item--active .tier-ev-rail__dot {
  border-color: #4da3ff;
  background: #4da3ff;
  box-shadow:
    0 0 0 1px rgba(77, 163, 255, 0.26),
    0 0 16px rgba(77, 163, 255, 0.52);
  animation: tier-ev-dot-pulse 3.4s ease-in-out infinite;
}

@keyframes tier-ev-dot-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(77, 163, 255, 0.24),
      0 0 12px rgba(77, 163, 255, 0.36);
  }

  50% {
    box-shadow:
      0 0 0 3px rgba(77, 163, 255, 0.09),
      0 0 20px rgba(77, 163, 255, 0.5);
  }
}

.tierlist-layout {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(280px, 18vw, 320px);
  align-items: start;
  gap: clamp(24px, 2.5vw, 44px);
  overflow: visible;
}

.tierlist-main {
  min-width: 0;
  overflow: visible;
}

.tierlist-content-motion {
  min-width: 0;
}

.tierlist-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: clamp(16px, 2vw, 28px);
  margin: 0 0 clamp(18px, 2.4vw, 34px);
  padding-top: clamp(72px, 8vh, 120px);
  scroll-margin-top: 132px;
}

.tierlist-header::before {
  content: none;
}

.tierlist-header__copy {
  min-width: 0;
}

.page-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(72px, 7vw, 148px);
  font-style: italic;
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.78;
}

.tierlist-hero-title em {
  font: inherit;
  color: var(--accent);
  margin-left: 0.48em;
  text-shadow: 0 0 28px rgba(77, 163, 255, 0.22);
}

.tierlist-hero-description {
  max-width: 760px;
  margin: clamp(30px, 3.2vw, 52px) 0 0;
}

.page-subtitle {
  margin: 12px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  font-weight: 500;
}

.page-error {
  margin: 10px 0 0;
  color: #ff9ea8;
  font-size: 0.95rem;
}

.mono {
  font-variant-numeric: tabular-nums;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
}

.subtle {
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
}

.filter-drawer-trigger {
  display: none;
  min-width: min(260px, 100%);
  text-align: left;
  border: 1px solid var(--border);
  border-left-color: var(--border-accent);
  border-radius: 0;
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 58%),
    rgba(5, 10, 20, 0.94);
  color: var(--text);
  padding: 12px 14px;
  cursor: pointer;
}

.filter-drawer-trigger__eyebrow {
  display: block;
  color: var(--accent);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.filter-drawer-trigger strong {
  display: block;
  margin-top: 5px;
  min-width: 0;
  color: var(--text);
  font-size: 14px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-drawer-trigger small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.filter-sidebar {
  position: sticky;
  top: 112px;
  align-self: start;
  width: 100%;
  min-width: 0;
  overflow: visible;
  z-index: 10;
}

.filter-sidebar__sticky {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.filter-panel {
  position: relative;
  display: grid;
  gap: 12px;
  max-height: none;
  overflow: visible;
  border: 1px solid var(--border);
  border-left: 1px solid var(--border-accent);
  border-radius: 0;
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 46%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.045), transparent 58%),
    rgba(5, 10, 20, 0.96);
  box-shadow:
    0 0 26px rgba(77, 163, 255, 0.12),
    inset 0 1px 0 rgba(248, 250, 252, 0.05);
  padding: 14px;
}

.filter-panel::before,
.filter-panel::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}

.filter-panel::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.filter-panel::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.filter-panel--sticky {
  min-height: 0;
  max-height: none;
  overflow: visible;
}

.creator-materials-panel {
  position: relative;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border);
  border-left-color: rgba(77, 163, 255, 0.74);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 54%),
    rgba(5, 10, 20, 0.94);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.04);
}

.creator-materials-panel::before,
.creator-materials-panel::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  pointer-events: none;
}

.creator-materials-panel::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.creator-materials-panel::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
  opacity: 0.72;
}

.creator-materials-panel--mobile {
  display: none;
  margin-bottom: clamp(16px, 2vw, 24px);
}

.creator-materials-panel__eyebrow {
  color: var(--accent);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.creator-materials-panel h2 {
  margin: 0;
  color: var(--text);
  font-size: clamp(17px, 1.15vw, 21px);
  font-weight: 900;
  line-height: 1.1;
}

.creator-materials-panel__actions {
  display: grid;
  gap: 8px;
}

.creator-materials-button {
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: rgba(3, 8, 18, 0.82);
  color: var(--text);
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--dur-fast, 160ms) ease,
    background-color var(--dur-fast, 160ms) ease,
    box-shadow var(--dur-fast, 160ms) ease,
    color var(--dur-fast, 160ms) ease;
}

.creator-materials-button--primary {
  border-color: var(--border-accent);
  background: var(--accent);
  color: #02040a;
}

.creator-materials-button:hover:not(:disabled),
.creator-materials-button:focus-visible {
  border-color: rgba(77, 163, 255, 0.78);
  background: rgba(77, 163, 255, 0.16);
  box-shadow: 0 0 18px rgba(77, 163, 255, 0.18);
  color: #fff;
  outline: none;
}

.creator-materials-button--primary:hover:not(:disabled),
.creator-materials-button--primary:focus-visible {
  background: var(--accent-primary-soft);
  color: #02040a;
}

.creator-materials-button:disabled {
  cursor: wait;
  opacity: 0.68;
}

.tierlistCreatorMount {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 1440px;
  min-height: 100vh;
  pointer-events: none;
}

.filter-panel__header {
  min-width: 0;
  display: grid;
  gap: 5px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
}

.filter-panel__header--drawer {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.filter-panel__eyebrow {
  color: var(--accent-blue);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.filter-panel h2 {
  margin: 0;
  color: var(--text);
  font-size: clamp(18px, 1.3vw, 22px);
  font-weight: 900;
  line-height: 1.1;
}

.filter-panel p {
  margin: 0;
  color: var(--text-soft);
  font-size: 11px;
  line-height: 1.45;
}

.filter-summary {
  display: grid;
  gap: 0;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(5, 10, 20, 0.9);
}

.filter-summary__row {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
  min-height: 34px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.filter-summary__row:last-child {
  border-bottom: 0;
}

.filter-summary__label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.filter-summary__value {
  min-width: 0;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-scope-line {
  min-width: 0;
  margin: -4px 0 0;
  padding: 9px 10px;
  border: 1px solid rgba(77, 163, 255, 0.24);
  background: rgba(3, 7, 16, 0.72);
  color: var(--text-soft);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.f {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 0;
  background: rgba(5, 10, 20, 0.92);
  padding: 10px 12px;
}

.f label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-soft);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.f input,
.f select {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border-radius: 0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 4, 10, 0.96);
  color: var(--text);
  padding: 9px 10px;
  outline: none;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.f input:focus,
.f select:focus {
  border-color: rgba(77, 163, 255, 0.68);
  box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.28);
}

.filter-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.filter-action {
  min-height: 42px;
  border-radius: 0;
  border: 1px solid var(--border);
  padding: 0 12px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.filter-action--secondary {
  background: rgba(2, 5, 12, 0.82);
  color: var(--text);
}

.filter-action--primary {
  border-color: var(--border-accent);
  background: var(--accent);
  color: #080a10;
}

.filter-action:hover {
  border-color: var(--accent);
  background: rgba(77, 163, 255, 0.18);
  color: var(--text);
}

.filter-drawer-shell {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: none;
}

.filter-drawer-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(2, 5, 12, 0.78);
  cursor: pointer;
}

.filter-panel--drawer {
  position: absolute;
  top: 84px;
  right: 18px;
  z-index: 1;
  width: min(420px, calc(100vw - 36px));
  max-height: calc(100dvh - 104px);
  overflow-y: auto;
  padding: 18px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.2);
}

.filter-close {
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 0;
  background: rgba(2, 5, 12, 0.82);
  color: var(--text);
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

@media (min-width: 1181px) {
  .filter-drawer-shell,
  .filter-drawer-backdrop {
    display: none !important;
  }
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(226, 232, 240, 0.58);
}

.tierlist-top-grid {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(16px, 2vw, 32px);
  align-items: start;
}

@media (max-width: 1080px) {
  .tierlist-top-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1180px) {
  .tier-ev-rail {
    left: 10px;
    width: 48px;
  }

  .tier-ev-rail__label {
    font-size: 8px;
    letter-spacing: 0.1em;
  }

  .tierlist-layout {
    grid-template-columns: 1fr;
  }

  .filter-sidebar {
    display: none;
  }

  .creator-materials-panel--mobile {
    display: grid;
  }

  .creator-materials-panel__actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-drawer-trigger {
    display: grid;
  }

  .filter-drawer-shell {
    display: block;
  }
}

.usage-card,
.score-card,
.tier-table-card,
.heatmap-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.35);
  border-radius: 12px;
  padding: clamp(14px, 1.4vw, 24px);
}

.section-title {
  margin: 0;
  font-size: clamp(16px, 1.15vw, 22px);
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.01em;
}

.usage-title-row,
.heatmap-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.usage-card {
  order: 2;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto;
  gap: clamp(12px, 1.2vw, 20px);
}

.score-card {
  order: 3;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto;
  gap: clamp(12px, 1.2vw, 20px);
}

.usage-card,
.score-card {
  border-radius: 0;
}

.usage-subtitle {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.usage-pie-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(460px, 0.9fr);
  align-items: center;
  justify-content: stretch;
  gap: clamp(32px, 5vw, 80px);
  min-height: clamp(440px, 46vw, 760px);
  max-width: none;
}

.usage-pie-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.usage-pie {
  width: min(clamp(320px, 42vw, 720px), 100%);
  height: auto;
  aspect-ratio: 1;
  position: relative;
  border-radius: 50% !important;
  overflow: visible;
  isolation: isolate;
  border: 1px solid rgba(148, 163, 184, 0.46);
  background:
    radial-gradient(circle at center, rgba(1, 2, 8, 0.98) 0 42%, transparent 43%),
    rgba(3, 7, 16, 0.94);
  box-shadow:
    0 0 34px rgba(77, 163, 255, 0.16),
    0 28px 80px rgba(0, 0, 0, 0.42),
    inset 0 0 0 2px rgba(3, 7, 18, 0.96),
    inset 0 0 0 3px rgba(148, 163, 184, 0.18);
  outline: none !important;
}

.usage-pie::before {
  content: "";
  position: absolute;
  inset: 27%;
  z-index: 1;
  border-radius: 50% !important;
  background:
    linear-gradient(180deg, rgba(5, 10, 20, 0.99), rgba(1, 2, 8, 0.99)),
    rgba(1, 2, 8, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: inset 0 0 0 1px rgba(3, 7, 18, 0.9);
}

#app .usage-pie {
  border-radius: 50% !important;
}

#app .usage-pie::before {
  border-radius: 50% !important;
}

.usage-donut {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform: rotate(-90deg);
  outline: none !important;
}

.usage-donut__track,
.usage-donut__slice-outline,
.usage-donut__slice {
  fill: none;
  stroke-linecap: butt;
  outline: none !important;
}

.usage-donut__track {
  stroke: rgba(3, 7, 18, 0.98);
  stroke-width: 22;
}

.usage-donut__segment {
  cursor: default;
  outline: none !important;
}

.usage-donut__slice-outline {
  pointer-events: none;
  stroke: #030712;
  stroke-width: 23;
  transition:
    stroke 0.18s ease,
    stroke-width 0.18s ease,
    opacity 0.18s ease;
}

.usage-donut__slice {
  cursor: default;
  opacity: 0.96;
  pointer-events: stroke;
  stroke-width: 17.5;
  transition:
    opacity 0.18s ease,
    stroke-width 0.18s ease;
}

.usage-donut__segment--active .usage-donut__slice-outline,
.usage-donut__segment:hover .usage-donut__slice-outline {
  stroke: #030712;
  stroke-width: 23.5;
  opacity: 1;
  filter: drop-shadow(0 0 7px rgba(77, 163, 255, 0.18));
}

.usage-donut__segment--active .usage-donut__slice,
.usage-donut__segment:hover .usage-donut__slice {
  opacity: 1;
  stroke-width: 19;
}

.usage-pie__center {
  position: absolute;
  inset: 28%;
  z-index: 2;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  text-align: center;
  min-width: 0;
  pointer-events: none;
}

.usage-pie__center strong {
  color: #f8fafc;
  font-size: clamp(42px, 5vw, 72px);
  font-weight: 950;
  line-height: 1;
  text-shadow: 0 0 18px rgba(77, 163, 255, 0.18);
}

.usage-pie__center span {
  max-width: min(260px, 86%);
  color: var(--text-soft);
  font-size: clamp(12px, 1vw, 16px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
}

.usage-pie__center-icons {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: clamp(34px, 3vw, 50px);
}

.usage-pie__center-icon {
  width: clamp(34px, 3vw, 48px);
  height: clamp(34px, 3vw, 48px);
  object-fit: contain;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.48));
}

.usage-pie__center-icon + .usage-pie__center-icon {
  margin-left: -5px;
}

.usage-overview-panel {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: clamp(20px, 2vw, 32px);
}

.usage-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.usage-summary__row {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 8px;
  min-height: clamp(82px, 6vw, 112px);
  padding: clamp(14px, 1.3vw, 20px);
  border: 1px solid rgba(148, 163, 184, 0.32);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 52%),
    rgba(5, 10, 20, 0.94);
}

.usage-summary__label {
  color: var(--text-soft);
  font-size: clamp(11px, 0.8vw, 13px);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.usage-summary__value {
  color: #f8fafc;
  font-size: clamp(32px, 2.8vw, 50px);
  font-weight: 950;
  line-height: 1;
}

.usage-pie-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  min-width: 0;
}

.usage-pie-legend__row {
  min-width: 0;
  display: grid;
  grid-template-columns: 18px minmax(44px, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 9px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  background: transparent;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
  outline: none !important;
}

.usage-pie-legend__row--active {
  border-color: rgba(77, 163, 255, 0.42);
  background: rgba(77, 163, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(77, 163, 255, 0.08);
}

.usage-pie-legend__row--other {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(100, 116, 139, 0.16);
}

.usage-pie-legend__swatch {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(3, 7, 18, 0.96);
  box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.16);
}

.usage-pie-legend__icons {
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  outline: none !important;
}

.usage-pie-legend__icons--static {
  cursor: default;
}

.usage-pie-legend__sprite {
  width: clamp(24px, 1.65vw, 30px);
  height: clamp(24px, 1.65vw, 30px);
  object-fit: contain;
  filter: drop-shadow(0 3px 7px rgba(0, 0, 0, 0.42));
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.usage-pie-legend__sprite + .usage-pie-legend__sprite {
  margin-left: -7px;
}

.usage-pie-legend__icons:hover .usage-pie-legend__sprite,
.usage-pie-legend__icons:focus-visible .usage-pie-legend__sprite {
  transform: translateY(-1px);
  filter: drop-shadow(0 5px 10px rgba(77, 163, 255, 0.24));
}

.usage-pie-legend__fallback {
  min-width: 28px;
  min-height: 24px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(8, 15, 28, 0.96);
  color: #f8fafc;
  font-size: 10px;
  font-weight: 900;
}

.usage-pie-legend__name {
  min-width: 0;
  color: #f8fafc;
  font-size: clamp(15px, 1.05vw, 18px);
  font-weight: 900;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.16s ease, text-shadow 0.16s ease;
  outline: none !important;
}

.usage-pie-legend__name:hover,
.usage-pie-legend__name:focus-visible {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-shadow: 0 0 14px rgba(77, 163, 255, 0.22);
}

.usage-pie-legend__name--static {
  cursor: default;
}

.usage-pie-legend__name--static:hover {
  color: #f8fafc;
  text-decoration: none;
  text-shadow: none;
}

.usage-pie-legend__value {
  color: #f8fafc;
  font-size: clamp(14px, 0.95vw, 17px);
  font-weight: 950;
}

.usage-list {
  display: grid;
  gap: clamp(8px, 0.6vw, 10px);
  align-content: start;
}

.score-list {
  gap: clamp(8px, 0.7vw, 12px);
}

.usage-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) minmax(220px, 0.62fr);
  gap: clamp(8px, 0.75vw, 10px);
  align-items: center;
  min-height: 56px;
  padding: 8px 10px;
  border-radius: 0;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(5, 10, 20, 0.9);
}

.score-row {
  position: relative;
  grid-template-columns: minmax(280px, min(32%, 400px)) minmax(0, 1fr);
  gap: clamp(14px, 1.6vw, 28px);
  min-height: clamp(58px, 4.6vw, 76px);
  padding: clamp(10px, 0.9vw, 14px) clamp(12px, 1.15vw, 18px);
  overflow: hidden;
  border-color: rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.04), transparent 44%),
    rgba(5, 10, 20, 0.88);
  transition:
    border-color 180ms ease,
    background 180ms ease;
}

.score-row::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: rgba(77, 163, 255, 0.18);
  opacity: 0;
  transition: opacity 180ms ease, background 180ms ease;
}

.score-row:hover {
  border-color: rgba(77, 163, 255, 0.42);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.08), transparent 50%),
    linear-gradient(270deg, rgba(255, 209, 102, 0.04), transparent 42%),
    rgba(8, 15, 28, 0.96);
}

.score-row:hover::before,
.score-row--podium::before {
  opacity: 1;
}

.score-row--leader {
  border-color: rgba(77, 163, 255, 0.34);
}

:global(#app .tierlist-page .usage-row.score-row) {
  border-color: rgba(148, 163, 184, 0.16) !important;
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.04), transparent 44%),
    rgba(5, 10, 20, 0.88) !important;
}

:global(#app .tierlist-page .usage-row.score-row:hover) {
  border-color: rgba(77, 163, 255, 0.42) !important;
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.08), transparent 50%),
    linear-gradient(270deg, rgba(255, 209, 102, 0.04), transparent 42%),
    rgba(8, 15, 28, 0.96) !important;
}

:global(#app .tierlist-page .usage-row.score-row--leader) {
  border-color: rgba(77, 163, 255, 0.34) !important;
}

.score-row--leader::before {
  background: linear-gradient(180deg, #7ccbff, #4da3ff);
}

.score-row__identityCluster {
  min-width: 0;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.score-row__identity {
  min-width: 0;
}

.score-row__chart {
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.score-row__barLane {
  position: relative;
  width: 100%;
  min-width: 0;
  display: block;
}

.score-row__barGraphic {
  min-width: 0;
  border-color: rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.62), rgba(3, 7, 16, 0.98)),
    rgba(3, 7, 16, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(248, 250, 252, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.32);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.score-row:hover .score-row__barGraphic {
  border-color: rgba(77, 163, 255, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(248, 250, 252, 0.08),
    0 0 18px rgba(77, 163, 255, 0.16);
}

.score-row:focus-within {
  border-color: rgba(77, 163, 255, 0.5);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.08), transparent 50%),
    rgba(8, 15, 28, 0.96);
}

.score-row:focus-within .score-row__barGraphic {
  border-color: rgba(77, 163, 255, 0.54);
  box-shadow:
    inset 0 1px 0 rgba(248, 250, 252, 0.08),
    0 0 18px rgba(77, 163, 255, 0.16);
}

.usage-row--other {
  position: relative;
  margin-top: 16px;
}

.usage-row--other::before {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  top: -9px;
  height: 1px;
  background: linear-gradient(90deg, rgba(120, 165, 215, 0), rgba(120, 165, 215, 0.55), rgba(120, 165, 215, 0));
}

.usage-row__rank {
  min-width: 0;
  color: #a8b3c7;
  font-weight: 800;
  font-size: 0.84rem;
}

.usage-row__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.usage-row__identity--static {
  cursor: default;
}

.usage-row__identity:hover {
  text-decoration: none;
}

.usage-row__identity:hover .usage-row__name {
  color: #4da3ff;
}

.usage-row__spritepair {
  flex: 0 0 auto;
  min-width: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
}

.usage-row__spritepair--single {
  min-width: 34px;
}

.usage-row__sprite {
  width: clamp(30px, 2vw, 34px);
  height: clamp(30px, 2vw, 34px);
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.28));
}

.usage-row__sprite + .usage-row__sprite {
  margin-left: -8px;
}

.usage-row__fallback {
  width: 34px;
  height: 34px;
  border-radius: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 36, 58, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 800;
}

.usage-row__copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.usage-row__name {
  min-width: 0;
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usage-row__meta {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  color: #a8b3c7;
  font-size: 0.72rem;
}

.usage-row__tier {
  padding: 2px 6px;
  border-radius: 0;
  color: #f8fbff;
  font-weight: 900;
  letter-spacing: 0.04em;
  border: 1px solid rgba(248, 250, 252, 0.16);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.08);
}

.usage-row__samples {
  color: #64748b;
}

.usage-row__pct {
  min-width: 62px;
  text-align: right;
  color: #f8fafc;
  font-size: 0.84rem;
  font-weight: 900;
}

.score-row__rank {
  transition: color 0.16s ease, text-shadow 0.16s ease;
}

.score-row--podium .score-row__rank {
  color: #4da3ff;
  text-shadow: 0 0 12px rgba(77, 163, 255, 0.22);
}

.score-row--leader .score-row__rank {
  color: #f8fafc;
  text-shadow: 0 0 16px rgba(77, 163, 255, 0.34);
}

.score-row .usage-row__sprite {
  width: clamp(32px, 2.2vw, 38px);
  height: clamp(32px, 2.2vw, 38px);
}

.score-row .usage-row__name {
  font-size: clamp(0.94rem, 0.82vw, 1.06rem);
}

.score-row__score {
  position: absolute;
  top: 50%;
  right: 8px;
  z-index: 2;
  min-width: 58px;
  min-height: calc(100% - 10px);
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px 0 12px;
  color: #f8fafc;
  font-size: clamp(0.95rem, 0.92vw, 1.13rem);
  font-variant-numeric: tabular-nums;
  font-weight: 950;
  letter-spacing: -0.02em;
  line-height: 1;
  text-align: right;
  background: linear-gradient(90deg, rgba(2, 4, 10, 0), rgba(2, 4, 10, 0.72) 24%, rgba(2, 4, 10, 0.78));
  transform: translateY(-50%);
  pointer-events: none;
}

.score-row--leader .score-row__score {
  color: #f8fafc;
  text-shadow: 0 0 16px rgba(77, 163, 255, 0.28);
}

:global(#app .tierlist-page :is(a, button, input, select, textarea, [tabindex]):focus),
:global(#app .tierlist-page :is(a, button, input, select, textarea, [tabindex]):focus-visible) {
  outline: none !important;
}

:global(#app .tierlist-page :is(a, button, input, select, textarea, [tabindex]):focus-visible) {
  border-color: rgba(77, 163, 255, 0.72) !important;
  box-shadow:
    0 0 0 1px rgba(77, 163, 255, 0.2),
    0 0 18px rgba(77, 163, 255, 0.16) !important;
}

:global(#app .tierlist-page .usage-row__identity:focus-visible),
:global(#app .tierlist-page .tier-lane__decklink:focus-visible),
:global(#app .tierlist-page .heatmap-label-link:focus-visible),
:global(#app .tierlist-page .usage-pie-legend__name:focus-visible),
:global(#app .tierlist-page .usage-pie-legend__icons:focus-visible) {
  color: var(--accent-hover) !important;
  text-decoration: none;
}

:global(#app .tierlist-page .usage-row__identity:focus-visible .usage-row__name) {
  color: var(--accent-hover) !important;
}

.usage-row__metric {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.usage-row__bar {
  flex: 0 1 72%;
  max-width: 75%;
  min-width: 128px;
}

.usage-row__barTrack {
  width: 100%;
  height: 12px;
  border-radius: 0;
  overflow: hidden;
  background: rgba(3, 7, 16, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.05);
}

.usage-row__barFill {
  position: relative;
  height: 100%;
  min-width: 10px;
  border-radius: 0;
  overflow: hidden;
  background: linear-gradient(90deg, rgba(77, 163, 255, 0.98), rgba(255, 209, 102, 0.92));
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.22);
}

.usage-row__barFill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  opacity: 0;
  transform: translateX(-120%);
  transition: transform 0.35s ease, opacity 0.2s ease;
}

.usage-row:hover .usage-row__barFill::after {
  opacity: 0.32;
  transform: translateX(120%);
}

@media (max-width: 1080px) {
  .usage-card {
    min-height: auto;
  }

  .usage-pie-layout {
    grid-template-columns: minmax(280px, 0.86fr) minmax(340px, 1fr);
    gap: 32px;
    min-height: auto;
  }

  .usage-pie {
    width: min(clamp(300px, 38vw, 460px), 100%);
    height: auto;
  }

  .usage-summary__value {
    font-size: clamp(24px, 2.4vw, 34px);
  }
}

@media (max-width: 760px) {
  .usage-pie-layout {
    grid-template-columns: 1fr;
    justify-content: stretch;
    max-width: none;
    gap: 16px;
  }

  .usage-pie {
    width: min(420px, 82vw);
    height: auto;
  }

  .usage-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .usage-pie-legend {
    grid-template-columns: 1fr;
  }

  .usage-row {
    grid-template-columns: 28px minmax(0, 1fr);
    min-height: auto;
  }

  .score-row {
    grid-template-columns: 1fr;
    gap: 10px;
    min-height: auto;
    padding: 12px;
  }

  .score-row__identityCluster {
    grid-template-columns: 28px minmax(0, 1fr);
  }

  .score-row__chart {
    grid-column: 1 / -1;
  }

  .score-row__barLane {
    grid-template-columns: minmax(0, 1fr) minmax(58px, auto);
    gap: 8px;
  }

  .usage-row__metric {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }

  .usage-row__bar {
    flex-basis: 70%;
    max-width: 75%;
  }
}

@media (max-width: 520px) {
  .usage-row {
    gap: 10px;
    padding: 10px;
  }

  .score-row {
    gap: 10px;
  }

  .score-row__barLane {
    grid-template-columns: minmax(0, 1fr) minmax(54px, auto);
  }

  .score-row__score {
    min-width: 54px;
    font-size: 0.92rem;
  }

  .usage-row__name {
    font-size: 0.92rem;
  }

  .usage-row__pct {
    min-width: 52px;
    font-size: 0.88rem;
  }
}

.tier-table-card {
  order: 1;
  position: relative;
  justify-self: stretch;
  align-self: start;
  width: 100%;
  height: auto;
  max-width: none;
  aspect-ratio: auto;
  min-height: auto;
  display: grid;
  grid-template-rows: auto auto;
  gap: clamp(12px, 1.2vw, 20px);
  overflow: visible;
  padding: clamp(14px, 1.4vw, 24px);
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.35);
  box-shadow: none;
}

.tier-table-card::before {
  content: none;
}

.tier-table-card::after {
  content: none;
}

.tier-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-right: 0;
}

.tier-table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

.tier-table-title {
  margin: 0;
  font-family:
    "Orbitron",
    "Rajdhani",
    "Eurostile",
    "Bank Gothic",
    "Segoe UI",
    sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #edf4ff;
}

.tier-table-meta {
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  letter-spacing: 0;
}

.tier-download-btn {
  appearance: none;
  min-width: 96px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 0;
  background: rgba(8, 20, 35, 0.76);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  box-shadow: none;
}

.tier-download-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(125, 211, 252, 0.36);
  color: #7dd3fc;
  background: rgba(10, 24, 42, 0.9);
}

.tier-download-btn:disabled {
  cursor: wait;
  opacity: 0.72;
}

.tier-lanes {
  display: grid;
  gap: clamp(14px, 1vw, 18px);
  align-content: start;
  margin-top: 2px;
}

.tier-lane {
  display: grid;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0;
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.034), transparent 52%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.026), transparent 56%),
    rgba(5, 10, 20, 0.94);
  overflow: hidden;
  box-shadow: none;
}

.tier-section {
  --tier-accent: #4da3ff;
  --tier-accent-soft: rgba(77, 163, 255, 0.14);
  --tier-accent-muted: rgba(171, 210, 255, 0.9);
  --tier-accent-glow: rgba(77, 163, 255, 0.18);
}

.tier-section--sss,
.tier-section--ss,
.tier-section--s {
  --tier-accent: #ff3b4f;
  --tier-accent-soft: rgba(255, 59, 79, 0.16);
  --tier-accent-muted: rgba(255, 178, 188, 0.92);
  --tier-accent-glow: rgba(255, 59, 79, 0.2);
}

.tier-section--a {
  --tier-accent: #ffd166;
  --tier-accent-soft: rgba(255, 209, 102, 0.14);
  --tier-accent-muted: rgba(255, 226, 156, 0.9);
  --tier-accent-glow: rgba(255, 209, 102, 0.17);
}

.tier-section--b {
  --tier-accent: #4da3ff;
  --tier-accent-soft: rgba(77, 163, 255, 0.15);
  --tier-accent-muted: rgba(171, 210, 255, 0.92);
  --tier-accent-glow: rgba(77, 163, 255, 0.18);
}

.tier-section--c {
  --tier-accent: #00d084;
  --tier-accent-soft: rgba(0, 208, 132, 0.12);
  --tier-accent-muted: rgba(142, 238, 196, 0.9);
  --tier-accent-glow: rgba(0, 208, 132, 0.14);
}

.tier-section__header {
  box-sizing: border-box;
  min-height: clamp(48px, 3.3vw, 60px);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  padding: 9px 18px 9px 20px;
  border-bottom: 1px solid var(--border);
  border-left: 4px solid var(--tier-accent);
  background:
    linear-gradient(90deg, var(--tier-accent-soft), transparent 48%),
    linear-gradient(180deg, rgba(6, 12, 24, 0.99), rgba(3, 7, 16, 0.98));
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.045);
}

.tier-section__title {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: var(--text);
  font-size: clamp(24px, 2vw, 42px);
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1;
}

.tier-section__title span {
  color: var(--tier-accent);
  text-shadow: 0 0 18px var(--tier-accent-glow);
}

.tier-section__title em {
  color: var(--tier-accent);
  font-style: normal;
  text-shadow: 0 0 18px var(--tier-accent-glow);
}

.tier-section__descriptor {
  color: var(--tier-accent-muted);
  font-size: clamp(11px, 0.64vw, 12px);
  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 1.25;
  margin-left: clamp(10px, 0.8vw, 16px);
  opacity: 1;
  text-align: left;
  text-transform: uppercase;
  text-shadow: 0 0 14px var(--tier-accent-glow);
}

:global(#app .tierlist-page .tier-section__title span),
:global(#app .tierlist-page .tier-section__title em) {
  color: var(--tier-accent) !important;
  text-shadow: 0 0 18px var(--tier-accent-glow);
}

:global(#app .tierlist-page .tier-section__descriptor) {
  color: var(--tier-accent-muted) !important;
  text-shadow: 0 0 14px var(--tier-accent-glow);
}

.tier-lane__deckbar {
  display: flex;
  flex-wrap: wrap;
  align-content: start;
  align-items: flex-start;
  gap: 12px;
  padding: clamp(14px, 0.8vw, 18px);
  background: rgba(2, 4, 10, 0.76);
  box-shadow: none;
}

.tier-lane__decklink {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(18px, auto);
  gap: 8px;
  flex: 0 1 clamp(170px, 10vw, 210px);
  width: auto;
  min-height: clamp(108px, 6.2vw, 124px);
  min-width: 0;
  padding: 10px 12px 11px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0;
  color: #f8fafc;
  background:
    linear-gradient(180deg, rgba(8, 16, 30, 0.96), rgba(3, 7, 16, 0.99)),
    rgba(5, 10, 20, 0.94);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.06);
  text-decoration: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
  overflow: hidden;
}

.tier-lane__decklink::after {
  content: "";
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 10px;
  height: 10px;
  border-right: 1px solid var(--tier-accent);
  border-bottom: 1px solid var(--tier-accent);
  opacity: 0.42;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.tier-lane__deckbar > .tier-lane__decklink:only-child {
  max-width: 210px;
}

.tier-lane__spritepair {
  width: 100%;
  min-width: 0;
  height: clamp(54px, 3.2vw, 62px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 0.7vw, 10px);
  padding: 3px 4px 0;
  border-radius: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  transition: transform 0.16s ease;
}

.tier-lane__decklink:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--tier-accent) 58%, rgba(148, 163, 184, 0.32));
  background:
    linear-gradient(180deg, rgba(12, 24, 44, 0.98), rgba(3, 7, 16, 0.99)),
    rgba(5, 10, 20, 0.98);
  box-shadow:
    0 0 18px var(--tier-accent-glow),
    inset 0 1px 0 rgba(248, 250, 252, 0.08);
}

.tier-lane__decklink:hover::after {
  opacity: 0.78;
}

.tier-lane__decklink:hover .tier-lane__spritepair {
  transform: translateY(-1px);
}

.tier-lane__spritepair--single {
  min-width: 0;
}

.tier-lane__sprite {
  width: clamp(38px, 2.3vw, 44px);
  height: clamp(38px, 2.3vw, 44px);
  object-fit: contain;
  image-rendering: auto;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  border-radius: 0;
  transition: transform 0.16s ease, filter 0.16s ease;
}

.tier-lane__decklink:hover .tier-lane__sprite {
  transform: translateY(-2px);
  filter: drop-shadow(0 5px 10px rgba(77, 163, 255, 0.26));
}

.tier-lane__deckname {
  display: block;
  min-width: 0;
  max-width: 100%;
  align-self: end;
  overflow: hidden;
  color: #f8fafc;
  font-family: var(--font-body);
  font-size: clamp(13px, 0.78vw, 15px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.24;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tier-lane__fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 30px;
  padding: 0 8px;
  border-radius: 0;
  color: #f8fafc;
  font-weight: 800;
  font-size: 0.72rem;
  background: rgba(148, 163, 184, 0.12);
}

.tier-empty {
  padding-top: 4px;
  color: #97adc8;
}

@media (max-width: 1080px) {
  .tier-table-card {
    justify-self: stretch;
    width: 100%;
    height: auto;
    max-width: none;
    margin: 0;
    aspect-ratio: auto;
    min-height: auto;
  }
}

.heatmap-card {
  --matrix-gap: 4px;
  --matrix-cell-size: clamp(
    58px,
    calc((100% - (var(--matrix-gap) * 12)) / 11),
    148px
  );
  --matrix-axis-size: var(--matrix-cell-size);
  min-width: 0;
  overflow: hidden;
  margin-top: clamp(24px, 3vw, 64px);
}

.heatmap-workspace {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
  overflow: hidden;
}

.heatmap-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  max-height: none;
  display: grid;
  justify-items: center;
  overflow: visible;
  overscroll-behavior: auto;
}

.heatmap-mobile {
  display: none;
}

.heatmap-table {
  width: max-content;
  max-width: none;
  min-width: 0;
  margin-inline: auto;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: var(--matrix-gap);
}

.heatmap-corner {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 50;
  width: var(--matrix-axis-size);
  min-width: var(--matrix-axis-size);
  height: var(--matrix-axis-size);
  padding: clamp(5px, calc(var(--matrix-cell-size) * 0.08), 8px);
  background: rgba(5, 10, 20, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.34);
  box-shadow: 8px 0 16px rgba(0, 0, 0, 0.24), 0 8px 18px rgba(0, 0, 0, 0.22);
  vertical-align: middle;
}

.heatmap-corner__label {
  display: block;
  color: var(--accent);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.heatmap-corner__label--muted {
  margin-top: 3px;
  color: var(--text-soft);
  opacity: 0.8;
}

.heatmap-col-label {
  position: sticky;
  top: 0;
  z-index: 40;
  width: var(--matrix-cell-size);
  min-width: var(--matrix-cell-size);
  height: var(--matrix-cell-size);
  padding: 0;
  text-align: center;
  background: rgba(2, 4, 10, 0.98);
  vertical-align: bottom;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.heatmap-col-label--active {
  z-index: 45;
}

.heatmap-row-label {
  position: sticky;
  left: 0;
  z-index: 30;
  width: var(--matrix-axis-size);
  min-width: var(--matrix-axis-size);
  height: var(--matrix-axis-size);
  padding: 0;
  text-align: left;
  background: rgba(2, 4, 10, 0.98);
  vertical-align: middle;
  box-shadow: 8px 0 16px rgba(0, 0, 0, 0.24);
}

.heatmap-row-label--active {
  z-index: 35;
}

.heatmap-label-link {
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
  cursor: pointer;
  text-decoration: none;
}

.heatmap-axis-chip {
  position: relative;
  width: var(--matrix-cell-size);
  height: var(--matrix-cell-size);
  min-height: var(--matrix-cell-size);
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(3px, calc(var(--matrix-cell-size) * 0.04), 5px);
  padding: clamp(5px, calc(var(--matrix-cell-size) * 0.075), 8px);
  border-radius: 0;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background:
    linear-gradient(180deg, rgba(8, 15, 28, 0.98), rgba(3, 7, 16, 0.99)),
    rgba(5, 10, 20, 0.96);
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.heatmap-axis-chip--row {
  width: var(--matrix-axis-size);
  height: var(--matrix-axis-size);
  min-height: var(--matrix-axis-size);
  aspect-ratio: 1 / 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: clamp(5px, calc(var(--matrix-cell-size) * 0.075), 8px);
}

.heatmap-axis-chip--picker {
  border-color: rgba(77, 163, 255, 0.44);
}

.heatmap-axis-chip--active {
  border-color: rgba(77, 163, 255, 0.78);
  background:
    linear-gradient(180deg, rgba(14, 32, 56, 0.99), rgba(3, 7, 16, 0.99)),
    rgba(5, 10, 20, 0.98);
  box-shadow: 0 0 18px rgba(77, 163, 255, 0.16), inset 0 1px 0 rgba(248, 250, 252, 0.06);
}

.heatmap-label-link:hover .heatmap-axis-chip {
  border-color: rgba(77, 163, 255, 0.68);
  background:
    linear-gradient(180deg, rgba(12, 24, 44, 0.98), rgba(3, 7, 16, 0.99)),
    rgba(5, 10, 20, 0.98);
  transform: translateY(-1px);
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.14);
}

.heatmap-axis-chip::after {
  content: attr(data-deck-name);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 7px);
  z-index: 30;
  display: none;
  width: max-content;
  max-width: 220px;
  padding: 8px 10px;
  border: 1px solid rgba(77, 163, 255, 0.42);
  background: rgba(5, 10, 20, 0.98);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.42), 0 0 16px rgba(77, 163, 255, 0.14);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  opacity: 0;
  text-align: center;
  transform: translate(-50%, 3px);
  transition: opacity 0.14s ease, transform 0.14s ease;
  white-space: normal;
  pointer-events: none;
}

.heatmap-label-link:hover .heatmap-axis-chip::after,
.heatmap-label-link:focus-visible .heatmap-axis-chip::after {
  display: block;
  opacity: 1;
  transform: translate(-50%, 0);
}

.heatmap-axis-name {
  display: none;
  width: 100%;
  min-width: 0;
  max-width: 92px;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.12;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-axis-name--row {
  max-width: none;
  color: #f8fafc;
  font-size: 12px;
  line-height: 1.18;
  text-align: left;
}

.heatmap-sprite-stack,
.heatmap-row-sprite-stack {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2px, calc(var(--matrix-cell-size) * 0.035), 5px);
}

.heatmap-row-sprite-stack {
  justify-content: center;
}

.heatmap-sprite {
  width: clamp(26px, calc(var(--matrix-cell-size) * 0.38), 44px);
  height: clamp(26px, calc(var(--matrix-cell-size) * 0.38), 44px);
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
  border-radius: 0;
}

.heatmap-sprite--picker {
  width: 34px;
  height: 34px;
}

.heatmap-sprite--mobile {
  width: 28px;
  height: 28px;
}

.heatmap-cell {
  position: relative;
  z-index: 1;
  width: var(--matrix-cell-size);
  min-width: var(--matrix-cell-size);
  height: var(--matrix-cell-size);
  padding: 0;
  background: rgba(3, 7, 16, 0.78);
}

.heatmap-cell::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  background:
    linear-gradient(135deg, rgba(124, 203, 255, 0.1), transparent 62%),
    rgba(77, 163, 255, 0.1);
  transition: opacity 120ms ease;
}

.heatmap-cell--row-highlight::after,
.heatmap-cell--column-highlight::after {
  opacity: 1;
}

.heatmap-cell--hovered {
  z-index: 20;
}

.heatmap-cell--hovered::after {
  opacity: 0.24;
}

.heatmap-cell__inner {
  position: relative;
  z-index: 1;
  width: var(--matrix-cell-size);
  height: var(--matrix-cell-size);
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  border: 1px solid transparent;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
}

.heatmap-cell__inner:hover,
.heatmap-cell__inner:focus-visible,
.heatmap-cell__inner--active {
  z-index: 20;
  border-color: rgba(77, 163, 255, 0.78) !important;
  outline: none;
  filter: brightness(1.18);
  box-shadow:
    0 0 0 1px rgba(77, 163, 255, 0.18),
    0 0 20px rgba(77, 163, 255, 0.16),
    inset 0 1px 0 rgba(248, 250, 252, 0.055) !important;
}

.heatmap-cell__inner--related:not(.heatmap-cell__inner--active),
.heatmap-cell__inner--row-highlight:not(.heatmap-cell__inner--active),
.heatmap-cell__inner--column-highlight:not(.heatmap-cell__inner--active) {
  border-color: rgba(77, 163, 255, 0.34) !important;
  filter: brightness(1.08);
  box-shadow:
    0 0 0 1px rgba(77, 163, 255, 0.08),
    inset 0 1px 0 rgba(248, 250, 252, 0.045) !important;
}

.heatmap-mobile__cellInner[data-tooltip]:hover::after,
.heatmap-mobile__cellInner[data-tooltip]:focus-visible::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 20;
  width: max-content;
  max-width: 260px;
  padding: 10px 12px;
  border: 1px solid rgba(77, 163, 255, 0.46);
  background:
    linear-gradient(180deg, rgba(8, 15, 28, 0.99), rgba(2, 4, 10, 0.99)),
    rgba(5, 10, 20, 0.98);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.46), 0 0 18px rgba(77, 163, 255, 0.16);
  color: #f8fafc;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.55;
  text-align: left;
  text-transform: none;
  transform: translateX(-50%);
  white-space: pre-line;
  pointer-events: none;
}

.heatmap-cell__inner--confidence-low {
  border-style: dashed;
}

.heatmap-cell__inner--confidence-low .heatmap-cell__record,
.heatmap-mobile__cellInner.heatmap-cell__inner--confidence-low .heatmap-mobile__record {
  color: rgba(168, 179, 199, 0.82);
}

.heatmap-cell__inner--confidence-high {
  border-width: 1px;
}

.heatmap-cell__inner--empty {
  color: rgba(168, 179, 199, 0.7);
  background: rgba(5, 10, 20, 0.76);
  border-color: rgba(148, 163, 184, 0.24);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.03);
}

.heatmap-cell__inner--mirror {
  color: rgba(100, 116, 139, 0.82);
  background: rgba(5, 10, 20, 0.62);
  border-color: rgba(148, 163, 184, 0.14);
  text-transform: uppercase;
}

.heatmap-cell__copy {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  line-height: 1;
}

.heatmap-cell__rate {
  color: currentColor;
  font-size: clamp(13px, calc(var(--matrix-cell-size) * 0.17), 20px);
  font-variant-numeric: tabular-nums;
  font-weight: 950;
}

.heatmap-cell__record {
  max-width: 100%;
  color: rgba(248, 250, 252, 0.78);
  font-size: clamp(9px, calc(var(--matrix-cell-size) * 0.095), 11px);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.heatmap-picker-cell {
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 6px;
  border-radius: 0;
  border: 1px dashed rgba(77, 163, 255, 0.34);
  background: rgba(5, 10, 20, 0.86);
}

.heatmap-picker-cell--empty {
  background: rgba(5, 10, 20, 0.72);
}

.heatmap-picker-label {
  display: block;
  max-width: 100%;
  color: #d7e4f3;
  font-size: 0.8rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-picker-row-label {
  color: #d7e4f3;
  max-width: 100%;
  font-size: 0.82rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matchup-tooltip {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
  width: min(360px, calc(100vw - 20px));
  max-width: calc(100vw - 20px);
  pointer-events: none;
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(77, 163, 255, 0.55);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.11), transparent 46%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.035), transparent 58%),
    rgba(5, 12, 24, 0.97);
  box-shadow:
    inset 0 1px 0 rgba(248, 250, 252, 0.05),
    0 16px 46px rgba(0, 0, 0, 0.52),
    0 0 26px rgba(77, 163, 255, 0.16);
  backdrop-filter: blur(8px);
}

.heatmap-detail-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.heatmap-detail-panel__eyebrow {
  color: #4da3ff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.heatmap-detail-panel__header strong {
  color: #f8fafc;
  font-size: clamp(22px, 1.8vw, 34px);
  font-weight: 950;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.heatmap-detail-panel__empty {
  margin: 0;
  color: #a8b3c7;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.heatmap-detail-panel__versus {
  display: grid;
  gap: 10px;
}

.heatmap-detail-panel__vs {
  width: max-content;
  padding: 3px 8px;
  border: 1px solid rgba(77, 163, 255, 0.28);
  color: #7ccbff;
  background: rgba(77, 163, 255, 0.08);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.heatmap-detail-deck {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: inherit;
  background: rgba(3, 7, 16, 0.7);
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.heatmap-detail-deck:hover {
  border-color: rgba(77, 163, 255, 0.58);
  background: rgba(77, 163, 255, 0.08);
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.12);
}

.heatmap-detail-deck__label {
  grid-column: 1 / -1;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.heatmap-detail-deck__icons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.heatmap-detail-deck__sprite {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.48));
}

.heatmap-detail-deck strong {
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heatmap-detail-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.heatmap-detail-metric {
  min-width: 0;
  display: grid;
  gap: 5px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(3, 7, 16, 0.62);
}

.heatmap-detail-metric span {
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.heatmap-detail-metric strong {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 950;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.heatmap-detail-metric--primary {
  border-color: rgba(77, 163, 255, 0.46);
  background: rgba(77, 163, 255, 0.08);
}

.heatmap-detail-metric--primary strong {
  color: #7ccbff;
  font-size: clamp(24px, 2vw, 36px);
  letter-spacing: -0.03em;
}

.heatmap-detail-legend {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.heatmap-detail-legend__title {
  color: #a8b3c7;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.heatmap-detail-legend span:not(.heatmap-detail-legend__title) {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a8b3c7;
  font-size: 12px;
  font-weight: 700;
}

.heatmap-detail-legend__swatch {
  width: 18px;
  height: 9px;
  border: 1px solid rgba(248, 250, 252, 0.1);
  background: rgba(12, 27, 48, 0.8);
}

.heatmap-detail-legend__swatch--bad {
  background: rgba(155, 26, 46, 0.78);
}

.heatmap-detail-legend__swatch--even {
  background: rgba(12, 27, 48, 0.86);
}

.heatmap-detail-legend__swatch--good {
  background: rgba(0, 148, 130, 0.78);
}

.heatmap-detail-panel__note {
  margin: 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.45;
}

@media (max-width: 980px) {
  .heatmap-card {
    --matrix-cell-size: clamp(62px, 7vw, 76px);
    --matrix-axis-size: clamp(66px, 7vw, 82px);
  }
}

.matrix-picker-panel {
  position: relative;
  z-index: 70;
  min-height: 64px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  margin: 12px 0 clamp(16px, 1.5vw, 24px);
  padding: 9px 12px;
  border: 1px solid rgba(77, 163, 255, 0.34);
  border-left-color: rgba(77, 163, 255, 0.72);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.1), transparent 42%),
    rgba(5, 10, 20, 0.94);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.045);
}

.matrix-picker-panel__label {
  color: #7ccbff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}

.matrix-combobox {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(260px, 0.52fr) minmax(320px, 1fr);
  align-items: stretch;
  gap: 10px;
}

.matrix-combobox__selected {
  min-width: 0;
  min-height: 46px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(3, 7, 16, 0.72);
}

.matrix-combobox__selected-icons {
  min-width: 58px;
}

.matrix-combobox__selected-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.matrix-combobox__selected-copy strong,
.matrix-combobox__selected-copy span {
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-combobox__selected-copy small {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  color: #a8b3c7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.matrix-combobox__tier {
  min-width: 20px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0 6px;
  border: 1px solid rgba(248, 250, 252, 0.12);
  color: #02040a;
  font-size: 10px;
  font-weight: 950;
  line-height: 1;
}

.matrix-combobox__clear {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(2, 5, 12, 0.82);
  color: #a8b3c7;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.matrix-combobox__clear:hover,
.matrix-combobox__clear:focus-visible {
  border-color: rgba(77, 163, 255, 0.72);
  background: rgba(77, 163, 255, 0.12);
  color: #f8fafc;
  outline: none;
  box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.16), 0 0 18px rgba(77, 163, 255, 0.12);
}

.matrix-combobox__search {
  position: relative;
  min-width: 0;
}

.matrix-combobox__input {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 0;
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.06), transparent 52%),
    rgba(2, 5, 12, 0.88);
  color: #f8fafc;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 750;
  outline: none;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.matrix-combobox__input::-webkit-search-cancel-button {
  appearance: none;
}

.matrix-combobox__input::placeholder {
  color: rgba(168, 179, 199, 0.66);
}

.matrix-combobox__input:focus {
  border-color: rgba(77, 163, 255, 0.86);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.1), transparent 52%),
    rgba(2, 5, 12, 0.94);
  box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.22), 0 0 22px rgba(77, 163, 255, 0.14);
}

.matrix-combobox__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 95;
  max-height: min(46vh, 438px);
  overflow-y: auto;
  overflow-x: hidden;
  display: grid;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(77, 163, 255, 0.34);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 48%),
    rgba(5, 10, 20, 0.98);
  box-shadow:
    0 22px 54px rgba(0, 0, 0, 0.44),
    0 0 28px rgba(77, 163, 255, 0.08);
}

.matrix-combobox__option {
  min-width: 0;
  min-height: 54px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  padding: 7px 9px;
  border: 1px solid transparent;
  background: rgba(3, 7, 16, 0.68);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.14s ease,
    background 0.14s ease,
    box-shadow 0.14s ease;
}

.matrix-combobox__option:hover,
.matrix-combobox__option--active {
  border-color: rgba(77, 163, 255, 0.58);
  background:
    linear-gradient(90deg, rgba(77, 163, 255, 0.11), rgba(255, 209, 102, 0.035)),
    rgba(8, 15, 28, 0.96);
  box-shadow: inset 2px 0 0 rgba(77, 163, 255, 0.72);
}

.matrix-combobox__option-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.matrix-combobox__option-copy strong {
  min-width: 0;
  overflow: hidden;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-combobox__option-copy small {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  color: #a8b3c7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.matrix-combobox__empty {
  min-height: 42px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(148, 163, 184, 0.22);
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.matrix-picker__placeholder-icon {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(77, 163, 255, 0.42);
  color: #7ccbff;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  background: rgba(77, 163, 255, 0.06);
}

@media (max-width: 640px) {
  .tierlist-page {
    max-width: 100%;
  }

  .tierlist-header {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding-top: clamp(46px, 8vh, 72px);
  }

  .filter-drawer-trigger {
    width: 100%;
    min-width: 0;
  }

  .page-title {
    font-size: clamp(54px, 16vw, 76px);
    line-height: 0.84;
  }

  .tierlist-hero-title em {
    margin-left: 0.12em;
  }

  .creator-materials-panel__actions {
    grid-template-columns: 1fr;
  }

  .filter-panel--drawer {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: calc(100dvh - 78px);
    padding: 18px;
    border-right: 0;
    border-bottom: 0;
  }

  .filter-summary__row {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .matrix-picker-panel {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .matrix-combobox {
    grid-template-columns: 1fr;
  }

  .matrix-combobox__menu {
    position: absolute;
    max-height: min(50vh, 360px);
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .tier-section__header {
    min-height: 48px;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px 10px 14px;
  }

  .tier-section__title {
    font-size: 24px;
    gap: 3px 8px;
  }

  .tier-section__descriptor {
    font-size: 10.5px;
    letter-spacing: 0.14em;
    margin-left: 0;
    max-width: none;
    text-align: left;
  }

  .tier-lane__deckbar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 10px;
    gap: 8px;
  }

  .tier-lane__decklink {
    min-height: 108px;
    padding: 9px 9px 10px;
  }

  .tier-lane__spritepair {
    height: 52px;
    min-height: 52px;
    padding: 2px 2px 0;
    gap: 6px;
  }

  .tier-lane__sprite {
    width: 38px;
    height: 38px;
  }

  .tier-lane__deckname {
    font-size: 13px;
    line-height: 1.22;
  }

}

@media (max-width: 340px) {
  .tier-lane__deckbar {
    display: grid;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .tier-ev-rail,
  .heatmap-workspace {
    display: none;
  }

  .heatmap-mobile {
    display: grid;
    gap: 16px;
  }

  .heatmap-mobile-picker {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(5, 10, 20, 0.94);
  }

  .heatmap-mobile-picker__label {
    color: var(--accent);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .heatmap-mobile-picker__select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    border-radius: 0;
    background: rgba(3, 7, 16, 0.96);
    color: #f8fafc;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 800;
  }

  .heatmap-mobile-picker__select:focus {
    border-color: rgba(77, 163, 255, 0.82);
    box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.18), 0 0 18px rgba(77, 163, 255, 0.14);
    outline: none;
  }

  .heatmap-mobile__section {
    display: grid;
    gap: 10px;
  }

  .heatmap-mobile__header {
    display: flex;
  }

  .heatmap-mobile__deck {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 0;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: rgba(5, 10, 20, 0.94);
    color: inherit;
    text-decoration: none;
  }

  .heatmap-mobile__deck-name {
    min-width: 0;
    font-size: 1rem;
    font-weight: 800;
    color: #eef4fb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .heatmap-mobile__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .heatmap-mobile__cellInner {
    position: relative;
    min-height: 84px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 0;
    border: 1px solid transparent;
  }

  .heatmap-mobile__versus {
    color: currentColor;
    font-size: 0.8rem;
    opacity: 0.9;
  }

  .heatmap-mobile__opponent {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    color: inherit;
    text-decoration: none;
  }

  .heatmap-mobile__opponent-name {
    min-width: 0;
    color: #f8fafc;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .heatmap-mobile__rate {
    justify-self: end;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }

  .heatmap-mobile__record {
    grid-column: 3;
    justify-self: end;
    color: rgba(248, 250, 252, 0.78);
    font-size: 0.8rem;
    line-height: 1;
    white-space: nowrap;
  }

  .heatmap-mobile__empty {
    padding: 14px;
    text-align: center;
    border-radius: 0;
    border: 1px dashed rgba(111, 156, 212, 0.22);
    color: #a7bdd9;
    background: rgba(13, 28, 50, 0.52);
  }

}

@media (prefers-reduced-motion: reduce) {
  .tier-ev-rail::after,
  .tier-ev-rail__item,
  .tier-ev-rail__dot,
  .tier-ev-rail__item--active .tier-ev-rail__dot,
  .heatmap-cell__inner,
  .heatmap-axis-chip,
  .heatmap-detail-deck {
    animation: none;
    transition: none;
  }
}
</style>
