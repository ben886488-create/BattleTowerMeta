<template>
  <section class="deck-profile">
    <div class="profileFilters">
      <section class="profileFilterGroup">
        <div class="profileFilterGroup__head">
          <div class="profileFilterGroup__head__content">
            <h3 class="profileFilterGroup__title">
              {{ isZhUi ? "左側面板篩選" : "Left panel filters" }}
            </h3>
            <p class="profileFilterGroup__sub">
              {{ 
                isZhUi 
                  ? "影響 Top 4、勝負、場域佔比、Win %、優劣勢對局" 
                  : "Affects Top 4, record, meta share, Win %, and matchups" 
              }}
            </p>
          </div>
          <div class="profileFilterGroup__head__actions">
            <!-- 空容器，用于保持与右边的高度一致 -->
          </div>
        </div>

        <div class="profileFilterGrid profileFilterGrid--left">
          <div class="profileFilterField">
            <label>
              {{ isZhUi ? "時間" : "Time" }}
            </label>
            <select v-model="leftPanelFilters.time">
              <option value="prev7">Previous 7 days</option>
              <option value="all">{{ isZhUi ? "全部" : "All" }}</option>
              <option value="past7">{{ isZhUi ? "過去一週" : "Past 7 days" }}</option>
              <option value="past4w">{{ isZhUi ? "過去一月" : "Past 4 weeks" }}</option>
              <optgroup :label="isZhUi ? '月份' : 'Month'">
                <option
                  v-for="m in monthOptions"
                  :key="`left-time-${m.value}`"
                  :value="m.value"
                >
                  {{ m.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="profileFilterField">
            <label>Top Cut</label>
            <select v-model="leftPanelFilters.topCut">
              <option
                v-for="cut in TOP_CUT_OPTIONS"
                :key="`left-topcut-${cut}`"
                :value="cut"
              >
                {{ topCutLabel(cut) }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <section class="profileFilterGroup">
        <div class="profileFilterGroup__head">
          <div class="profileFilterGroup__head__content">
            <h3 class="profileFilterGroup__title">
              {{ isZhUi ? "右側卡牌投入率篩選" : "Card inclusion filters" }}
            </h3>
            <p class="profileFilterGroup__sub">
              {{ 
                isZhUi 
                  ? "只影響右側卡牌投入率與平均張數" 
                  : "Affects only card inclusion % and average copies" 
              }}
            </p>
          </div>
          <div class="profileFilterGroup__head__actions">
            <button
              type="button"
              class="download-btn mono"
              :disabled="downloadingDeckPanel || rightDeckPanelCards.length === 0"
              @click="downloadTransparentDeckPanel"
            >
              {{ downloadingDeckPanel ? (isZhUi ? "下載中..." : "Downloading...") : (isZhUi ? "下載透明面板" : "Download transparent panel") }}
            </button>
            <button
              type="button"
              class="download-btn mono"
              :disabled="downloadingPanel || rightDeckPanelCards.length === 0"
              @click="downloadDeckPanelPng"
            >
              {{ downloadingPanel ? (isZhUi ? "下載中..." : "Downloading...") : (isZhUi ? "下載 PNG" : "Download PNG") }}
            </button>
          </div>
        </div>

        <div class="profileFilterGrid profileFilterGrid--right">
          <div class="profileFilterField">
            <label>
              {{ isZhUi ? "時間" : "Time" }}
            </label>
            <select v-model="leftPanelFilters.time">
              <option value="prev7">Previous 7 days</option>
              <option value="all">{{ isZhUi ? "全部" : "All" }}</option>
              <option value="past7">{{ isZhUi ? "過去一週" : "Past 7 days" }}</option>
              <option value="past4w">{{ isZhUi ? "過去一月" : "Past 4 weeks" }}</option>
              <optgroup :label="isZhUi ? '月份' : 'Month'">
                <option
                  v-for="m in monthOptions"
                  :key="`right-time-${m.value}`"
                  :value="m.value"
                >
                  {{ m.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="profileFilterField">
            <label>Top Cut</label>
            <select v-model="leftPanelFilters.topCut">
              <option
                v-for="cut in TOP_CUT_OPTIONS"
                :key="`right-topcut-${cut}`"
                :value="cut"
              >
                {{ topCutLabel(cut) }}
              </option>
            </select>
          </div>

          <div class="profileFilterField profileFilterField--toggle">
            <label>{{ isZhUi ? "檢視" : "View" }}</label>
            <div
              class="view-toggle"
              role="tablist"
              :aria-label="isZhUi ? '右側牌組面板檢視' : 'Right deck panel view'"
            >
              <button
                type="button"
                class="view-toggle__option"
                :class="{ 'view-toggle__option--active': rightDeckMode === 'cards' }"
                @click="rightDeckMode = 'cards'"
              >
                {{ isZhUi ? "卡片投入率" : "Card rates" }}
              </button>
              <button
                type="button"
                class="view-toggle__option"
                :class="{ 'view-toggle__option--active': rightDeckMode === 'sample' }"
                @click="rightDeckMode = 'sample'"
              >
                {{ isZhUi ? "範例牌組" : "Sample deck" }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div ref="heroCaptureRef" class="hero-grid">
      <aside ref="leftPanelRef" class="hero-sidebar">
      <section class="hero-panel hero-panel--title">
        <span class="panel-kicker mono">{{ isZhUi ? "精選牌組" : "DECK SPOTLIGHT" }}</span>

        <div class="deck-title-block deck-title-block--classic">
          <div class="deck-title-text deck-title-text--classic">
            <p class="deck-display-name deck-display-name--classic">
              {{ displayDeckName }}
            </p>

            <p
              v-if="displayDeckNameEn && displayDeckNameEn !== displayDeckName"
              class="deck-english-name deck-english-name--classic mono"
            >
              {{ displayDeckNameEn }}
            </p>

            <div class="deck-title-media">
              <div class="sprite-stack sprite-stack--title" :title="displayDeckName">
                <template v-if="titleSpriteUrls.length > 0">
                  <img
                    v-for="(sprite, index) in titleSpriteUrls"
                    :key="`${sprite}-${index}`"
                    class="sprite-chip sprite-chip--title"
                    :src="sprite"
                    :alt="displayDeckName"
                    draggable="false"
                  />
                </template>

                <div v-else class="sprite-fallback mono">
                  {{ cardInitials(displayDeckName) }}
                </div>
              </div>

              <div
                v-if="deckTierInfo"
                class="tier-badge"
                :class="tierClassName(deckTierInfo.tier)"
                :title="`Tier ${deckTierInfo.tier}`"
              >
                <span class="tier-badge__label mono">{{ isZhUi ? "等級" : "TIER" }}</span>
                <strong class="tier-badge__value mono">{{ deckTierInfo.tier }}</strong>
              </div>
            </div>

            <p class="deck-context-line mono">
              {{ leftPanelSummaryText }}
            </p>
          </div>
        </div>
      </section>  

        <section class="hero-panel hero-panel--stats">
          <div class="stats-head">
            <h3 class="panel-title">本週 Top 4</h3>
          </div>

          <div class="placement-grid">
            <article class="placement-card placement-card--gold">
              <span class="placement-rank mono">1ST</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[1] }}</strong>
            </article>

            <article class="placement-card placement-card--silver">
              <span class="placement-rank mono">2ND</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[2] }}</strong>
            </article>

            <article class="placement-card placement-card--bronze">
              <span class="placement-rank mono">3RD</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[3] }}</strong>
            </article>

            <article class="placement-card placement-card--blue">
              <span class="placement-rank mono">4TH</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[4] }}</strong>
            </article>
          </div>

          <div class="metric-row">
            <div class="metric-card">
              <div class="semi-gauge">
                <svg viewBox="0 0 120 68" class="semi-gauge__svg" aria-hidden="true">
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ffffff"
                    stroke-opacity="0.14"
                    stroke-width="14"
                    stroke-linecap="butt"
                  />
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ff7f50"
                    stroke-width="14"
                    stroke-linecap="butt"
                    :stroke-dasharray="gaugeDasharray(leftAnalytics.metaShare)"
                    stroke-dashoffset="0"
                  />
                </svg>

                <div class="semi-gauge__label">
                  <strong class="mono">{{ formatPct(leftAnalytics.metaShare) }}</strong>
                </div>
                <div class="semi-gauge__caption">{{ isZhUi ? "晉級占比" : "Top Cut %" }}</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="semi-gauge">
                <svg viewBox="0 0 120 68" class="semi-gauge__svg" aria-hidden="true">
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ffffff"
                    stroke-opacity="0.14"
                    stroke-width="14"
                    stroke-linecap="butt"
                  />
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ff7f50"
                    stroke-width="14"
                    stroke-linecap="butt"
                    :stroke-dasharray="gaugeDasharray(leftAnalytics.winRate)"
                    stroke-dashoffset="0"
                  />
                </svg>

                <div class="semi-gauge__label">
                  <strong class="mono">
                    {{ leftAnalytics.winRate == null ? "—" : formatPct(leftAnalytics.winRate) }}
                  </strong>
                </div>
                <div class="semi-gauge__caption">{{ isZhUi ? "勝率" : "Win %" }}</div>
              </div>
            </div>
          </div>

          <div class="record-line">
            <span class="record-bubble record-bubble--win mono">{{ leftAnalytics.wins }}勝</span>
            <span class="record-bubble record-bubble--loss mono">{{ leftAnalytics.losses }}負</span>
            <span class="record-bubble record-bubble--draw mono">{{ leftAnalytics.draws }}平</span>
          </div>
        </section>

        <section class="hero-panel hero-panel--matchups">
          <div class="matchup-group">
            <div class="matchup-group__title matchup-group__title--good">優勢對局</div>

            <div v-if="leftAnalytics.featuredGoodMatchups.length > 0" class="matchup-row">
              <article
                v-for="item in leftAnalytics.featuredGoodMatchups"
                :key="`good-${item.key}`"
                class="matchup-tile matchup-tile--good"
                :title="item.displayName"
              >
                <div class="sprite-stack sprite-stack--small">
                  <template v-if="item.spriteUrls.length > 0">
                    <img
                      v-for="(sprite, index) in item.spriteUrls"
                      :key="`${item.key}-good-${sprite}-${index}`"
                      class="sprite-chip sprite-chip--small"
                      :src="sprite"
                      :alt="item.displayName"
                      draggable="false"
                    />
                  </template>

                  <div v-else class="sprite-fallback sprite-fallback--small mono">
                    {{ cardInitials(item.displayName) }}
                  </div>
                </div>

                <div class="matchup-rate mono">{{ formatPct(item.winRate) }}</div>
                <div class="matchup-record mono">
                  {{ formatRecord(item.wins, item.losses, item.draws) }}
                </div>
              </article>
            </div>

            <div v-else class="matchup-empty">—</div>
          </div>

          <div class="matchup-group">
            <div class="matchup-group__title matchup-group__title--bad">劣勢對局</div>

            <div v-if="leftAnalytics.featuredBadMatchups.length > 0" class="matchup-row">
              <article
                v-for="item in leftAnalytics.featuredBadMatchups"
                :key="`bad-${item.key}`"
                class="matchup-tile matchup-tile--bad"
                :title="item.displayName"
              >
                <div class="sprite-stack sprite-stack--small">
                  <template v-if="item.spriteUrls.length > 0">
                    <img
                      v-for="(sprite, index) in item.spriteUrls"
                      :key="`${item.key}-bad-${sprite}-${index}`"
                      class="sprite-chip sprite-chip--small"
                      :src="sprite"
                      :alt="item.displayName"
                      draggable="false"
                    />
                  </template>

                  <div v-else class="sprite-fallback sprite-fallback--small mono">
                    {{ cardInitials(item.displayName) }}
                  </div>
                </div>

                <div class="matchup-rate mono">{{ formatPct(item.winRate) }}</div>
                <div class="matchup-record mono">
                  {{ formatRecord(item.wins, item.losses, item.draws) }}
                </div>
              </article>
            </div>

            <div v-else class="matchup-empty">—</div>
          </div>
        </section>
      </aside>

      <section class="hero-panel hero-panel--decklist">
        <div
          ref="deckPanelRef"
          class="decklist-shell"
          :class="{
            'decklist-shell--rates': rightDeckMode === 'cards',
            'decklist-shell--sample': rightDeckMode === 'sample',
          }"
        >
          <div class="decklist-head" :data-export-ignore="rightDeckMode === 'sample' ? 'true' : undefined">
            <div class="decklist-head__copy">
              <h3 class="panel-title">
                {{ rightDeckMode === "cards" ? (isZhUi ? "卡片投入率" : "Card inclusion") : (isZhUi ? "最佳範例牌組" : "Best sample deck") }}
              </h3>
              <p class="decklist-head__sub">{{ rightDeckPanelSubtitleText }}</p>
            </div>

            <div class="decklist-head__actions">
              <a
                v-if="rightDeckMode === 'sample' && rightAnalytics.sampleDeck?.listUrl"
                class="list-btn"
                :href="rightAnalytics.sampleDeck.listUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Decklist
              </a>
            </div>
          </div>

          <div
            v-if="rightDeckMode === 'sample' && rightAnalytics.sampleDeck"
            class="sample-deck-meta"
            data-export-ignore="true"
          >
            <span class="sample-deck-meta__item mono">
              {{ rightAnalytics.sampleDeck.player }}
            </span>
            <span class="sample-deck-meta__item mono">
              {{ rightAnalytics.sampleDeck.placeLabel }}
            </span>
            <span class="sample-deck-meta__item">
              {{ rightAnalytics.sampleDeck.tournamentName }}
            </span>
          </div>
          <div v-if="decklistLoading" class="cards-empty">
            正在整理牌組資料…
          </div>

          <div
            v-else-if="
              normalizedTournaments.length > 0 &&
              rightAnalytics.totalSeenDeckRows === 0 &&
              loadedTournamentCount >= normalizedTournaments.length
            "
            class="cards-empty"
          >
            目前篩選條件下沒有這副牌組
          </div>

          <div v-else-if="rightDeckPanelCards.length === 0" class="cards-empty">
            <span class="cards-empty__copy">{{ rightDeckPanelEmptyText }}</span>
            目前沒有投入率達 10% 以上的卡片
          </div>

          <div
            v-else-if="rightDeckMode === 'cards'"
            ref="deckCardsViewportRef"
            class="decklist-viewport"
            :class="{ 'decklist-viewport--scrollable': rightDeckPanelCards.length > 20 }"
            :style="decklistViewportStyle"
          >
            <div ref="deckCardsGridRef" class="decklist-groups">
              <section
                v-for="group in rightDeckPanelGroups"
                :key="group.key"
                class="decklist-group"
              >
                <header class="decklist-group__header">
                  <h4 class="decklist-group__title">{{ group.label }}</h4>
                  <span class="decklist-group__count mono">{{ group.cards.length }}</span>
                </header>

                <div class="cardsGrid cardsGrid--profile cardsGrid--rates">
                  <article
                    v-for="card in group.cards"
                    :key="card.key"
                    class="profileCard profileCard--breakdown"
                    :title="card.title"
                  >
                    <div class="profileCard__imageWrap profileCard__imageWrap--breakdown">
                      <img
                        v-if="card.image && !failedCardImages[card.key]"
                        class="profileCard__image"
                        :src="card.image"
                        :alt="card.name"
                        crossorigin="anonymous"
                        draggable="false"
                        @error="onCardImageError(card.key)"
                      />

                      <div v-else class="profileCard__fallback">
                        <div class="profileCard__fallbackName">{{ card.name }}</div>
                        <div class="profileCard__fallbackCode mono">
                          {{ card.set || "?" }} {{ card.number || card.code || "?" }}
                        </div>
                      </div>

                      <div
                        class="profileCard__stats"
                        :style="{
                          '--one-rate': `${card.oneCopyPct}%`,
                          '--two-rate': `${card.twoCopyPct}%`,
                        }"
                      >
                        <div class="profileCard__rateDial">
                          <span class="profileCard__rateDialLabel">{{ isZhUi ? "投入率" : "Rate" }}</span>
                          <strong class="profileCard__rateDialValue mono">{{ card.badgeText }}</strong>
                        </div>

                        <div class="profileCard__copyBreakdown">
                          <span
                            class="profileCard__copyStat profileCard__copyStat--two"
                            :aria-label="`2 copies ${formatPercentValue(card.twoCopyPct)}`"
                          >
                            <img class="profileCard__copyIcon" :src="twoCopyDiskIcon" alt="" draggable="false" />
                            <span class="profileCard__copyDivider" aria-hidden="true"></span>
                            <strong class="profileCard__copyValue mono">{{ formatPercentValue(card.twoCopyPct) }}</strong>
                          </span>
                          <span
                            class="profileCard__copyStat profileCard__copyStat--one"
                            :aria-label="`1 copy ${formatPercentValue(card.oneCopyPct)}`"
                          >
                            <img class="profileCard__copyIcon" :src="oneCopyDiskIcon" alt="" draggable="false" />
                            <span class="profileCard__copyDivider" aria-hidden="true"></span>
                            <strong class="profileCard__copyValue mono">{{ formatPercentValue(card.oneCopyPct) }}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>

          <div
            v-else-if="rightDeckMode === 'sample'"
            ref="deckCardsViewportRef"
            class="decklist-viewport"
            :class="{ 'decklist-viewport--scrollable': rightDeckPanelCards.length > 20 }"
            :style="decklistViewportStyle"
          >
            <div ref="deckCardsGridRef" class="cardsGrid cardsGrid--profile">
              <article
                v-for="card in rightDeckPanelCards"
                :key="card.key"
                class="profileCard"
                :title="`${card.name} • 投入率 ${formatPercentValue(card.slotRatePct)} • 出現 ${formatPercentValue(card.inclusionPct)}`"
              >
                <div class="profileCard__imageWrap">
                  <img
                    v-if="card.image && !failedCardImages[card.key]"
                    class="profileCard__image"
                    :src="card.image"
                    :alt="card.name"
                    crossorigin="anonymous"
                    draggable="false"
                    @error="onCardImageError(card.key)"
                  />

                  <div v-else class="profileCard__fallback">
                    <div class="profileCard__fallbackName">{{ card.name }}</div>
                    <div class="profileCard__fallbackCode mono">
                      {{ card.set || "?" }} {{ card.number || card.code || "?" }}
                    </div>
                  </div>

                  <span
                    class="profileCard__rate mono"
                    :class="{ 'profileCard__rate--count': rightDeckMode === 'sample' }"
                  >
                    <template v-if="rightDeckMode === 'sample'">
                      <img class="profileCard__rateIcon" :src="twoCopyDiskIcon" alt="" draggable="false" />
                      <span class="profileCard__rateDivider" aria-hidden="true"></span>
                      <span class="profileCard__rateText">{{ card.badgeText }}</span>
                    </template>
                    <template v-else>
                      {{ formatPercentValue(card.slotRatePct) }}
                    </template>
                  </span>

                  
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="exportStageActive" class="export-stage" aria-hidden="true">
      <section
        v-for="panel in exportRenderedTopDeckPanels"
        :key="`export-card-panel-${panel.key}`"
        :ref="(el) => setTopDeckExportPanelRef(el, panel.key)"
        class="export-panel export-card-panel"
      >
        <div class="export-panel__head">
          <div>
            <span class="panel-kicker panel-kicker--visible mono">
              {{ isZhUi ? `TOP ${panel.index + 1}` : `TOP ${panel.index + 1}` }}
            </span>
            <h3>{{ panel.displayName }}</h3>
            <p>{{ isZhUi ? "卡片投入率" : "Card inclusion" }}</p>
          </div>

          <div class="sprite-stack sprite-stack--export">
            <img
              v-for="(sprite, index) in panel.spriteUrls"
              :key="`export-card-title-${panel.key}-${sprite}-${index}`"
              class="sprite-chip sprite-chip--export"
              :src="sprite"
              :alt="panel.displayName"
              draggable="false"
            />
          </div>
        </div>

        <div class="decklist-groups export-card-groups">
          <section
            v-for="group in panel.groups"
            :key="`export-card-group-${panel.key}-${group.key}`"
            class="decklist-group"
          >
            <header class="decklist-group__header">
              <h4 class="decklist-group__title">{{ group.label }}</h4>
              <span class="decklist-group__count mono">{{ group.cards.length }}</span>
            </header>

            <div class="cardsGrid cardsGrid--profile cardsGrid--rates">
              <article
                v-for="card in group.cards"
                :key="`export-card-${panel.key}-${card.key}`"
                class="profileCard profileCard--breakdown"
                :title="card.title"
              >
                <div class="profileCard__imageWrap profileCard__imageWrap--breakdown">
                  <img
                    v-if="card.image && !failedCardImages[card.key]"
                    class="profileCard__image"
                    :src="card.image"
                    :alt="card.name"
                    crossorigin="anonymous"
                    draggable="false"
                    @error="onCardImageError(card.key)"
                  />
                  <div v-else class="profileCard__fallback">
                    <div class="profileCard__fallbackName">{{ card.name }}</div>
                  </div>
                </div>

                <div
                  class="profileCard__stats"
                  :style="{
                    '--one-rate': `${card.oneCopyPct}%`,
                    '--two-rate': `${card.twoCopyPct}%`,
                  }"
                >
                  <div class="profileCard__rateDial">
                    <span class="profileCard__rateDialLabel">{{ isZhUi ? "投入率" : "Rate" }}</span>
                    <strong class="profileCard__rateDialValue mono">{{ card.badgeText }}</strong>
                  </div>

                  <div class="profileCard__copyBreakdown">
                    <span class="profileCard__copyStat profileCard__copyStat--two">
                      <img class="profileCard__copyIcon" :src="twoCopyDiskIcon" alt="" draggable="false" />
                      <span class="profileCard__copyDivider" aria-hidden="true"></span>
                      <strong class="profileCard__copyValue mono">{{ formatPercentValue(card.twoCopyPct) }}</strong>
                    </span>
                    <span class="profileCard__copyStat profileCard__copyStat--one">
                      <img class="profileCard__copyIcon" :src="oneCopyDiskIcon" alt="" draggable="false" />
                      <span class="profileCard__copyDivider" aria-hidden="true"></span>
                      <strong class="profileCard__copyValue mono">{{ formatPercentValue(card.oneCopyPct) }}</strong>
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>

      <section
        v-for="panel in exportSampleDeckPanels"
        :key="`export-sample-panel-${panel.key}`"
        :ref="(el) => setSampleDeckExportPanelRef(el, panel.key)"
        class="export-panel export-sample-panel"
      >
        <div v-if="false" class="export-panel__head">
          <div>
            <span class="panel-kicker panel-kicker--visible mono">
              {{ isZhUi ? `TOP ${panel.index + 1} 牌組` : `TOP ${panel.index + 1} DECKLIST` }}
            </span>
            <h3>{{ panel.displayName }}</h3>
            <p>{{ panel.sample?.player }} | {{ panel.sample?.placeLabel }}</p>
          </div>

          <div class="sprite-stack sprite-stack--export">
            <img
              v-for="(sprite, index) in panel.spriteUrls"
              :key="`export-sample-title-${panel.key}-${sprite}-${index}`"
              class="sprite-chip sprite-chip--export"
              :src="sprite"
              :alt="panel.displayName"
              draggable="false"
            />
          </div>
        </div>

        <div class="cardsGrid cardsGrid--profile export-sample-grid">
          <article
            v-for="card in panel.cards"
            :key="`export-sample-${panel.key}-${card.key}`"
            class="profileCard"
            :title="card.title"
          >
            <div class="profileCard__imageWrap">
              <img
                v-if="card.image && !failedCardImages[card.key]"
                class="profileCard__image"
                :src="card.image"
                :alt="card.name"
                crossorigin="anonymous"
                draggable="false"
                @error="onCardImageError(card.key)"
              />
              <div v-else class="profileCard__fallback">
                <div class="profileCard__fallbackName">{{ card.name }}</div>
              </div>
              <span class="profileCard__rate profileCard__rate--count mono">
                <img class="profileCard__rateIcon" :src="twoCopyDiskIcon" alt="" draggable="false" />
                <span class="profileCard__rateDivider" aria-hidden="true"></span>
                <span class="profileCard__rateText">{{ card.badgeText }}</span>
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>



    <DeckDiscussionPanel
      v-if="!props.autoDownloadCreatorPack"
      :deck-key="resolvedDeckKey"
      :deck-name="displayDeckNameEn || displayDeckName"
    />

    <section v-if="!props.autoDownloadCreatorPack" class="table-card">
      <div class="section-head">
        <h2 class="section-title">{{ isZhUi ? "最佳成績" : "Best Finishes" }}</h2>
      </div>

      <div class="table-scroll">
        <table class="results-table">
          <thead>
            <tr>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('player')">
                  {{ isZhUi ? "玩家" : "Player" }} <span class="sort-mark">{{ finishSortMark("player") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('tournamentName')">
                  {{ isZhUi ? "賽事" : "Tournament" }} <span class="sort-mark">{{ finishSortMark("tournamentName") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('dateMs')">
                  {{ isZhUi ? "日期" : "Date" }} <span class="sort-mark">{{ finishSortMark("dateMs") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('place')">
                  {{ isZhUi ? "排名" : "Place" }} <span class="sort-mark">{{ finishSortMark("place") }}</span>
                </button>
              </th>
              <th>{{ isZhUi ? "牌表" : "List" }}</th>
            </tr>
          </thead>

          <tbody v-if="paginatedBestFinishes.length > 0">
            <tr v-for="item in paginatedBestFinishes" :key="item.key">
              <td class="player-col">{{ item.player }}</td>
              <td class="tournament-col">{{ item.tournamentName }}</td>
              <td class="mono">{{ item.dateLabel }}</td>
              <td class="mono">{{ item.placeLabel }}</td>
              <td>
                <a
                  v-if="item.listUrl"
                  class="list-btn"
                  :href="item.listUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Deck
                </a>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="5" class="empty-table">目前沒有成績資料</td>
            </tr>
          </tbody>
        </table>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="changePage(1)"
          >
            {{ isZhUi ? "首頁" : "First" }}
          </button>
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            {{ isZhUi ? "上一頁" : "Prev" }}
          </button>
          <span class="pagination-info">
            {{ isZhUi ? `第 ${currentPage} / ${totalPages} 頁` : `Page ${currentPage} / ${totalPages}` }}
          </span>
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            {{ isZhUi ? "下一頁" : "Next" }}
          </button>
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="changePage(totalPages)"
          >
            {{ isZhUi ? "末頁" : "Last" }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getLocalizedDeckName } from "../assets/pokemonNames";
import {
  buildTierEmaScores,
  calculateTierScore,
  resolveDeckTier,
  type TierEmaInput,
} from "../lib/deckTier";
import { inTimeRange as matchesTimeFilter } from "../lib/playerEntries";
import oneCopyDiskIcon from "../assets/deck-disks/3.png";
import twoCopyDiskIcon from "../assets/deck-disks/4.png";
import cardsCatalogUrl from "../assets/limitless_dump/limitless_cards.json?url";
import {
  buildDeckProfileScopeKey,
  buildTopDecksScopeKey,
  loadDeckProfilePrecomputed,
  loadTopDecksPrecomputed,
  type PrecomputedDeckProfilePayload,
  type PrecomputedDeckProfileScope,
  type PrecomputedTopDeckRow,
  type PrecomputedTopDecksPayload,
} from "../lib/precomputedViews";
import {
  loadTournamentList,
  loadTournamentPairings,
  loadTournamentStandings,
} from "../lib/publicData";

const DeckDiscussionPanel = defineAsyncComponent(() => import("../components/DeckDiscussionPanel.vue"));

type AnyRecord = Record<string, any>;

const DAY_MS = 24 * 60 * 60 * 1000;
const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";
const MIN_SLOT_RATE_PCT = 10;
const CREATOR_EXPORT_TIERS = ["SSS", "SS", "S", "A", "B", "C"] as const;
const CREATOR_EXPORT_TIER_SET = new Set<string>(CREATOR_EXPORT_TIERS);
const CREATOR_EXPORT_PIXEL_RATIO = 1.5;

type LocaleCode = "zh" | "en";
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";
type SetFilterValue = "" | typeof PRESET_CURRENT_7 | typeof PRESET_CURRENT_14 | string;

interface TournamentListItem {
  id: string;
  name?: string;
  date?: string;
  players?: number;
  game?: string;
  format?: string;
}

interface VersionMarker {
  code: string;
  name: string;
  startMs: number;
}

interface VersionWindow extends VersionMarker {
  label: string;
  endMs: number;
}

interface IndexedTournament extends TournamentListItem {
  startMs: number;
  versionCode: string;
  versionName: string;
  versionLabel: string;
}

interface DeckIdentity {
  key: string;
  candidateKeys: string[];
  displayName: string;
  displayNameEn: string;
  spriteUrls: string[];
  iconKeys: string[];
}

interface NormalizedTournament {
  id: string;
  name: string;
  startMs: number;
  players: number | null;
  standings: AnyRecord[];
  pairings: AnyRecord[];
}

interface TierRow {
  deck: string;
  tier: string;
  score: number;
  usage: number;
  total_samples: number;
  rawName?: string;
  iconKeys?: string[];
  baselineTop32Samples?: number;
  weightedPoints?: number;
  emaScore?: number;
  top32SharePct?: number;
}

interface NormalizedDeckCard {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  count: number;
  image: string;
  category: string;
}

interface RawCatalogCard {
  id?: string;
  name?: string;
  set_code?: string;
  number?: string | number;
  page_line?: string;
  extra_text?: string;
  supertype?: string | null;
  subtypes?: unknown[];
  display_type?: string | null;
}

interface CatalogCardInfo {
  code: string;
  name: string;
  category: string;
}

interface CardAggregate {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  image: string;
  category: string;
  totalCopies: number;
  deckCount: number;
  oneCopyDeckCount: number;
  twoCopyDeckCount: number;
  slotRatePct: number;
  inclusionPct: number;
  avgCopies: number;
  oneCopyPct: number;
  twoCopyPct: number;
}

interface MatchupAggregate {
  key: string;
  displayName: string;
  spriteUrls: string[];
  wins: number;
  losses: number;
  draws: number;
  games: number;
  winRate: number;
}

interface CardGroup {
  key: string;
  label: string;
  cards: CardAggregate[];
}

interface DeckProfileAnalytics {
  totalStandingRows: number;
  targetStandingRows: number;
  totalSeenDeckRows: number;
  top4Counts: Record<1 | 2 | 3 | 4, number>;
  metaShare: number;
  winRate: number | null;
  wins: number;
  losses: number;
  draws: number;
  matchCount: number;
  cardsFlat: CardAggregate[];
  cardGroups: CardGroup[];
  featuredGoodMatchups: MatchupAggregate[];
  featuredBadMatchups: MatchupAggregate[];
  bestFinishes: FinishRow[];
  sampleDeck: SampleDeckEntry | null;
  targetSpriteUrls: string[];
  targetIconKeys?: string[];
  resolvedDeckDisplayName: string;
  resolvedDeckDisplayNameEn: string;
}

interface FinishRow {
  key: string;
  player: string;
  tournamentName: string;
  dateMs: number;
  dateLabel: string;
  place: number;
  players: number | null;
  placeLabel: string;
  listUrl: string;
}

interface SampleDeckEntry {
  tournamentId: string;
  tournamentName: string;
  player: string;
  dateMs: number;
  dateLabel: string;
  place: number;
  players: number | null;
  placeLabel: string;
  listUrl: string;
  cards: NormalizedDeckCard[];
}

interface RightDeckPanelCard {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  image: string;
  category: string;
  slotRatePct: number;
  inclusionPct: number;
  oneCopyPct: number;
  twoCopyPct: number;
  badgeText: string;
  title: string;
}

interface RightDeckPanelGroup {
  key: string;
  label: string;
  showLabel: boolean;
  cards: RightDeckPanelCard[];
}

type FinishSortKey = "player" | "tournamentName" | "dateMs" | "place";
type RightDeckMode = "cards" | "sample";
type CreatorPackAssetMode = "all" | "decklists";

interface Props {
  deck?: AnyRecord | null;
  deckKey?: string;
  autoDownloadCreatorPack?: boolean;
  creatorPackAssetMode?: CreatorPackAssetMode;
  tournaments?: AnyRecord[];
  filteredTournaments?: AnyRecord[];
  loadedFilteredTournamentCount?: number;
  standingsByTournament?: Record<string, AnyRecord[]>;
  pairingsByTournament?: Record<string, AnyRecord[]>;
  filters?: AnyRecord;
  locale?: string;
}

const props = withDefaults(defineProps<Props>(), {
  deck: null,
  deckKey: "",
  autoDownloadCreatorPack: false,
  creatorPackAssetMode: "all",
  tournaments: () => [],
  filteredTournaments: () => [],
  loadedFilteredTournamentCount: 0,
  standingsByTournament: () => ({}),
  pairingsByTournament: () => ({}),
  filters: () => ({}),
  locale: "zh-Hant",
});

const emit = defineEmits<{
  creatorPackFinished: [];
}>();

const route = useRoute();

const failedCardImages = ref<Record<string, boolean>>({});
const leftPanelRef = ref<HTMLElement | null>(null);
const deckPanelRef = ref<HTMLElement | null>(null);
const downloadingDeckPanel = ref(false);
const downloadingCreatorPack = ref(false);
const rightDeckMode = ref<RightDeckMode>("cards");

const heroCaptureRef = ref<HTMLElement | null>(null);
const deckCardsViewportRef = ref<HTMLElement | null>(null);
const deckCardsGridRef = ref<HTMLElement | null>(null);
const downloadingPanel = ref(false);
const deckViewportHeight = ref<number | null>(null);
const exportStageActive = ref(false);
const topDeckExportPanelRefs = new Map<string, HTMLElement>();
const sampleDeckExportPanelRefs = new Map<string, HTMLElement>();
const cardCatalogByCode = shallowRef(new Map<string, CatalogCardInfo>());
const cardCatalogByName = shallowRef(new Map<string, CatalogCardInfo[]>());
const cardCatalogLoaded = ref(false);
const autoCreatorStarted = ref(false);

let deckGridResizeObserver: ResizeObserver | null = null;

function getDeckGridColumns(viewportWidth: number) {
  if (viewportWidth <= 520) return 2;
  if (viewportWidth <= 720) return 3;
  if (viewportWidth <= 900) return 4;
  if (viewportWidth <= 1080) return 5;
  if (viewportWidth <= 1380) return 4;
  return 5;
}

function bindDeckGridObserver() {
  deckGridResizeObserver?.disconnect();
  deckGridResizeObserver = null;

  if (!deckCardsGridRef.value) return;

  deckGridResizeObserver = new ResizeObserver(() => {
    updateDeckViewportHeight();
  });

  deckGridResizeObserver.observe(deckCardsGridRef.value);
}

function handleDeckProfileResize() {
  updateDeckViewportHeight();
}

function updateDeckViewportHeight() {
  const grid = deckCardsGridRef.value;
  const total = rightDeckPanelCards.value.length;
  const groups = rightDeckPanelGroups.value;

  if (!grid || total <= 0) {
    deckViewportHeight.value = null;
    return;
  }

  const width = grid.clientWidth;
  if (!width) return;

  const visibleCards = Math.min(total, 20);
  const cols = getDeckGridColumns(window.innerWidth);
  const gap = 12;
  const cardWidth = (width - gap * (cols - 1)) / cols;
  const cardHeight = cardWidth * (7 / 5);
  let totalRows = 0;
  let totalRowGaps = 0;
  let visibleGroupCount = 0;
  let consumed = 0;

  for (const group of groups) {
    if (consumed >= visibleCards) break;

    const groupVisibleCards = Math.min(group.cards.length, visibleCards - consumed);
    if (groupVisibleCards <= 0) continue;

    const groupRows = Math.ceil(groupVisibleCards / cols);
    totalRows += groupRows;
    totalRowGaps += gap * Math.max(0, groupRows - 1);
    consumed += groupVisibleCards;

    if (group.showLabel) visibleGroupCount += 1;
  }

  const sectionHeaderHeight = rightDeckMode.value === "cards" ? 34 : 0;
  const sectionGap = rightDeckMode.value === "cards" ? 18 : 0;
  const sectionSpacing = visibleGroupCount * sectionHeaderHeight;
  const groupSpacing = Math.max(0, visibleGroupCount - 1) * sectionGap;

  deckViewportHeight.value = Math.ceil(
    cardHeight * totalRows + totalRowGaps + sectionSpacing + groupSpacing,
  );
}

const decklistViewportStyle = computed<Record<string, string | undefined>>(() => {
  if (!deckViewportHeight.value || rightDeckPanelCards.value.length <= 20) {
    return { maxHeight: undefined };
  }

  return {
    maxHeight: `${deckViewportHeight.value}px`,
  };
});

async function downloadDeckPanelPng() {
  if (downloadingPanel.value || !heroCaptureRef.value) return;

  downloadingPanel.value = true;

  const viewport = deckCardsViewportRef.value;
  const prevMaxHeight = viewport?.style.maxHeight ?? "";
  const prevOverflowY = viewport?.style.overflowY ?? "";

  try {
    if (viewport) {
      viewport.style.maxHeight = "none";
      viewport.style.overflowY = "visible";
    }

    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(heroCaptureRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "rgba(0,0,0,0)",
      filter: (node) => !(node instanceof HTMLElement && node.dataset.exportIgnore === "true"),
    });

    const link = document.createElement("a");
    const fileName =
      slugify(displayDeckNameEn.value || displayDeckName.value || analysisDeckKey.value) ||
      "deck-profile";

    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
  } catch (error) {
    console.error("[DeckProfile] downloadDeckPanelPng failed:", error);
  } finally {
    if (viewport) {
      viewport.style.maxHeight = prevMaxHeight;
      viewport.style.overflowY = prevOverflowY;
    }

    downloadingPanel.value = false;
  }
}

const finishSort = reactive<{
  key: FinishSortKey;
  dir: "asc" | "desc";
}>({
  key: "place",
  dir: "asc",
});

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(10);

/* -----------------------------
   route / external / fallback data
------------------------------ */

const internalTournaments = shallowRef<IndexedTournament[]>([]);
const loadingTournaments = ref(false);

const internalStandingsCache = reactive<Record<string, AnyRecord[]>>({});
const internalPairingsCache = reactive<Record<string, AnyRecord[]>>({});

const internalStandingsLoading = reactive<Record<string, boolean>>({});
const internalPairingsLoading = reactive<Record<string, boolean>>({});

const precomputedProfile = shallowRef<PrecomputedDeckProfilePayload | null>(null);
const precomputedProfileLoading = ref(false);
const precomputedProfileDeckKey = ref("");
const precomputedTopDecks = shallowRef<PrecomputedTopDecksPayload | null>(null);
const precomputedTopDecksLoading = ref(false);
const creatorTopDeckProfiles = shallowRef(new Map<string, PrecomputedDeckProfilePayload>());
const creatorTopDeckProfilesLoading = ref(false);



const hasExternalData = computed(() => {
  return (
    props.tournaments.length > 0 ||
    props.filteredTournaments.length > 0 ||
    Object.keys(props.standingsByTournament).length > 0 ||
    Object.keys(props.pairingsByTournament).length > 0
  );
});

const routeLang = computed<LocaleCode>(() => {
  return String(route.path).split("/")[1] === "en" ? "en" : "zh";
});

const activeLocale = computed(() => {
  return props.locale || (routeLang.value === "en" ? "en" : "zh-Hant");
});

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeTopCut(value: unknown): TopCutValue {
  const text = cleanDeckText(value).toLowerCase();
  if (["all", "64", "32", "16", "8", "4", "2", "1"].includes(text)) {
    return text as TopCutValue;
  }
  return "all";
}

function sanitizeProfileTime(value: unknown): ProfileTimeFilterValue {
  const text = cleanDeckText(value).toLowerCase();
  if (["all", "past7", "prev7", "past4w"].includes(text)) {
    return text as ProfileTimeFilterValue;
  }
  if (/^month:\d{4}-\d{2}$/.test(text)) {
    return text;
  }
  return "past7";
}

function sanitizeMinPlayers(value: unknown): number | undefined {
  const parsed = toNumber(value);
  if (parsed == null || !Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

/** Match TopDecks default: no `set` in URL → 近 7 天（僅目前版本）. Explicit `?set=` keeps「全部資料」. */
function parseRouteSetFilter(raw: unknown): SetFilterValue {
  if (raw === undefined || raw === null) {
    return PRESET_CURRENT_7;
  }
  return (cleanDeckText(raw) || "") as SetFilterValue;
}

const routeDeckKey = computed(() => cleanDeckText(firstQueryValue(route.params.deckKey)));
const resolvedDeckKey = computed(() => cleanDeckText(props.deckKey || routeDeckKey.value));

async function loadPrecomputedProfileForDeck(deckKey: string) {
  if (import.meta.env.SSR) return;

  const normalizedKey = cleanDeckText(deckKey);
  if (!normalizedKey) return;
  precomputedProfileDeckKey.value = normalizedKey;
  precomputedProfileLoading.value = true;

  try {
    precomputedProfile.value = await loadDeckProfilePrecomputed(normalizedKey);
  } catch (error) {
    precomputedProfile.value = null;
    console.warn("[DeckProfile] precomputed data unavailable; falling back to raw JSON.", error);
  } finally {
    if (precomputedProfileDeckKey.value === normalizedKey) {
      precomputedProfileLoading.value = false;
    }
  }
}

async function loadCreatorTopDecks() {
  if (import.meta.env.SSR || precomputedTopDecks.value || precomputedTopDecksLoading.value) return;

  precomputedTopDecksLoading.value = true;

  try {
    precomputedTopDecks.value = await loadTopDecksPrecomputed();
  } catch (error) {
    precomputedTopDecks.value = null;
    console.warn("[DeckProfile] top decks precomputed data unavailable for creator pack.", error);
  } finally {
    precomputedTopDecksLoading.value = false;
  }
}

const routeFilters = computed(() => {
  return {
    set: parseRouteSetFilter(firstQueryValue(route.query.set)),
    topCut: sanitizeTopCut(firstQueryValue(route.query.topCut)),
    time: sanitizeProfileTime(firstQueryValue(route.query.time)),
    minPlayers: sanitizeMinPlayers(firstQueryValue(route.query.minPlayers)),
  };
});

const activeFilters = computed(() => {
  if (hasExternalData.value && Object.keys(props.filters).length > 0) {
    return {
      set: cleanDeckText(props.filters?.set) as SetFilterValue,
      topCut: sanitizeTopCut(props.filters?.topCut),
      time: sanitizeProfileTime(props.filters?.time),
      minPlayers: sanitizeMinPlayers(props.filters?.minPlayers),
    };
  }

  return routeFilters.value;
});

type ProfileTimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;

interface ProfileScopeFilters {
  time: ProfileTimeFilterValue;
  topCut: TopCutValue;
}

const isZhUi = computed(() => routeLang.value === "zh");

const TOP_CUT_OPTIONS: TopCutValue[] = ["all", "64", "32", "16", "8", "4", "2", "1"];

function topCutLabel(value: TopCutValue) {
  if (value === "all") return isZhUi.value ? "全部" : "All";
  return isZhUi.value ? `前 ${value}` : `Top ${value}`;
}

function tierClassName(tier: unknown) {
  const token = cleanDeckText(tier)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return token ? `tier-badge--${token}` : "";
}

function profileTimeSummaryLabel(value: ProfileTimeFilterValue) {
  if (value === "all") return isZhUi.value ? "全部時間" : "All time";
  if (value === "past7") return isZhUi.value ? "近 7 天" : "Past 7 days";
  if (value === "past4w") return isZhUi.value ? "近 4 週" : "Past 4 weeks";

  if (value === "prev7") return isZhUi.value ? "前 7 天" : "Previous 7 days";

  if (String(value).startsWith("month:")) {
    const ym = String(value).slice("month:".length);
    const [yS, mS] = ym.split("-");
    const y = Number(yS);
    const m = Number(mS);

    if (y && m) {
      return isZhUi.value ? `${y}年${m}月` : ym;
    }
  }

  return isZhUi.value ? "自訂時間" : "Custom time";
}

function profileTopCutSummaryLabel(value: TopCutValue) {
  if (value === "all") return isZhUi.value ? "Top Cut：全部" : "Top Cut: All";
  return isZhUi.value ? `Top Cut：前 ${value}` : `Top Cut: Top ${value}`;
}

const leftPanelSummaryText = computed(() => {
  return [
    profileTimeSummaryLabel(leftPanelFilters.time),
    profileTopCutSummaryLabel(leftPanelFilters.topCut),
  ]
    .filter(Boolean)
    .join(" · ");
});

const leftPanelFilters = reactive<ProfileScopeFilters>({
  time: "past7",
  topCut: "all",
});

const rightCardFilters = reactive<ProfileScopeFilters>({
  time: "past7",
  topCut: "all",
});

watch(
  () => activeFilters.value.topCut,
  (value) => {
    leftPanelFilters.topCut = value || "all";
    rightCardFilters.topCut = value || "all";
  },
  { immediate: true },
);

watch(
  () => activeFilters.value.time,
  (value) => {
    const nextValue = sanitizeProfileTime(value);
    leftPanelFilters.time = nextValue;
    rightCardFilters.time = nextValue;
  },
  { immediate: true },
);

watch(
  () => resolvedDeckKey.value,
  (deckKey) => {
    if (!deckKey || hasExternalData.value) return;
    void loadPrecomputedProfileForDeck(deckKey);
  },
  { immediate: true },
);

const activePrecomputedProfileScope = computed<PrecomputedDeckProfileScope | null>(() => {
  if (hasExternalData.value || !precomputedProfile.value) return null;
  if ((activeFilters.value.minPlayers ?? 0) > 0) return null;

  const exactKey = buildDeckProfileScopeKey({
    set: String(activeFilters.value.set ?? ""),
    time: String(leftPanelFilters.time),
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  const exact = precomputedProfile.value.scopes[exactKey];
  if (exact) return exact;

  const currentVersion = currentVersionWindow.value;
  const isCurrentVersionPast7 =
    currentVersion &&
    activeFilters.value.set === currentVersion.code &&
    leftPanelFilters.time === "past7";

  if (isCurrentVersionPast7) {
    const current7Key = buildDeckProfileScopeKey({
      set: PRESET_CURRENT_7,
      time: "past7",
      topCut: leftPanelFilters.topCut,
      minPlayers: activeFilters.value.minPlayers,
    });

    return precomputedProfile.value.scopes[current7Key] ?? null;
  }

  return null;
});



function utcMs(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
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
];

const VERSION_WINDOWS: VersionWindow[] = VERSION_MARKERS.map((item, index, arr) => ({
  ...item,
  label: `${item.code} - ${item.name}`,
  endMs: arr[index + 1]?.startMs ?? Number.POSITIVE_INFINITY,
}));

function parseMs(value: unknown): number {
  const ms = Date.parse(String(value ?? ""));
  return Number.isFinite(ms) ? ms : NaN;
}

function inferVersionByStartMs(ms: number): VersionWindow | null {
  let hit: VersionWindow | null = null;

  for (const version of VERSION_WINDOWS) {
    if (ms >= version.startMs) {
      hit = version;
    } else {
      break;
    }
  }

  return hit;
}

function startOfUtcDayMs(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
}

const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

function activeTopDeckSetValue() {
  const setValue = String(activeFilters.value.set ?? "");
  if (setValue === PRESET_CURRENT_7 || setValue === PRESET_CURRENT_14) {
    return currentVersionWindow.value?.code ?? "";
  }
  return setValue;
}

const activeCreatorTopDeckScope = computed(() => {
  const payload = precomputedTopDecks.value;
  if (!payload) return null;

  const primaryKey = buildTopDecksScopeKey({
    time: String(leftPanelFilters.time),
    set: activeTopDeckSetValue(),
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  const primary = payload.scopes[primaryKey];
  if (primary) return primary;

  const fallbackKey = buildTopDecksScopeKey({
    time: String(leftPanelFilters.time),
    set: "",
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  return payload.scopes[fallbackKey] ?? null;
});

const creatorPreviousTopDeckScope = computed(() => {
  const payload = precomputedTopDecks.value;
  if (!payload) return null;

  const primaryKey = buildTopDecksScopeKey({
    time: "prev7",
    set: activeTopDeckSetValue(),
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  const primary = payload.scopes[primaryKey];
  if (primary) return primary;

  const fallbackKey = buildTopDecksScopeKey({
    time: "prev7",
    set: "",
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  return payload.scopes[fallbackKey] ?? null;
});

const creatorTopDeckRows = computed(() =>
  (activeCreatorTopDeckScope.value?.rows ?? []).filter((row) =>
    CREATOR_EXPORT_TIER_SET.has(cleanDeckText(row.tier).toUpperCase()),
  ),
);

const creatorDefaultDeckKey = computed(() => cleanDeckText(creatorTopDeckRows.value[0]?.key));

function findDeckProfileScopeFromPayload(payload: PrecomputedDeckProfilePayload | null) {
  if (!payload) return null;

  const exactKey = buildDeckProfileScopeKey({
    set: String(activeFilters.value.set ?? ""),
    time: String(leftPanelFilters.time),
    topCut: leftPanelFilters.topCut,
    minPlayers: activeFilters.value.minPlayers,
  });

  const exact = payload.scopes[exactKey];
  if (exact) return exact;

  const currentVersion = currentVersionWindow.value;
  const isCurrentVersionPast7 =
    currentVersion &&
    activeFilters.value.set === currentVersion.code &&
    leftPanelFilters.time === "past7";

  if (isCurrentVersionPast7 || activeFilters.value.set === PRESET_CURRENT_7) {
    const current7Key = buildDeckProfileScopeKey({
      set: PRESET_CURRENT_7,
      time: "past7",
      topCut: leftPanelFilters.topCut,
      minPlayers: activeFilters.value.minPlayers,
    });

    return payload.scopes[current7Key] ?? null;
  }

  return null;
}

watch(
  () => (props.autoDownloadCreatorPack ? creatorDefaultDeckKey.value : ""),
  (deckKey) => {
    if (!deckKey || hasExternalData.value) return;
    void loadPrecomputedProfileForDeck(deckKey);
  },
);

watch(
  () => (props.autoDownloadCreatorPack ? creatorTopDeckRows.value.map((row) => row.key).join("|") : ""),
  async () => {
    if (!props.autoDownloadCreatorPack || creatorTopDeckRows.value.length === 0) return;

    const missing = creatorTopDeckRows.value.filter(
      (row) => !creatorTopDeckProfiles.value.has(row.key),
    );

    if (missing.length === 0) return;

    creatorTopDeckProfilesLoading.value = true;

    try {
      const loaded = new Map(creatorTopDeckProfiles.value);
      await Promise.all(
        missing.map(async (row) => {
          try {
            loaded.set(row.key, await loadDeckProfilePrecomputed(row.key));
          } catch (error) {
            console.warn("[DeckProfile] creator pack deck profile unavailable:", row.key, error);
          }
        }),
      );
      creatorTopDeckProfiles.value = loaded;
    } finally {
      creatorTopDeckProfilesLoading.value = false;
    }
  },
);

function normalizeTournamentIndex(raw: TournamentListItem): IndexedTournament | null {
  if (!raw?.id) return null;

  const source = raw as AnyRecord;
  const startMs = parseMs(source.date ?? source.startAt ?? source.start_at ?? source.createdAt);
  if (!Number.isFinite(startMs)) return null;

  const version = inferVersionByStartMs(startMs);

  return {
    ...raw,
    startMs,
    versionCode: version?.code ?? "",
    versionName: version?.name ?? "Unknown",
    versionLabel: version?.label ?? "Unknown",
  };
}

async function loadTournaments() {
  loadingTournaments.value = true;

  try {
    const rows = await loadTournamentList<TournamentListItem[]>();
    const dedup = new Map<string, IndexedTournament>();

    for (const row of rows ?? []) {
      const normalized = normalizeTournamentIndex(row);
      if (!normalized) continue;
      if (!dedup.has(normalized.id)) {
        dedup.set(normalized.id, normalized);
      }
    }

    internalTournaments.value = Array.from(dedup.values()).sort((a, b) => b.startMs - a.startMs);
  } catch (error) {
    internalTournaments.value = [];
    console.error("[DeckProfile] loadTournaments failed:", error);
  } finally {
    loadingTournaments.value = false;
  }
}

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(internalStandingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(internalPairingsCache, id);
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const count = Math.max(1, Math.min(limit, queue.length));

  await Promise.all(
    Array.from({ length: count }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item === undefined) return;
        await worker(item);
      }
    }),
  );
}

async function ensureStandingsForIds(ids: string[]) {
  const missing = ids.filter((id) => !hasStandings(id) && !internalStandingsLoading[id]);
  if (missing.length === 0) return;

  await runWithConcurrency(missing, 4, async (id) => {
    internalStandingsLoading[id] = true;
    try {
      const rows = await loadTournamentStandings<AnyRecord[]>(id);
      internalStandingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      internalStandingsCache[id] = [];
    } finally {
      internalStandingsLoading[id] = false;
    }
  });
}

async function ensurePairingsForIds(ids: string[]) {
  const missing = ids.filter((id) => !hasPairings(id) && !internalPairingsLoading[id]);
  if (missing.length === 0) return;

  await runWithConcurrency(missing, 3, async (id) => {
    internalPairingsLoading[id] = true;
    try {
      const rows = await loadTournamentPairings<AnyRecord[]>(id);
      internalPairingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      internalPairingsCache[id] = [];
    } finally {
      internalPairingsLoading[id] = false;
    }
  });
}

const internalFilteredTournaments = computed(() => {
  const list = internalTournaments.value;
  const setValue = activeFilters.value.set;
  const minPlayers = activeFilters.value.minPlayers;

  let filtered = list;

  if (!setValue) {
    filtered = list;
  } else if (setValue === PRESET_CURRENT_7 || setValue === PRESET_CURRENT_14) {
    const current = currentVersionWindow.value;
    if (!current) return [];

    const days = setValue === PRESET_CURRENT_7 ? 7 : 14;
    const todayUtcStart = startOfUtcDayMs(Date.now());
    const rollingStartMs = todayUtcStart - (days - 1) * DAY_MS;
    const effectiveStartMs = Math.max(rollingStartMs, current.startMs);

    filtered = list.filter(
      (t) =>
        t.versionCode === current.code &&
        t.startMs >= effectiveStartMs &&
        t.startMs < current.endMs,
    );
  } else {
    filtered = list.filter((t) => t.versionCode === setValue);
  }

  if (minPlayers != null) {
    filtered = filtered.filter((t) => Number(t.players ?? 0) >= minPlayers);
  }

  return filtered;
});

const internalFilteredTournamentIds = computed(() =>
  internalFilteredTournaments.value.map((t) => t.id),
);

const internalRelevantPairingIds = computed(() => {
  if (hasExternalData.value) return [];

  const relevant: string[] = [];

  for (const tournament of internalFilteredTournaments.value) {
    const standings = internalStandingsCache[tournament.id];
    if (!Array.isArray(standings) || standings.length === 0) continue;

    const hasQualifiedTarget = standings.some((row) => {
      const place = getPlace(row);
      if (!qualifiesByTopCut(place, leftPanelFilters.topCut)) return false;
      return isTargetDeckIdentity(extractDeckIdentityFromRow(row));
    });

    if (hasQualifiedTarget) {
      relevant.push(tournament.id);
    }
  }

  return relevant;
});

watch(
  () => `${internalFilteredTournamentIds.value.join("|")}|${precomputedProfileLoading.value}|${Boolean(activePrecomputedProfileScope.value)}`,
  () => {
    if (hasExternalData.value) return;
    if (precomputedProfileLoading.value || activePrecomputedProfileScope.value) return;
    if (internalFilteredTournamentIds.value.length === 0) return;
    void ensureStandingsForIds(internalFilteredTournamentIds.value);
  },
  { immediate: true },
);

watch(
  () => `${leftPanelFilters.topCut}|${internalRelevantPairingIds.value.join("|")}|${precomputedProfileLoading.value}|${Boolean(activePrecomputedProfileScope.value)}`,
  () => {
    if (hasExternalData.value) return;
    if (precomputedProfileLoading.value || activePrecomputedProfileScope.value) return;
    if (internalRelevantPairingIds.value.length === 0) return;
    void ensurePairingsForIds(internalRelevantPairingIds.value);
  },
  { immediate: true },
);

onMounted(async () => {
  void loadDeckProfileCardCatalog();

  if (props.autoDownloadCreatorPack) {
    void loadCreatorTopDecks();
  }

  if (!hasExternalData.value && !props.autoDownloadCreatorPack) {
    void loadTournaments();
  }

  window.addEventListener("resize", handleDeckProfileResize);

  await nextTick();
  bindDeckGridObserver();
  updateDeckViewportHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleDeckProfileResize);
  deckGridResizeObserver?.disconnect();
});

/* -----------------------------
   基礎 utilities
------------------------------ */

function onCardImageError(key: string) {
  failedCardImages.value = {
    ...failedCardImages.value,
    [key]: true,
  };
}

watch(
  () => resolvedDeckKey.value,
  () => {
    failedCardImages.value = {};
  },
);

function cleanDeckText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: unknown) {
  return cleanDeckText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeEntityKey(value: unknown) {
  return cleanDeckText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[\s_/]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDeckKey(value: unknown) {
  return normalizeEntityKey(value);
}

function uniqStrings(values: unknown[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const text = cleanDeckText(value);
    if (!text) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }

  return output;
}

function firstText(values: unknown[]) {
  for (const value of values) {
    const text = cleanDeckText(value);
    if (text) return text;
  }
  return "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const text = cleanDeckText(value).replace(/,/g, "");
    if (!text) return null;
    const num = Number(text);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function unwrapCollection<T = AnyRecord>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const source = value as AnyRecord;
    for (const key of [
      "rows",
      "items",
      "data",
      "results",
      "list",
      "standings",
      "pairings",
      "matches",
    ]) {
      if (Array.isArray(source[key])) return source[key] as T[];
    }
  }

  return [];
}

function parseDateMs(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1_000_000_000_000) return value;
    if (value > 1_000_000_000) return value * 1000;
  }

  const text = cleanDeckText(value);
  if (!text) return 0;

  if (/^\d+$/.test(text)) {
    const num = Number(text);
    if (num > 1_000_000_000_000) return num;
    if (num > 1_000_000_000) return num * 1000;
  }

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const date = new Date(ms);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function formatPercentValue(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0%";

  if (Math.abs(safe - Math.round(safe)) < 0.05) {
    return `${Math.round(safe)}%`;
  }

  return `${safe.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatPercentValue(value * 100);
}

function formatCopies(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0";
  if (Math.abs(safe - Math.round(safe)) < 0.05) return String(Math.round(safe));
  return safe.toFixed(1).replace(/\.0$/, "");
}

const SEMI_GAUGE_ARC_LENGTH = Math.PI * 50;

function gaugeDasharray(value: number | null | undefined) {
  const fraction = Math.max(0, Math.min(1, Number(value ?? 0)));
  const filled = SEMI_GAUGE_ARC_LENGTH * fraction;
  return `${filled} ${SEMI_GAUGE_ARC_LENGTH}`;
}

function cardInitials(value: unknown) {
  const text = cleanDeckText(value);
  if (!text) return "??";

  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }

  return text.slice(0, 2).toUpperCase();
}

function qualifiesByTopCut(place: number | null, topCutRaw: unknown) {
  const topCut = toNumber(topCutRaw);
  if (topCut == null || topCut <= 0) return true;
  if (place == null) return false;
  return place <= topCut;
}

function mapNumberRecord(input: Record<string, number>, fn: (value: number) => number) {
  const out: Record<string, number> = {};

  for (const [key, value] of Object.entries(input)) {
    out[key] = fn(value);
  }

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

  return Object.fromEntries(
    entries.map(([key, value]) => [key, (value - min) / (max - min)]),
  );
}

function tierLabel(score: number, nextScoreGap: number, isLeader: boolean) {
  return resolveDeckTier(score, nextScoreGap, isLeader);
}

function compareText(a: unknown, b: unknown) {
  const left = String(a ?? "");
  const right = String(b ?? "");

  return left.localeCompare(
    right,
    activeLocale.value === "en" ? "en" : "zh-Hant",
    {
      sensitivity: "base",
    },
  );
}

/* -----------------------------
   圖片 / sprite / icon
------------------------------ */

function normalizeImageCandidate(value: unknown) {
  const raw = cleanDeckText(value);
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    raw.startsWith("/") ||
    raw.startsWith("./") ||
    raw.startsWith("../") ||
    /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(raw)
  ) {
    return raw;
  }

  return "";
}

function pushImageValue(value: unknown, output: string[]) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) pushImageValue(item, output);
    return;
  }

  if (typeof value === "string") {
    const normalized = normalizeImageCandidate(value);
    if (normalized) output.push(normalized);
    return;
  }

  if (value && typeof value === "object") {
    const record = value as AnyRecord;

    for (const key of [
      "url",
      "src",
      "image",
      "img",
      "thumb",
      "icon",
      "sprite",
      "small",
      "large",
      "art",
    ]) {
      if (record[key]) pushImageValue(record[key], output);
    }
  }
}

function extractSpriteUrls(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];

  const output: string[] = [];

  for (const candidate of [
    source.sprites,
    source.icons,
    source.images,
    source.image,
    source.img,
    source.sprite,
    source.deckImage,
    source.deckImages,
    source.deckSprite,
    source.pokemonImages,
    source.pokemonSprites,
    source.deck?.sprites,
    source.deck?.icons,
    source.deck?.images,
    source.deck?.image,
    source.deck?.img,
    source.deck?.sprite,
    source.deck?.pokemonImages,
    source.deck?.pokemonSprites,
  ]) {
    pushImageValue(candidate, output);
  }

  return uniqStrings(output).slice(0, 3);
}

function normalizeStringArray(value: unknown): string[] {
  const input = Array.isArray(value)
    ? value
    : value == null
      ? []
      : [value];

  const mapped = input
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        const hit =
          (item as AnyRecord).src ??
          (item as AnyRecord).url ??
          (item as AnyRecord).path ??
          (item as AnyRecord).name ??
          "";
        return String(hit).trim();
      }

      return String(item).trim();
    })
    .filter(Boolean);

  return [...new Set(mapped)];
}

function humanizeDeckId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();

      if (/^[ab]\d+[a-z]?$/i.test(part)) {
        return part.toUpperCase();
      }

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
  const isSetToken = (t: string) => /^[ab]\d+[a-z]?$/.test(t);

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

  while ((m = re.exec(s)) && hits.length < 2) {
    hits.push(m.index + m[0].length);
  }

  if (hits.length < 2) {
    return s ? [s] : [];
  }

  const firstEnd = hits[0];
  const secondEnd = hits[1];

  const part1 = s.slice(0, firstEnd).trim();
  const part2 = s.slice(firstEnd, secondEnd).trim();

  return [part1, part2].filter(Boolean);
}

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

    if (key.startsWith("mega-")) {
      queue.push(`${key.slice(5)}-mega`);
    }

    if (key.endsWith("-mega")) {
      queue.push(`mega-${key.slice(0, -5)}`);
    }

    if (key.endsWith("-ex")) {
      queue.push(key.slice(0, -3));
    }

    if (key.endsWith("-gx")) {
      queue.push(key.slice(0, -3));
    }

    if (key.endsWith("-v")) {
      queue.push(key.slice(0, -2));
    }
  }

  return [...seen];
}

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const deckIconUrlMap = new Map<string, string>();

for (const [filePath, url] of Object.entries(deckIconModules)) {
  const fileName = filePath.split("/").pop() ?? "";
  for (const key of rawIconVariants(fileName)) {
    if (!deckIconUrlMap.has(key)) {
      deckIconUrlMap.set(key, url);
    }
  }
}

function resolveDeckSpriteUrlsFromIconKeys(iconKeys: string[]) {
  const urls: string[] = [];

  for (const icon of iconKeys) {
    const direct = normalizeImageCandidate(icon);
    if (direct) {
      urls.push(direct);
      continue;
    }

    for (const key of rawIconVariants(icon)) {
      const hit = deckIconUrlMap.get(key);
      if (hit) urls.push(hit);
    }
  }

  return uniqStrings(urls).slice(0, 3);
}

function extractDeckIconKeys(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];
  const deck = source.deck ?? {};

  const direct = normalizeStringArray(
    deck?.icons ??
      deck?.icon ??
      deck?.pokemon ??
      deck?.pokemons ??
      deck?.iconKeys ??
      source?.deckIconKeys,
  );

  if (direct.length > 0) {
    return direct.slice(0, 2);
  }

  const main =
    deck?.primaryIconKey ??
    deck?.mainIconKey ??
    source?.deckIconKeyMain ??
    source?.primaryIconKey ??
    source?.mainIconKey ??
    deck?.mainPokemon ??
    deck?.main;

  const sub =
    deck?.secondaryIconKey ??
    deck?.subIconKey ??
    source?.deckIconKeySub ??
    source?.secondaryIconKey ??
    source?.subIconKey ??
    deck?.subPokemon ??
    deck?.sub;

  const paired = normalizeStringArray([main, sub]);
  if (paired.length > 0) {
    return paired.slice(0, 2);
  }

  const fromId = parseTwoFromDeckId(
    firstText([
      deck?.id,
      deck?.deckKey,
      deck?.deck_key,
      deck?.archetypeKey,
      deck?.archetype_key,
      source?.deckKey,
      source?.deck_key,
      source?.archetypeKey,
      source?.archetype_key,
    ]),
  );
  if (fromId.length > 0) {
    return fromId.slice(0, 2);
  }

  const fromName = parseTwoFromDeckName(
    firstText([
      deck?.name,
      deck?.archetype,
      deck?.deckName,
      deck?.deck_name,
      source?.archetype,
      source?.archetypeName,
      source?.archetype_name,
      source?.deckName,
      source?.deck_name,
      source?.displayName,
      source?.display_name,
    ]),
  );

  return fromName.slice(0, 2);
}

function buildDerivedDeckKey(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return "";

  const deck = source.deck ?? {};
  const rawId = firstText([
    deck?.id,
    deck?.key,
    deck?.slug,
    deck?.deckKey,
    deck?.deck_key,
    deck?.archetypeKey,
    deck?.archetype_key,
    source?.deckKey,
    source?.deck_key,
    source?.archetypeKey,
    source?.archetype_key,
  ]);

  const rawName = firstText([
    deck?.name,
    deck?.archetype,
    deck?.deckName,
    deck?.deck_name,
    deck?.displayName,
    deck?.display_name,
    source?.archetype,
    source?.archetypeName,
    source?.archetype_name,
    source?.deckName,
    source?.deck_name,
    source?.deckDisplayName,
    source?.deck_display_name,
    source?.displayName,
    source?.display_name,
  ]);

  const iconKeys = extractDeckIconKeys(source);

  return rawId || slugify(rawName) || slugify(iconKeys.join("-"));
}

function stripDeckSetTokens(value: unknown) {
  const normalized = normalizeDeckKey(value);
  if (!normalized) return "";

  const stripped = normalized
    .split("-")
    .filter(Boolean)
    .filter((token) => !/^[ab]\d+[a-z]?$/.test(token))
    .join("-");

  return stripped || normalized;
}

function defaultDeckLabelFromKey(value: unknown) {
  const normalized = normalizeDeckKey(value);
  if (!normalized) return "";
  return humanizeDeckId(stripDeckSetTokens(normalized) || normalized);
}

function expandDeckCandidateKeys(values: unknown[]) {
  const out = new Set<string>();

  for (const value of values) {
    const normalized = normalizeDeckKey(value);
    if (normalized) out.add(normalized);

    const stripped = stripDeckSetTokens(value);
    if (stripped) out.add(stripped);
  }

  return [...out];
}

/* -----------------------------
   本機卡圖索引
------------------------------ */

const CARD_CODE_RE = /\b((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\b/i;

function normalizeSetCode(value: unknown) {
  const raw = String(value ?? "").trim().replace(/_/g, "-");
  if (!raw) return "";

  const promoMatch = raw.match(/^P-([A-Z])$/i);
  const promoSuffix = promoMatch?.[1];
  if (promoSuffix) {
    return `P-${promoSuffix.toUpperCase()}`;
  }

  const mainMatch = raw.match(/^([A-Z])(\d+)([A-Z]?)$/i);
  const prefix = mainMatch?.[1];
  const number = mainMatch?.[2];
  const suffix = mainMatch?.[3] ?? "";

  if (prefix && number) {
    return `${prefix.toUpperCase()}${number}${suffix.toLowerCase()}`;
  }

  return raw;
}

function normalizeCardCode(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "");

  if (!raw) return "";

  const match = raw.match(/^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$/i);
  const setCode = match?.[1];
  const cardNo = match?.[2];

  if (!setCode || !cardNo) return "";

  return `${normalizeSetCode(setCode)}-${cardNo.toLowerCase()}`;
}

function extractCardCodeFromText(value: unknown) {
  const text = String(value ?? "");
  const match = text.match(CARD_CODE_RE);
  const code = match?.[1];
  return code ? normalizeCardCode(code) : "";
}

function stripCardCodeFromName(value: unknown) {
  return cleanDeckText(
    String(value ?? "").replace(
      /\s*(?:\(((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\)|((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?))\s*$/i,
      "",
    ),
  );
}

function normalizeCardImageSet(value: unknown) {
  return String(value ?? "").trim().replace(/_/g, "-").toUpperCase();
}

function normalizeCardImageNumber(value: unknown) {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "";
  return /^\d+$/.test(raw) ? raw.padStart(3, "0") : raw;
}

function splitCardCodeParts(value: unknown) {
  const normalized = normalizeCardCode(value);
  const match = normalized.match(/^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$/i);

  return {
    set: normalizeCardImageSet(match?.[1] ?? ""),
    number: normalizeCardImageNumber(match?.[2] ?? ""),
  };
}

function buildTournamentReportCardBase(set: unknown, number: unknown) {
  const setKey = normalizeCardImageSet(set);
  const numberKey = normalizeCardImageNumber(number);

  if (!setKey || !numberKey) {
    return { setKey: "", base: "" };
  }

  return {
    setKey,
    base: `${setKey}_${numberKey}_EN_SM`,
  };
}

const rawCardImageModules = import.meta.glob(
  "../assets/limitless_dump/images/**/*.{png,jpg,jpeg,webp,avif}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

const tournamentReportCardImageMap = new Map<string, string>();
const localCardImageByCode = new Map<string, string>();
const localCardImageByName = new Map<string, string>();

for (const [filePath, url] of Object.entries(rawCardImageModules)) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const parts = normalizedPath.split("/");
  const folderForBase = normalizeCardImageSet(parts[parts.length - 2] ?? "");
  const setFolderForCode = normalizeSetCode(parts[parts.length - 2] ?? "");
  const fileName = parts[parts.length - 1] ?? "";
  const stem = fileName.replace(/\.[^.]+$/, "");
  const upperStem = stem.toUpperCase();

  if (upperStem) {
    tournamentReportCardImageMap.set(upperStem, url);

    if (folderForBase) {
      tournamentReportCardImageMap.set(`${folderForBase}/${upperStem}`, url);
    }
  }

  const directCode = normalizeCardCode(stem);
  if (directCode && !localCardImageByCode.has(directCode)) {
    localCardImageByCode.set(directCode, url);
  }

  if (setFolderForCode) {
    const match = upperStem.match(new RegExp(`^${folderForBase}_(\\d+[A-Z]?)_EN_SM$`));
    const numberPart = match?.[1];

    if (numberPart) {
      const codeFromFile = normalizeCardCode(`${setFolderForCode}-${numberPart.toLowerCase()}`);
      if (codeFromFile && !localCardImageByCode.has(codeFromFile)) {
        localCardImageByCode.set(codeFromFile, url);
      }
    }
  }

  const nameKey = slugify(stem);
  if (nameKey && !localCardImageByName.has(nameKey)) {
    localCardImageByName.set(nameKey, url);
  }
}

function resolveTournamentReportStyleCardImage(set: unknown, number: unknown) {
  const { setKey, base } = buildTournamentReportCardBase(set, number);
  if (!setKey || !base) return "";

  return (
    tournamentReportCardImageMap.get(`${setKey}/${base}`) ??
    tournamentReportCardImageMap.get(base) ??
    ""
  );
}

function normalizeMaybeAbsoluteUrl(value: unknown) {
  const raw = cleanDeckText(String(value ?? ""));
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    raw.startsWith("/")
  ) {
    return raw;
  }

  return "";
}

function pickCardCode(merged: Record<string, any>, rawName: string) {
  const candidates = [
    merged.code,
    merged.cardCode,
    merged.card_code,
    merged.cardId,
    merged.card_id,
    merged.identifier,
    merged.id,
    merged.set && merged.number ? `${merged.set}-${merged.number}` : "",
    merged.setCode && merged.number ? `${merged.setCode}-${merged.number}` : "",
    merged.set && merged.no ? `${merged.set}-${merged.no}` : "",
    merged.setCode && merged.no ? `${merged.setCode}-${merged.no}` : "",
    rawName,
  ];

  for (const candidate of candidates) {
    const direct = normalizeCardCode(candidate);
    if (direct) return direct;

    const embedded = extractCardCodeFromText(candidate);
    if (embedded) return embedded;
  }

  return "";
}

function resolveCardImageUrl(input: {
  set?: unknown;
  number?: unknown;
  code?: unknown;
  name?: unknown;
  fallbackImage?: unknown;
}) {
  const absolute = normalizeMaybeAbsoluteUrl(input.fallbackImage);
  if (absolute) return absolute;

  const bySetNumber = resolveTournamentReportStyleCardImage(input.set, input.number);
  if (bySetNumber) return bySetNumber;

  const normalizedCode = normalizeCardCode(input.code);
  if (normalizedCode) {
    const codeParts = splitCardCodeParts(normalizedCode);
    const byCodeParts = resolveTournamentReportStyleCardImage(codeParts.set, codeParts.number);
    if (byCodeParts) return byCodeParts;

    const byCode = localCardImageByCode.get(normalizedCode);
    if (byCode) return byCode;
  }

  const byName = localCardImageByName.get(slugify(input.name));
  if (byName) return byName;

  return "";
}

/* -----------------------------
   牌組 / 玩家 / 對局解析
------------------------------ */

function extractDeckCandidateTexts(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];

  const deck = source.deck ?? {};
  const metaDeck = source.meta?.deck ?? {};
  const derivedKey = buildDerivedDeckKey(source);

  return uniqStrings([
    derivedKey,

    source.deckKey,
    source.deck_key,
    source.archetypeKey,
    source.archetype_key,
    source.archetype,
    source.archetypeName,
    source.archetype_name,
    source.deckName,
    source.deck_name,
    source.deckDisplayName,
    source.deck_display_name,
    source.displayName,
    source.display_name,
    source.deckTitle,
    source.deck_title,
    source.variant,
    source.nameEn,
    source.name_en,
    source.displayNameEn,
    source.display_name_en,
    source.englishName,
    source.english_name,
    source.enName,
    source.en_name,

    source.meta?.deckName,
    source.meta?.deck_name,
    source.meta?.archetype,
    source.meta?.archetypeName,
    source.meta?.archetype_name,
    source.meta?.displayName,
    source.meta?.display_name,
    source.meta?.name,
    source.meta?.nameEn,
    source.meta?.name_en,

    deck.key,
    deck.slug,
    deck.id,
    deck.deckKey,
    deck.deck_key,
    deck.archetypeKey,
    deck.archetype_key,
    deck.archetype,
    deck.archetypeName,
    deck.archetype_name,
    deck.deckName,
    deck.deck_name,
    deck.deckDisplayName,
    deck.deck_display_name,
    deck.displayName,
    deck.display_name,
    deck.deckTitle,
    deck.deck_title,
    deck.title,
    deck.name,
    deck.nameEn,
    deck.name_en,
    deck.displayNameEn,
    deck.display_name_en,
    deck.englishName,
    deck.english_name,
    deck.enName,
    deck.en_name,

    metaDeck.key,
    metaDeck.slug,
    metaDeck.id,
    metaDeck.deckKey,
    metaDeck.deck_key,
    metaDeck.archetype,
    metaDeck.archetypeName,
    metaDeck.archetype_name,
    metaDeck.deckName,
    metaDeck.deck_name,
    metaDeck.displayName,
    metaDeck.display_name,
    metaDeck.title,
    metaDeck.name,
    metaDeck.nameEn,
    metaDeck.name_en,
    metaDeck.displayNameEn,
    metaDeck.display_name_en,
    metaDeck.englishName,
    metaDeck.english_name,
    metaDeck.enName,
    metaDeck.en_name,

    ...(Array.isArray(source.aliases) ? source.aliases : []),
    ...(Array.isArray(source.deck_aliases) ? source.deck_aliases : []),
    ...(Array.isArray(deck.aliases) ? deck.aliases : []),
    ...(Array.isArray(metaDeck.aliases) ? metaDeck.aliases : []),
  ]);
}

const analysisDeckKey = computed(() =>
  cleanDeckText(
    resolvedDeckKey.value ||
      (props.autoDownloadCreatorPack ? creatorDefaultDeckKey.value : ""),
  ),
);

const targetDeckKeySet = computed(() => {
  const deckSource =
    props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : null;

  // When the page is opened from a route like /top-decks/:deckKey, keep the
  // aggregation scoped to that exact deck row. Expanding aliases here can merge
  // nearby archetype variants and make the profile win rate diverge from TopDecks.
  if (!deckSource || Object.keys(deckSource).length === 0) {
    const exact = normalizeDeckKey(analysisDeckKey.value);
    return new Set(exact ? [exact] : []);
  }

  const candidates = uniqStrings([
    analysisDeckKey.value,
    buildDerivedDeckKey(deckSource),
    ...extractDeckCandidateTexts(deckSource),
  ]);

  return new Set(expandDeckCandidateKeys(candidates).filter(Boolean));
});

function extractDeckIdentityFromRow(row: AnyRecord): DeckIdentity {
  const candidateTexts = extractDeckCandidateTexts(row);
  const candidateKeys = expandDeckCandidateKeys(candidateTexts);
  const iconKeys = extractDeckIconKeys(row);
  const rawDisplayName = firstText([
    row.deckDisplayName,
    row.deck_display_name,
    row.displayName,
    row.display_name,
    row.deckName,
    row.deck_name,
    row.archetypeName,
    row.archetype_name,
    row.archetype,
    row.variant,

    row.deck?.deckDisplayName,
    row.deck?.deck_display_name,
    row.deck?.displayName,
    row.deck?.display_name,
    row.deck?.name,
    row.deck?.deckName,
    row.deck?.deck_name,
    row.deck?.archetypeName,
    row.deck?.archetype_name,
    row.deck?.archetype,
    row.deck?.title,

    row.meta?.deck?.displayName,
    row.meta?.deck?.display_name,
    row.meta?.deck?.name,
    row.meta?.deck?.deckName,
    row.meta?.deck?.deck_name,
    row.meta?.deck?.archetypeName,
    row.meta?.deck?.archetype_name,
    row.meta?.deck?.archetype,
  ]);

  const rawDisplayNameEn = firstText([
    row.displayNameEn,
    row.display_name_en,
    row.englishName,
    row.english_name,
    row.nameEn,
    row.name_en,
    row.enName,
    row.en_name,

    row.deck?.displayNameEn,
    row.deck?.display_name_en,
    row.deck?.englishName,
    row.deck?.english_name,
    row.deck?.nameEn,
    row.deck?.name_en,
    row.deck?.enName,
    row.deck?.en_name,

    row.meta?.deck?.displayNameEn,
    row.meta?.deck?.display_name_en,
    row.meta?.deck?.englishName,
    row.meta?.deck?.english_name,
    row.meta?.deck?.nameEn,
    row.meta?.deck?.name_en,
    row.meta?.deck?.enName,
    row.meta?.deck?.en_name,
  ]);

  const rawSourceName = firstText([rawDisplayNameEn, rawDisplayName]);
  const zhNameFromIcons = getLocalizedDeckName(rawSourceName, iconKeys, "zh");
  const enNameFromIcons = getLocalizedDeckName(rawSourceName, iconKeys, "en");
  const fallbackName = defaultDeckLabelFromKey(buildDerivedDeckKey(row) || candidateKeys[0] || "");

  return {
    key: candidateKeys[0] ?? normalizeDeckKey(buildDerivedDeckKey(row)),
    candidateKeys,
    displayName:
      routeLang.value === "zh"
        ? firstText([zhNameFromIcons, rawDisplayName, fallbackName]) || "Unknown Deck"
        : firstText([rawDisplayNameEn, rawDisplayName, enNameFromIcons, fallbackName]) || "Unknown Deck",
    displayNameEn: firstText([rawDisplayNameEn, enNameFromIcons, rawDisplayName, fallbackName]),
    spriteUrls: uniqStrings([
      ...extractSpriteUrls(row),
      ...resolveDeckSpriteUrlsFromIconKeys(iconKeys),
    ]).slice(0, 3),
    iconKeys,
  };
}

function isTargetDeckIdentity(identity: DeckIdentity) {
  if (!identity.candidateKeys.length || !targetDeckKeySet.value.size) return false;
  return identity.candidateKeys.some((key) => targetDeckKeySet.value.has(key));
}

function extractPlayerName(row: AnyRecord) {
  return firstText([
    typeof row.player === "string" ? row.player : "",
    row.player?.name,
    row.player?.displayName,
    row.player?.username,
    row.name,
    row.playerName,
    row.player_name,
    row.displayName,
    row.user?.name,
    row.user?.displayName,
    row.user?.username,
    row.account?.username,
    row.username,
  ]);
}

function normalizePotentialPlayerSlug(value: unknown) {
  return cleanDeckText(value)
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "");
}

function extractPlayerSlug(row: AnyRecord) {
  const explicit = firstText([
    row.playerSlug,
    row.player_slug,
    row.username,
    row.userName,
    row.player?.username,
    row.user?.username,
    row.account?.username,
    row.profile?.username,
    row.limitless?.username,
  ]);

  if (explicit) return explicit.toLowerCase();
  return normalizePotentialPlayerSlug(extractPlayerName(row));
}

function makePlayerKey(value: unknown) {
  return normalizeEntityKey(value);
}

function getPlace(row: AnyRecord) {
  return (
    toNumber(row.placing) ??
    toNumber(row.place) ??
    toNumber(row.rank) ??
    toNumber(row.position) ??
    toNumber(row.standing) ??
    null
  );
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

const resolvedStandingsByTournament = computed<Record<string, AnyRecord[]>>(() => ({
  ...internalStandingsCache,
  ...props.standingsByTournament,
}));

const resolvedPairingsByTournament = computed<Record<string, AnyRecord[]>>(() => ({
  ...internalPairingsCache,
  ...props.pairingsByTournament,
}));

function normalizeTournament(raw: AnyRecord): NormalizedTournament {
  const id =
    firstText([
      raw.id,
      raw.tournamentId,
      raw.tournament_id,
      raw.slug,
      raw.uid,
      raw.key,
      raw.name,
    ]) || crypto.randomUUID();

  const standingsFromResolved = unwrapCollection<AnyRecord>(resolvedStandingsByTournament.value[id]);
  const pairingsFromResolved = unwrapCollection<AnyRecord>(resolvedPairingsByTournament.value[id]);

  const resolvedStandings =
    standingsFromResolved.length > 0
      ? standingsFromResolved
      : unwrapCollection<AnyRecord>(
          raw.standings ??
            raw.standingRows ??
            raw.standingsRows ??
            raw.results ??
            raw.meta?.standings,
        );

  const resolvedPairings =
    pairingsFromResolved.length > 0
      ? pairingsFromResolved
      : unwrapCollection<AnyRecord>(
          raw.pairings ??
            raw.matches ??
            raw.rounds ??
            raw.games ??
            raw.meta?.pairings ??
            raw.meta?.matches,
        );

  const playerCount =
    toNumber(raw.players) ??
    toNumber(raw.playerCount) ??
    toNumber(raw.player_count) ??
    toNumber(raw.meta?.players) ??
    (Array.isArray(raw.players) ? raw.players.length : null);

  return {
    id,
    name: firstText([raw.name, raw.title, raw.tournamentName, raw.slug, id]) || id,
    startMs: parseDateMs(
      raw.startMs ??
        raw.startAt ??
        raw.start_at ??
        raw.date ??
        raw.dateMs ??
        raw.timestamp ??
        raw.createdAt,
    ),
    players: playerCount,
    standings: resolvedStandings,
    pairings: resolvedPairings,
  };
}

const sourceTournaments = computed(() => {
  if (hasExternalData.value) {
    if (props.filteredTournaments.length > 0 || Object.keys(props.filters).length > 0) {
      return props.filteredTournaments;
    }
    return props.tournaments;
  }

  return internalFilteredTournaments.value;
});

const normalizedTournaments = computed(() => {
  return sourceTournaments.value.map((item) => normalizeTournament(item as AnyRecord));
});

function buildTierRowsFromScope(
  tournaments: NormalizedTournament[],
  topCut: TopCutValue,
): TierRow[] {
  const deckMap = new Map<
    string,
    {
      key: string;
      rawName: string;
      iconKeys: string[];
      allSamples: number;
      baselineTop32Samples: number;
      weightedPoints: number;
    }
  >();
  const emaRecords: TierEmaInput[] = [];

  let totalAllSamples = 0;
  let totalBaselineTop32Samples = 0;

  for (const tournament of tournaments) {
    for (const row of tournament.standings) {
      const identity = extractDeckIdentityFromRow(row);
      const deckKey = identity.key || identity.candidateKeys[0] || buildDerivedDeckKey(row);

      if (!deckKey) continue;

      const place = getPlace(row);
      if (!qualifiesByTopCut(place, topCut)) continue;

      let hit = deckMap.get(deckKey);

      if (!hit) {
        hit = {
          key: deckKey,
          rawName:
            identity.displayNameEn ||
            identity.displayName ||
            defaultDeckLabelFromKey(deckKey),
          iconKeys: [...identity.iconKeys],
          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,
        };
        deckMap.set(deckKey, hit);
      } else {
        const betterName =
          identity.displayNameEn ||
          identity.displayName ||
          defaultDeckLabelFromKey(deckKey);

        if (betterName && (!hit.rawName || betterName.length > hit.rawName.length)) {
          hit.rawName = betterName;
        }

        if (identity.iconKeys.length > hit.iconKeys.length) {
          hit.iconKeys = [...identity.iconKeys];
        }
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
          deckKey,
          top32Count: 1,
          weightedPoints,
        });
      }
    }
  }

  if (!deckMap.size) {
    return [];
  }

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of deckMap.values()) {
    data1[item.key] = item.baselineTop32Samples;
    data2[item.key] = item.weightedPoints;
    data3[item.key] =
      totalBaselineTop32Samples > 0
        ? (item.baselineTop32Samples / totalBaselineTop32Samples) * 100
        : 0;
  }
  const data4 = buildTierEmaScores(deckMap.keys(), emaRecords);

  const log1 = mapNumberRecord(data1, (value) => Math.log1p(value));
  const log2 = mapNumberRecord(data2, (value) => Math.log1p(value));
  const log3 = mapNumberRecord(data3, (value) => Math.log1p(value));

  const std1 = minmaxScale(log1);
  const std2 = minmaxScale(log2);
  const std3 = minmaxScale(log3);
  const std4 = minmaxScale(data4);

  return Array.from(deckMap.values())
    .map((item) => {
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
        usage: totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0,
        total_samples: item.allSamples,
        baselineTop32Samples: item.baselineTop32Samples,
        weightedPoints: item.weightedPoints,
        emaScore: data4[item.key] ?? 0,
        top32SharePct,
      } satisfies TierRow;
    })
    .sort((a, b) => {
      return (
        b.score - a.score ||
        (b.weightedPoints ?? 0) - (a.weightedPoints ?? 0) ||
        (b.baselineTop32Samples ?? 0) - (a.baselineTop32Samples ?? 0) ||
        b.total_samples - a.total_samples ||
        a.deck.localeCompare(b.deck)
      );
    })
    .map((row, index, arr) => {
      const nextScore = arr[index + 1]?.score ?? null;
      const nextScoreGap = nextScore == null ? row.score : row.score - nextScore;

      return {
        ...row,
        tier: tierLabel(row.score, nextScoreGap, index === 0),
      };
    });
}

const monthOptions = computed(() => {
  const seen = new Set<string>();
  const options: Array<{ value: string; label: string }> = [];

  for (const t of normalizedTournaments.value) {
    if (!t.startMs || !Number.isFinite(t.startMs)) continue;

    const d = new Date(t.startMs);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;

    if (seen.has(key)) continue;
    seen.add(key);

    options.push({
      value: `month:${key}`,
      label: isZhUi.value ? `${y}年${m}月` : key,
    });
  }

  options.sort((a, b) => (a.value < b.value ? 1 : -1));
  return options;
});

function inProfileTimeRange(t: NormalizedTournament, timeValue: string) {
  return matchesTimeFilter(t.startMs, timeValue as any);
}

function filterTournamentsByTime(list: NormalizedTournament[], timeValue: string) {
  return list.filter((t) => inProfileTimeRange(t, timeValue));
}

const leftPanelTournaments = computed(() =>
  filterTournamentsByTime(normalizedTournaments.value, leftPanelFilters.time),
);

const tierRows = computed<TierRow[]>(() =>
  buildTierRowsFromScope(leftPanelTournaments.value, leftPanelFilters.topCut),
);

const rightCardTournaments = computed(() => leftPanelTournaments.value);

function hydratePrecomputedCard(card: AnyRecord): CardAggregate {
  return {
    key: cleanDeckText(card.key) || cleanDeckText(card.code) || slugify(card.name),
    code: cleanDeckText(card.code),
    set: cleanDeckText(card.set),
    number: cleanDeckText(card.number),
    name: cleanDeckText(card.name),
    image:
      cleanDeckText(card.image) ||
      resolveCardImageUrl({
        set: card.set,
        number: card.number,
        code: card.code,
        name: card.name,
        fallbackImage: card.image,
      }),
    category: inferDeckCardCategory({
      category: card.category,
      set: card.set,
      number: card.number,
      code: card.code,
      name: card.name,
    }) || "Other",
    totalCopies: Number(card.totalCopies ?? 0),
    deckCount: Number(card.deckCount ?? 0),
    oneCopyDeckCount: Number(card.oneCopyDeckCount ?? 0),
    twoCopyDeckCount: Number(card.twoCopyDeckCount ?? 0),
    slotRatePct: Number(card.slotRatePct ?? 0),
    inclusionPct: Number(card.inclusionPct ?? 0),
    avgCopies: Number(card.avgCopies ?? 0),
    oneCopyPct: Number(card.oneCopyPct ?? 0),
    twoCopyPct: Number(card.twoCopyPct ?? 0),
  };
}

function hydratePrecomputedAnalytics(scope: PrecomputedDeckProfileScope): DeckProfileAnalytics {
  const raw = (scope.analytics ?? {}) as AnyRecord;
  const iconKeys = Array.isArray(raw.targetIconKeys) ? raw.targetIconKeys.map(cleanDeckText).filter(Boolean) : [];
  const targetSpriteUrls =
    Array.isArray(raw.targetSpriteUrls) && raw.targetSpriteUrls.length > 0
      ? raw.targetSpriteUrls.map(cleanDeckText).filter(Boolean)
      : resolveDeckSpriteUrlsFromIconKeys(iconKeys);

  const hydrateMatchup = (item: AnyRecord): MatchupAggregate => {
    const matchupIconKeys = Array.isArray(item.iconKeys) ? item.iconKeys.map(cleanDeckText).filter(Boolean) : [];
    const spriteUrls =
      Array.isArray(item.spriteUrls) && item.spriteUrls.length > 0
        ? item.spriteUrls.map(cleanDeckText).filter(Boolean)
        : resolveDeckSpriteUrlsFromIconKeys(matchupIconKeys);

    return {
      key: cleanDeckText(item.key),
      displayName: cleanDeckText(item.displayName || item.key),
      spriteUrls,
      wins: Number(item.wins ?? 0),
      losses: Number(item.losses ?? 0),
      draws: Number(item.draws ?? 0),
      games: Number(item.games ?? 0),
      winRate: Number(item.winRate ?? 0),
    };
  };

  const sampleDeck = raw.sampleDeck && typeof raw.sampleDeck === "object"
    ? {
        ...(raw.sampleDeck as SampleDeckEntry),
        cards: unwrapCollection<AnyRecord>((raw.sampleDeck as AnyRecord).cards).map((card) => ({
          ...card,
          image:
            cleanDeckText(card.image) ||
            resolveCardImageUrl({
              set: card.set,
              number: card.number,
              code: card.code,
              name: card.name,
              fallbackImage: card.image,
            }),
        })),
      }
    : null;

  const cardsFlat = unwrapCollection<AnyRecord>(raw.cardsFlat).map(hydratePrecomputedCard);
  const cardGroups = buildDeckCardGroups(cardsFlat);

  return {
    totalStandingRows: Number(raw.totalStandingRows ?? 0),
    targetStandingRows: Number(raw.targetStandingRows ?? 0),
    totalSeenDeckRows: Number(raw.totalSeenDeckRows ?? 0),
    top4Counts: {
      1: Number(raw.top4Counts?.[1] ?? raw.top4Counts?.["1"] ?? 0),
      2: Number(raw.top4Counts?.[2] ?? raw.top4Counts?.["2"] ?? 0),
      3: Number(raw.top4Counts?.[3] ?? raw.top4Counts?.["3"] ?? 0),
      4: Number(raw.top4Counts?.[4] ?? raw.top4Counts?.["4"] ?? 0),
    },
    metaShare: Number(raw.metaShare ?? 0),
    winRate: raw.winRate == null ? null : Number(raw.winRate),
    wins: Number(raw.wins ?? 0),
    losses: Number(raw.losses ?? 0),
    draws: Number(raw.draws ?? 0),
    matchCount: Number(raw.matchCount ?? 0),
    cardsFlat,
    cardGroups,
    featuredGoodMatchups: unwrapCollection<AnyRecord>(raw.featuredGoodMatchups).map(hydrateMatchup),
    featuredBadMatchups: unwrapCollection<AnyRecord>(raw.featuredBadMatchups).map(hydrateMatchup),
    bestFinishes: unwrapCollection<FinishRow>(raw.bestFinishes),
    sampleDeck,
    targetSpriteUrls,
    targetIconKeys: iconKeys,
    resolvedDeckDisplayName: cleanDeckText(raw.resolvedDeckDisplayName),
    resolvedDeckDisplayNameEn: cleanDeckText(raw.resolvedDeckDisplayNameEn),
  };
}

const pageAnalytics = computed(() =>
  activePrecomputedProfileScope.value
    ? hydratePrecomputedAnalytics(activePrecomputedProfileScope.value)
    : buildDeckProfileAnalytics(leftPanelTournaments.value, leftPanelFilters.topCut),
);

const loadedTournamentCount = computed(() => {
  if (activePrecomputedProfileScope.value) {
    return activePrecomputedProfileScope.value.tournamentCount;
  }

  if (hasExternalData.value) {
    if (props.loadedFilteredTournamentCount > 0) return props.loadedFilteredTournamentCount;
    return sourceTournaments.value.length;
  }

  return internalFilteredTournaments.value.filter(
    (t) => hasStandings(t.id),
  ).length;
});

const decklistLoading = computed(() => {
  if (activePrecomputedProfileScope.value) return false;
  if (precomputedProfileLoading.value) return true;
  if (hasExternalData.value) return false;
  if (loadingTournaments.value) return true;

  const ids = internalFilteredTournamentIds.value;
  if (ids.length === 0) return false;

  if (loadedTournamentCount.value < ids.length) {
    return rightAnalytics.value.totalSeenDeckRows === 0;
  }

  return false;
});

watch(
  () => deckCardsGridRef.value,
  async () => {
    await nextTick();
    bindDeckGridObserver();
    updateDeckViewportHeight();
  },
);

/* -----------------------------
   對局 result 解析
------------------------------ */

function extractPairingSideSource(row: AnyRecord, side: 1 | 2): any {
  const index = side === 1 ? 0 : 1;

  return (
    row.players?.[index] ??
    row.pairing?.players?.[index] ??
    row[side === 1 ? "p1" : "p2"] ??
    row[side === 1 ? "player1" : "player2"] ??
    row[side === 1 ? "left" : "right"] ??
    row[side === 1 ? "home" : "away"] ??
    null
  );
}

function extractNameFromParticipant(value: any) {
  if (typeof value === "string") return cleanDeckText(value);
  if (!value || typeof value !== "object") return "";

  return firstText([
    value.name,
    value.player,
    value.displayName,
    value.username,
    value.user?.name,
    value.user?.username,
  ]);
}

function extractSlugFromParticipant(value: any) {
  if (!value || typeof value !== "object") return "";

  return firstText([value.slug, value.username, value.user?.username, value.id]).toLowerCase();
}

function registerStandingKeys(
  map: Map<string, { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }>,
  row: AnyRecord,
  identity: DeckIdentity,
  place: number | null,
) {
  const player = extractPlayerName(row);
  const entry = { row, player, place, identity };

  const keys = uniqStrings([
    player,
    extractPlayerSlug(row),
    row.id,
    row.playerId,
    row.player_id,
    row.user?.id,
    row.player?.id,
  ])
    .map((item) => makePlayerKey(item))
    .filter(Boolean);

  for (const key of keys) {
    map.set(key, entry);
  }
}

function lookupStandingForSide(
  map: Map<string, { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }>,
  row: AnyRecord,
  side: 1 | 2,
) {
  const source = extractPairingSideSource(row, side);

  const keys = uniqStrings([
    extractNameFromParticipant(source),
    extractSlugFromParticipant(source),
    source?.id,
    row[side === 1 ? "player1Id" : "player2Id"],
    row[side === 1 ? "player_1_id" : "player_2_id"],
    row[side === 1 ? "p1Id" : "p2Id"],
  ])
    .map((item) => makePlayerKey(item))
    .filter(Boolean);

  for (const key of keys) {
    const hit = map.get(key);
    if (hit) return hit;
  }

  return null;
}

function compareNumericResult(a: number, b: number) {
  if (a === b) return { p1: 0.5, p2: 0.5 };
  return a > b ? { p1: 1, p2: 0 } : { p1: 0, p2: 1 };
}

function parseOutcomeToken(value: unknown) {
  const text = cleanDeckText(value).toLowerCase();
  if (!text) return null;
  if (["w", "win", "won"].includes(text)) return 1;
  if (["l", "loss", "lose", "lost"].includes(text)) return 0;
  if (["d", "draw", "tie"].includes(text)) return 0.5;
  return null;
}

function parsePairingResult(row: AnyRecord, p1Name = "", p2Name = "") {
  const drawFlag = [
    row.draw,
    row.isDraw,
    row.tie,
    row.result?.draw,
    row.result?.tie,
  ].some((value) => value === true || cleanDeckText(value).toLowerCase() === "draw");

  if (drawFlag) return { p1: 0.5, p2: 0.5 };

  const winnerRaw = row.winner;
  if (winnerRaw === -1 || winnerRaw === "-1") {
    return null;
  }
  if (winnerRaw === 0 || winnerRaw === "0") {
    return { p1: 0.5, p2: 0.5 };
  }

  const numericPairs: Array<[unknown, unknown]> = [
    [row.p1Points, row.p2Points],
    [row.player1Points, row.player2Points],
    [row.leftPoints, row.rightPoints],
    [row.homeScore, row.awayScore],
    [row.result?.p1, row.result?.p2],
    [row.result?.left, row.result?.right],
    [row.score?.p1, row.score?.p2],
    [row.score?.left, row.score?.right],
    [row.wins1, row.wins2],
    [row.player1Wins, row.player2Wins],
  ];

  for (const [aRaw, bRaw] of numericPairs) {
    const a = toNumber(aRaw);
    const b = toNumber(bRaw);
    if (a != null && b != null) {
      return compareNumericResult(a, b);
    }
  }

  const tokenPairs: Array<[unknown, unknown]> = [
    [row.p1Result, row.p2Result],
    [row.player1Result, row.player2Result],
    [row.leftResult, row.rightResult],
  ];

  for (const [aRaw, bRaw] of tokenPairs) {
    const a = parseOutcomeToken(aRaw);
    const b = parseOutcomeToken(bRaw);

    if (a != null && b != null) {
      return { p1: a, p2: b };
    }
  }

  const winnerCandidates = [
    row.winner,
    row.winnerName,
    row.result?.winner,
    row.result?.winnerName,
    row.winnerPlayer,
  ];

  for (const candidate of winnerCandidates) {
    const text = cleanDeckText(candidate);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };
    if (/^(1|p1|player1|left|home)$/i.test(text)) return { p1: 1, p2: 0 };
    if (/^(2|p2|player2|right|away)$/i.test(text)) return { p1: 0, p2: 1 };

    const key = makePlayerKey(text);
    if (p1Name && key === makePlayerKey(p1Name)) return { p1: 1, p2: 0 };
    if (p2Name && key === makePlayerKey(p2Name)) return { p1: 0, p2: 1 };
  }

  const textCandidates = [
    row.score,
    row.result,
    row.record,
    row.outcome,
    row.matchResult,
    row.tableResult,
  ];

  for (const raw of textCandidates) {
    if (typeof raw !== "string") continue;
    const text = cleanDeckText(raw);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };

    const outcome = parseOutcomeToken(text);
    if (outcome != null) {
      if (outcome === 1) return { p1: 1, p2: 0 };
      if (outcome === 0) return { p1: 0, p2: 1 };
      return { p1: 0.5, p2: 0.5 };
    }

    const match = text.match(/(\d+)\s*[-:]\s*(\d+)(?:\s*[-:]\s*(\d+))?/);
    if (match) {
      return compareNumericResult(Number(match[1]), Number(match[2]));
    }

    if (/player\s*1/i.test(text) && /win/i.test(text)) return { p1: 1, p2: 0 };
    if (/player\s*2/i.test(text) && /win/i.test(text)) return { p1: 0, p2: 1 };
  }

  return null;
}

/* -----------------------------
   Decklist 解析
------------------------------ */

function normalizeCardCategory(value: unknown) {
  const text = normalizeCatalogText(value).toLowerCase();

  if (/\bsupporter\b/.test(text)) return "Supporter";
  if (/\btrainer\b|\bitem\b|\bstadium\b|\btool\b/.test(text)) return "Trainer";
  if (/\bpokemon\b/.test(text)) return "Pokemon";
  if (/\benergy\b/.test(text)) return "Energy";

  return "Other";
}

function normalizeCatalogText(value: unknown) {
  return cleanDeckText(value)
    .replace(/Pokémon/gi, "Pokemon")
    .replace(/é/g, "e")
    .replace(/’/g, "'");
}

function normalizeCatalogCardCodeKey(value: unknown) {
  const normalized = normalizeCardCode(value);
  const match = normalized.match(/^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$/i);
  const setCode = match?.[1];
  const number = match?.[2];
  if (!setCode || !number) return "";

  return `${normalizeSetCode(setCode)}-${number.replace(/^0+(?=\d)/, "").toLowerCase()}`;
}

function classifyTrainerSubtype(source: string) {
  if (/\bsupporter\b/.test(source)) return "Supporter";
  if (/\btrainer\b|\bitem\b|\bstadium\b|\bpokemon\s+tool\b|\btool\b/.test(source)) return "Trainer";
  return "";
}

function inferCatalogDeckCategory(card: RawCatalogCard) {
  const pageLine = normalizeCatalogText(card.page_line).toLowerCase();
  const extraText = normalizeCatalogText(card.extra_text).toLowerCase();
  const structuredText = normalizeCatalogText(
    [
      card.supertype,
      card.display_type,
      ...(Array.isArray(card.subtypes) ? card.subtypes : []),
    ].join(" "),
  ).toLowerCase();

  const trainerPrefix = pageLine.match(/^\s*trainer\s*-\s*([a-z ]+)/);
  if (trainerPrefix) {
    return classifyTrainerSubtype(`trainer ${trainerPrefix[1]}`) || "Trainer";
  }

  const shorthandTrainerPrefix = pageLine.match(/^\s*-\s*(supporter|item|stadium|pokemon\s+tool|tool)\b/);
  if (shorthandTrainerPrefix) {
    return classifyTrainerSubtype(`trainer ${shorthandTrainerPrefix[1]}`) || "Trainer";
  }

  const extraTrainerPrefix = extraText.match(/^\s*trainer\s*-\s*([a-z ]+)/);
  if (extraTrainerPrefix) {
    return classifyTrainerSubtype(`trainer ${extraTrainerPrefix[1]}`) || "Trainer";
  }

  const extraTrainerDescriptor = extraText.match(/\btrainer\s*-\s*([a-z ]+)/);
  if (extraTrainerDescriptor) {
    return classifyTrainerSubtype(`trainer ${extraTrainerDescriptor[1]}`) || "Trainer";
  }

  const extraTrainerIndex = extraText.indexOf("trainer");
  if (extraTrainerIndex >= 0 && extraTrainerIndex < 80) {
    return classifyTrainerSubtype(extraText.slice(extraTrainerIndex, extraTrainerIndex + 80)) || "Trainer";
  }

  if (/\b\d+\s*hp\s+pokemon\b/.test(extraText) || /\b\d+\s*hp\s+pokemon\b/.test(pageLine)) {
    return "Pokemon";
  }

  if (/\bpokemon\s*-\s*(basic|stage|mega|restored|fossil)\b/.test(extraText)) {
    return "Pokemon";
  }

  if (/^\s*(basic|special)?\s*energy\b/.test(pageLine) || /^\s*energy\s*-\s*/.test(pageLine)) {
    return "Energy";
  }

  const structuredCategory = normalizeCardCategory(structuredText);
  if (structuredCategory !== "Other") return structuredCategory;

  const earlyText = `${pageLine.slice(0, 120)} ${extraText.slice(0, 120)}`;
  if (/\b\d+\s*hp\s+pokemon\b/.test(earlyText)) return "Pokemon";
  if (/^\s*trainer\s*-/.test(earlyText)) {
    return classifyTrainerSubtype(earlyText) || "Trainer";
  }
  if (/\benergy\b/.test(earlyText) && !/\benergy\s+from\b|\benergy\s+attached\b/.test(earlyText)) {
    return "Energy";
  }

  return "Other";
}

function buildCatalogCardInfo(raw: RawCatalogCard): CatalogCardInfo | null {
  const setCode = normalizeSetCode(raw.set_code);
  const number = String(raw.number ?? "").trim();
  const code = normalizeCardCode(setCode && number ? `${setCode}-${number}` : raw.id);
  const codeKey = normalizeCatalogCardCodeKey(code || raw.id);
  const name = cleanDeckText(raw.name);
  if (!code && !name) return null;

  return {
    code: codeKey || code,
    name,
    category: inferCatalogDeckCategory(raw),
  };
}

async function loadDeckProfileCardCatalog() {
  if (import.meta.env.SSR || cardCatalogLoaded.value) return;

  try {
    const response = await fetch(cardsCatalogUrl, { cache: "force-cache" });
    if (!response.ok) return;

    const payload = (await response.json()) as RawCatalogCard[];
    const byCode = new Map<string, CatalogCardInfo>();
    const byName = new Map<string, CatalogCardInfo[]>();

    for (const raw of Array.isArray(payload) ? payload : []) {
      const card = buildCatalogCardInfo(raw);
      if (!card) continue;

      const codeKey = normalizeCatalogCardCodeKey(card.code);
      if (codeKey && !byCode.has(codeKey)) {
        byCode.set(codeKey, card);
      }

      const nameKey = slugify(normalizeCatalogText(card.name));
      if (!nameKey) continue;

      const bucket = byName.get(nameKey) ?? [];
      bucket.push(card);
      byName.set(nameKey, bucket);
    }

    cardCatalogByCode.value = byCode;
    cardCatalogByName.value = byName;
  } catch (error) {
    console.warn("[DeckProfile] card catalog failed to load:", error);
  } finally {
    cardCatalogLoaded.value = true;
  }
}

function lookupCatalogCard(input: {
  code?: unknown;
  set?: unknown;
  number?: unknown;
  name?: unknown;
}) {
  const directCode = normalizeCatalogCardCodeKey(input.code);
  if (directCode) {
    const direct = cardCatalogByCode.value.get(directCode);
    if (direct) return direct;
  }

  const setCode = normalizeSetCode(input.set);
  const number = normalizeCardImageNumber(input.number);
  const setNumberCode = normalizeCatalogCardCodeKey(setCode && number ? `${setCode}-${number}` : "");
  if (setNumberCode) {
    const bySetNumber = cardCatalogByCode.value.get(setNumberCode);
    if (bySetNumber) return bySetNumber;
  }

  const nameKey = slugify(normalizeCatalogText(input.name));
  const byName = nameKey ? cardCatalogByName.value.get(nameKey) : null;
  if (!byName || byName.length === 0) return null;

  return byName.find((item) => item.category === "Supporter") ?? byName[0] ?? null;
}

function inferDeckCardCategory(input: {
  category?: unknown;
  section?: unknown;
  supertype?: unknown;
  type?: unknown;
  code?: unknown;
  set?: unknown;
  number?: unknown;
  name?: unknown;
}) {
  const catalogCard = lookupCatalogCard(input);
  if (catalogCard?.category) return catalogCard.category;

  const sourceText = normalizeCatalogText(
    [input.category, input.section, input.supertype, input.type, input.name].join(" "),
  ).toLowerCase();

  if (/\bsupporter\b/.test(sourceText)) return "Supporter";
  if (/\bpokemon\b/.test(sourceText)) return "Pokemon";
  if (/\btrainer\b|\bitem\b|\bstadium\b|\btool\b/.test(sourceText)) return "Trainer";
  if (/\benergy\b/.test(sourceText)) return "Energy";

  return normalizeCardCategory(input.category ?? input.section ?? input.supertype ?? input.type);
}

function looksLikeCardEntry(value: AnyRecord) {
  const hasName = Boolean(
    cleanDeckText(value.name ?? value.cardName ?? value.title ?? value.label ?? ""),
  );

  const hasCount = [
    value.count,
    value.qty,
    value.quantity,
    value.copies,
    value.amount,
    value.num,
  ].some((candidate) => toNumber(candidate) != null);

  return hasName && (hasCount || value.code || value.cardCode || value.set || value.number);
}

function parseDecklistText(source: string, categoryHint = "Other"): NormalizedDeckCard[] {
  return String(source)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^(\d+)\s*[xX]?\s+(.+)$/);

      const countText = match?.[1];
      const rawText = match?.[2];

      if (!countText || !rawText) return null;

      const count = Number(countText);
      const code = extractCardCodeFromText(rawText);
      const codeParts = splitCardCodeParts(code);
      const name = stripCardCodeFromName(rawText) || cleanDeckText(rawText);

      if (!name || !Number.isFinite(count) || count <= 0) return null;

      return {
        key:
          code ||
          (codeParts.set && codeParts.number
            ? `${codeParts.set}-${codeParts.number}`
            : slugify(name)),
        code,
        set: codeParts.set,
        number: codeParts.number,
        name,
        count,
        image: resolveCardImageUrl({
          set: codeParts.set,
          number: codeParts.number,
          code,
          name,
          fallbackImage: "",
        }),
        category: inferDeckCardCategory({
          category: categoryHint,
          set: codeParts.set,
          number: codeParts.number,
          code,
          name,
        }),
      };
    })
    .filter((item): item is NormalizedDeckCard => item !== null);
}

function normalizeDeckCardsSource(source: unknown, categoryHint = "Other"): NormalizedDeckCard[] {
  if (!source) return [];

  if (typeof source === "string") {
    return parseDecklistText(source, categoryHint);
  }

  if (Array.isArray(source)) {
    return source.flatMap((item) => normalizeDeckCardsSource(item, categoryHint));
  }

  if (typeof source !== "object") return [];

  const merged = source as AnyRecord;

  if (looksLikeCardEntry(merged)) {
    const rawName = cleanDeckText(
      String(merged.name ?? merged.cardName ?? merged.title ?? merged.label ?? ""),
    );
    const name = stripCardCodeFromName(rawName) || rawName;

    const count = Number(
      merged.count ??
        merged.qty ??
        merged.quantity ??
        merged.copies ??
        merged.amount ??
        merged.num ??
        1,
    );

    const code = pickCardCode(merged, rawName);
    const codeParts = splitCardCodeParts(code);

    const set = normalizeCardImageSet(
      merged.set ??
        merged.setCode ??
        merged.set_code ??
        merged.cardSet ??
        merged.card_set ??
        codeParts.set,
    );

    const number = normalizeCardImageNumber(
      merged.number ??
        merged.no ??
        merged.cardNumber ??
        merged.card_number ??
        merged.cardNo ??
        merged.card_no ??
        codeParts.number,
    );

    const image = resolveCardImageUrl({
      set,
      number,
      code,
      name,
      fallbackImage:
        merged.image ??
        merged.imageUrl ??
        merged.img ??
        merged.art ??
        merged.thumb ??
        merged.sprite ??
        merged.cardImage ??
        merged.images?.small ??
        merged.images?.large ??
        "",
    });

    if (!name || !Number.isFinite(count) || count <= 0) return [];

    return [
      {
        key:
          code ||
          (set && number
            ? `${set}-${number}`
            : slugify(`${name}-${merged.id ?? merged.cardId ?? name}`)),
        code,
        set,
        number,
        name,
        count,
        image,
        category: inferDeckCardCategory({
          category: merged.category ?? categoryHint,
          section: merged.section,
          supertype: merged.supertype,
          type: merged.type,
          set,
          number,
          code,
          name,
        }),
      },
    ];
  }

  const sectionOutput: NormalizedDeckCard[] = [];

  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;

    if (
      [
        "pokemon",
        "pokemons",
        "trainer",
        "trainers",
        "energy",
        "energies",
        "supporters",
        "items",
        "stadiums",
        "cards",
        "decklist",
        "deckList",
        "list",
      ].includes(key)
    ) {
      sectionOutput.push(...normalizeDeckCardsSource(value, key));
    }
  }

  if (sectionOutput.length > 0) return sectionOutput;

  const genericOutput: NormalizedDeckCard[] = [];

  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;

    if (typeof value === "string" || Array.isArray(value) || typeof value === "object") {
      genericOutput.push(...normalizeDeckCardsSource(value, key));
    }
  }

  return genericOutput;
}

function extractDeckCardsFromRow(row: AnyRecord) {
  const candidates = [
    row.decklist,
    row.deckList,
    row.list,
    row.cardList,
    row.cards,
    row.deck?.decklist,
    row.deck?.deckList,
    row.deck?.list,
    row.deck?.cards,
    row.deck?.cardList,
    row.deckText,
    row.decklistText,
    row.deck?.text,
    row.deck?.raw,
  ];

  for (const source of candidates) {
    const parsed = normalizeDeckCardsSource(source);
    if (parsed.length > 0) return parsed;
  }

  const grouped = {
    pokemon: row.pokemon ?? row.deck?.pokemon,
    trainer: row.trainer ?? row.trainers ?? row.deck?.trainer ?? row.deck?.trainers,
    energy: row.energy ?? row.energies ?? row.deck?.energy ?? row.deck?.energies,
  };

  const groupedParsed = normalizeDeckCardsSource(grouped);
  if (groupedParsed.length > 0) return groupedParsed;

  return [];
}

/* -----------------------------
   Limitless decklist URL
------------------------------ */

function normalizeLimitlessDeckUrl(value: string) {
  const raw = cleanDeckText(value);
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `https://play.limitlesstcg.com${raw}`;

  return "";
}

function extractListUrl(row: AnyRecord) {
  const candidates = [
    row?.deck?.url,
    row?.deck?.listUrl,
    row?.listUrl,
    row?.list?.url,
    row?.decklistUrl,
    row?.decklist?.url,
  ];

  for (const candidate of candidates) {
    const hit = normalizeLimitlessDeckUrl(String(candidate ?? ""));
    if (hit) return hit;
  }

  return "";
}

function buildLimitlessDecklistUrl(tournamentId: string, row: AnyRecord) {
  const explicit = extractListUrl(row);
  if (explicit) return explicit;

  const playerSlug = extractPlayerSlug(row);
  if (!tournamentId || !playerSlug) return "";

  return `https://play.limitlesstcg.com/tournament/${encodeURIComponent(
    tournamentId,
  )}/player/${encodeURIComponent(playerSlug)}/decklist`;
}

function buildFinishRow(tournament: NormalizedTournament, row: AnyRecord): FinishRow | null {
  const player = extractPlayerName(row);
  const place = getPlace(row);
  if (!player || place == null) return null;

  const players =
    tournament.players != null && Number.isFinite(tournament.players) && tournament.players > 0
      ? tournament.players
      : null;

  return {
    key: `${tournament.id}::${player}`,
    player,
    tournamentName: cleanDeckText(String(tournament.name ?? tournament.id)) || tournament.id,
    dateMs: tournament.startMs,
    dateLabel: formatDate(tournament.startMs),
    place,
    players,
    placeLabel: players ? `${place} / ${players}` : String(place),
    listUrl: buildLimitlessDecklistUrl(tournament.id, row),
  };
}

function buildSampleDeckEntry(
  tournament: NormalizedTournament,
  row: AnyRecord,
  cards: NormalizedDeckCard[],
): SampleDeckEntry | null {
  const player = extractPlayerName(row);
  const place = getPlace(row);
  if (!player || place == null || cards.length === 0) return null;

  const players =
    tournament.players != null && Number.isFinite(tournament.players) && tournament.players > 0
      ? tournament.players
      : null;

  return {
    tournamentId: tournament.id,
    tournamentName: cleanDeckText(String(tournament.name ?? tournament.id)) || tournament.id,
    player,
    dateMs: tournament.startMs,
    dateLabel: formatDate(tournament.startMs),
    place,
    players,
    placeLabel: players ? `${place} / ${players}` : String(place),
    listUrl: buildLimitlessDecklistUrl(tournament.id, row),
    cards,
  };
}

function compareSampleDeckEntries(a: SampleDeckEntry, b: SampleDeckEntry) {
  return (
    a.place - b.place ||
    (b.players ?? 0) - (a.players ?? 0) ||
    b.dateMs - a.dateMs ||
    compareText(a.player, b.player)
  );
}

function formatRecord(wins: number, losses: number, draws: number) {
  return `${wins}-${losses}-${draws}`;
}

/* -----------------------------
   核心 analytics
------------------------------ */

function buildDeckProfileAnalytics(
  tournaments: NormalizedTournament[],
  topCut: TopCutValue,
): DeckProfileAnalytics {
  const cardMap = new Map<string, CardAggregate>();
  const matchupMap = new Map<string, MatchupAggregate>();
  const finishMap = new Map<string, FinishRow>();
  const visualsByDeckKey = new Map<
    string,
    { displayName: string; displayNameEn: string; spriteUrls: string[]; iconKeys: string[] }
  >();
  let sampleDeck: SampleDeckEntry | null = null;

  let totalStandingRows = 0;
  let targetStandingRows = 0;
  let totalSeenDeckRows = 0;

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let targetGames = 0;
  let targetPoints = 0;

  const top4Counts: Record<1 | 2 | 3 | 4, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  function rememberDeckVisual(identity: DeckIdentity) {
    const visual = {
      displayName: identity.displayName,
      displayNameEn: identity.displayNameEn,
      spriteUrls: identity.spriteUrls,
      iconKeys: identity.iconKeys,
    };

    for (const key of identity.candidateKeys) {
      if (!key) continue;

      const prev = visualsByDeckKey.get(key);

      if (!prev) {
        visualsByDeckKey.set(key, visual);
        continue;
      }

      visualsByDeckKey.set(key, {
        displayName:
          visual.displayName.length > prev.displayName.length
            ? visual.displayName
            : prev.displayName,
        displayNameEn:
          visual.displayNameEn.length > prev.displayNameEn.length
            ? visual.displayNameEn
            : prev.displayNameEn,
        spriteUrls:
          prev.spriteUrls.length >= visual.spriteUrls.length ? prev.spriteUrls : visual.spriteUrls,
        iconKeys: prev.iconKeys.length >= visual.iconKeys.length ? prev.iconKeys : visual.iconKeys,
      });
    }
  }

  function applyTargetResult(points: number) {
    targetGames += 1;
    targetPoints += points;

    if (points === 1) wins += 1;
    else if (points === 0.5) draws += 1;
    else losses += 1;
  }

  function addMatchupResult(opponent: DeckIdentity, points: number) {
    const oppKey = opponent.key || opponent.candidateKeys[0];
    if (!oppKey) return;

    const existing = matchupMap.get(oppKey) ?? {
      key: oppKey,
      displayName: opponent.displayName,
      spriteUrls: opponent.spriteUrls,
      wins: 0,
      losses: 0,
      draws: 0,
      games: 0,
      winRate: 0,
    };

    existing.games += 1;

    if (points === 1) existing.wins += 1;
    else if (points === 0.5) existing.draws += 1;
    else existing.losses += 1;

    if (!existing.spriteUrls.length && opponent.spriteUrls.length) {
      existing.spriteUrls = opponent.spriteUrls;
    }

    if (!existing.displayName && opponent.displayName) {
      existing.displayName = opponent.displayName;
    }

    matchupMap.set(oppKey, existing);
  }

  for (const tournament of tournaments) {
    const standings = tournament.standings;
    const pairings = tournament.pairings;
    let tournamentHasQualifiedTarget = false;

    const standingMap = new Map<
      string,
      { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }
    >();

    for (const row of standings) {
      const place = getPlace(row);
      const identity = extractDeckIdentityFromRow(row);
      const player = extractPlayerName(row);

      if (player) {
        registerStandingKeys(standingMap, row, identity, place);
      }

      if (identity.candidateKeys.length > 0) {
        rememberDeckVisual(identity);
      }

      if (!qualifiesByTopCut(place, topCut)) continue;

      totalStandingRows += 1;

      if (!isTargetDeckIdentity(identity)) continue;

      tournamentHasQualifiedTarget = true;
      targetStandingRows += 1;

      if (place === 1 || place === 2 || place === 3 || place === 4) {
        top4Counts[place] += 1;
      }

      const finish = buildFinishRow(tournament, row);
      if (finish) {
        const prev = finishMap.get(finish.key);
        if (!prev || !prev.listUrl) {
          finishMap.set(finish.key, finish);
        }
      }

      const cards = extractDeckCardsFromRow(row);
      if (cards.length > 0) {
        const sampleCandidate = buildSampleDeckEntry(tournament, row, cards);
        if (
          sampleCandidate &&
          (!sampleDeck || compareSampleDeckEntries(sampleCandidate, sampleDeck) < 0)
        ) {
          sampleDeck = sampleCandidate;
        }

        totalSeenDeckRows += 1;

        const deckCardMap = new Map<string, NormalizedDeckCard>();

        for (const card of cards) {
          const key = card.key || card.code || slugify(card.name);
          const count = Math.max(0, Number(card.count) || 0);
          if (!key || count <= 0) continue;

          const deckCard = deckCardMap.get(key);
          if (deckCard) {
            deckCard.count += count;
            if (!deckCard.set && card.set) deckCard.set = card.set;
            if (!deckCard.number && card.number) deckCard.number = card.number;
            if (!deckCard.code && card.code) deckCard.code = card.code;
            if (!deckCard.name && card.name) deckCard.name = card.name;
            if (!deckCard.category && card.category) deckCard.category = card.category;
            if (!deckCard.image) {
              deckCard.image = resolveCardImageUrl({
                set: card.set || deckCard.set,
                number: card.number || deckCard.number,
                code: card.code || deckCard.code,
                name: card.name || deckCard.name,
                fallbackImage: card.image || deckCard.image,
              });
            }
            continue;
          }

          deckCardMap.set(key, {
            ...card,
            key,
            count,
            image: resolveCardImageUrl({
              set: card.set,
              number: card.number,
              code: card.code,
              name: card.name,
              fallbackImage: card.image,
            }),
          });
        }

        for (const card of deckCardMap.values()) {
          const key = card.key || card.code || slugify(card.name);
          const existing: CardAggregate = cardMap.get(key) ?? {
            key,
            code: card.code,
            set: card.set,
            number: card.number,
            name: card.name,
            image: card.image,
            category: card.category,
            totalCopies: 0,
            deckCount: 0,
            oneCopyDeckCount: 0,
            twoCopyDeckCount: 0,
            slotRatePct: 0,
            inclusionPct: 0,
            avgCopies: 0,
            oneCopyPct: 0,
            twoCopyPct: 0,
          };

          existing.totalCopies += card.count;

          if (!existing.set && card.set) existing.set = card.set;
          if (!existing.number && card.number) existing.number = card.number;
          if (!existing.image) {
            existing.image = resolveCardImageUrl({
              set: card.set || existing.set,
              number: card.number || existing.number,
              code: card.code || existing.code,
              name: card.name || existing.name,
              fallbackImage: card.image || existing.image,
            });
          }
          if (!existing.code && card.code) existing.code = card.code;
          if (!existing.name && card.name) existing.name = card.name;
          existing.deckCount += 1;

          if (card.count >= 2) existing.twoCopyDeckCount += 1;
          else existing.oneCopyDeckCount += 1;

          cardMap.set(key, existing);
        }
      }
    }

    if (!tournamentHasQualifiedTarget || pairings.length === 0) {
      continue;
    }

    for (const row of pairings) {
      const side1 = lookupStandingForSide(standingMap, row, 1);
      const side2 = lookupStandingForSide(standingMap, row, 2);

      if (!side1 || !side2) continue;

      const result = parsePairingResult(row, side1.player, side2.player);
      if (!result) continue;

      const deck1 = side1.identity;
      const deck2 = side2.identity;

      const side1IsTarget = isTargetDeckIdentity(deck1);
      const side2IsTarget = isTargetDeckIdentity(deck2);

      if (side1IsTarget && qualifiesByTopCut(side1.place, topCut)) {
        applyTargetResult(result.p1);
        if (!side2IsTarget) {
          addMatchupResult(deck2, result.p1);
        }
      }

      if (side2IsTarget && qualifiesByTopCut(side2.place, topCut)) {
        applyTargetResult(result.p2);
        if (!side1IsTarget) {
          addMatchupResult(deck1, result.p2);
        }
      }
    }
  }

  const cardsFlat: CardAggregate[] = [...cardMap.values()]
    .map((item) => {
      const slotRatePct = totalSeenDeckRows > 0 ? (item.totalCopies / totalSeenDeckRows) * 100 : 0;
      const inclusionPct = totalSeenDeckRows > 0 ? (item.deckCount / totalSeenDeckRows) * 100 : 0;
      const avgCopies = item.deckCount > 0 ? item.totalCopies / item.deckCount : 0;
      const oneCopyPct =
        totalSeenDeckRows > 0 ? (item.oneCopyDeckCount / totalSeenDeckRows) * 100 : 0;
      const twoCopyPct =
        totalSeenDeckRows > 0 ? (item.twoCopyDeckCount / totalSeenDeckRows) * 100 : 0;

      return {
        ...item,
        image:
          item.image ||
          resolveCardImageUrl({
            set: item.set,
            number: item.number,
            code: item.code,
            name: item.name,
            fallbackImage: item.image,
          }),
        slotRatePct,
        inclusionPct,
        avgCopies,
        oneCopyPct,
        twoCopyPct,
      };
    })
    .filter((item) => item.slotRatePct >= MIN_SLOT_RATE_PCT)
    .sort((a, b) => {
      return (
        b.inclusionPct - a.inclusionPct ||
        b.slotRatePct - a.slotRatePct ||
        compareText(a.name, b.name)
      );
    });

  const cardGroups = buildDeckCardGroups(cardsFlat);

  const matchupRows: MatchupAggregate[] = [...matchupMap.values()]
    .map((item) => {
      const winRate = item.games > 0 ? (item.wins + item.draws * 0.5) / item.games : 0;

      return {
        ...item,
        displayName: item.displayName || item.key,
        winRate,
      };
    })
    .sort((a, b) => b.games - a.games || compareText(a.displayName, b.displayName));

  const top15MostPlayed = [...matchupRows]
    .sort((a, b) => b.games - a.games || compareText(a.displayName, b.displayName))
    .slice(0, 15);

  const featuredGoodMatchups = [...top15MostPlayed]
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
    .slice(0, 3);

  const featuredBadMatchups = [...top15MostPlayed]
    .sort((a, b) => a.winRate - b.winRate || b.games - a.games)
    .slice(0, 3);

  const bestFinishes = [...finishMap.values()]
    .sort((a, b) => {
      return (
        a.place - b.place ||
        (b.players ?? 0) - (a.players ?? 0) ||
        b.dateMs - a.dateMs ||
        compareText(a.player, b.player)
      );
    })
    .slice(0, 50);

  const explicitDeckSprites = extractSpriteUrls(props.deck ?? {});
  let finalTargetSprites = explicitDeckSprites;
  let finalTargetIconKeys = extractDeckIconKeys(
    props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : null,
  );

  let resolvedDeckDisplayName = "";
  let resolvedDeckDisplayNameEn = "";

  for (const key of targetDeckKeySet.value) {
    const visual = visualsByDeckKey.get(key);
    if (!visual) continue;

    if (!resolvedDeckDisplayName && visual.displayName) {
      resolvedDeckDisplayName = visual.displayName;
    }

    if (!resolvedDeckDisplayNameEn && visual.displayNameEn) {
      resolvedDeckDisplayNameEn = visual.displayNameEn;
    }

    if (!finalTargetSprites.length && visual.spriteUrls.length) {
      finalTargetSprites = visual.spriteUrls;
    }

    if (!finalTargetIconKeys.length && visual.iconKeys.length) {
      finalTargetIconKeys = visual.iconKeys;
    }
  }

  if (!finalTargetSprites.length && finalTargetIconKeys.length) {
    finalTargetSprites = resolveDeckSpriteUrlsFromIconKeys(finalTargetIconKeys);
  }

  if (!resolvedDeckDisplayName) {
    resolvedDeckDisplayName =
      (routeLang.value === "zh"
        ? getLocalizedDeckName(undefined, finalTargetIconKeys, "zh")
        : getLocalizedDeckName(undefined, finalTargetIconKeys, "en")) ||
      defaultDeckLabelFromKey(analysisDeckKey.value) ||
      "Unknown Deck";
  }

  if (!resolvedDeckDisplayNameEn) {
    resolvedDeckDisplayNameEn = getLocalizedDeckName(undefined, finalTargetIconKeys, "en") || "";
  }

  return {
    totalStandingRows,
    targetStandingRows,
    totalSeenDeckRows,
    top4Counts,
    metaShare: totalStandingRows > 0 ? targetStandingRows / totalStandingRows : 0,
    winRate: targetGames > 0 ? targetPoints / targetGames : null,
    wins,
    losses,
    draws,
    matchCount: wins + losses + draws,
    cardsFlat,
    cardGroups,
    featuredGoodMatchups,
    featuredBadMatchups,
    bestFinishes,
    sampleDeck,
    targetSpriteUrls: finalTargetSprites.slice(0, 3),
    resolvedDeckDisplayName,
    resolvedDeckDisplayNameEn,
  };
}

const leftAnalytics = computed(() => pageAnalytics.value);

const rightAnalytics = computed(() => pageAnalytics.value);

function getRightDeckPanelGroupLabel(groupKey: string) {
  const isZh = routeLang.value === "zh";

  if (groupKey === "pokemon") return isZh ? "寶可夢" : "Pokemon";
  if (groupKey === "supporter") return isZh ? "支援者" : "Supporters";
  if (groupKey === "trainer") return isZh ? "其他訓練家" : "Other Trainers";

  switch (groupKey) {
    case "pokemon":
      return isZh ? "寶可夢卡" : "Pokemon Cards";
    case "trainer":
      return isZh ? "訓練家卡" : "Trainer Cards";
    case "energy":
      return isZh ? "能量卡" : "Energy Cards";
    default:
      return isZh ? "其他卡" : "Other Cards";
  }
}

function buildDeckCardGroups(cardsFlat: CardAggregate[]): CardGroup[] {
  return [
    {
      key: "pokemon",
      label: "POKÉMON",
      cards: cardsFlat.filter((item) => item.category === "Pokemon"),
    },
    {
      key: "supporter",
      label: "SUPPORTER",
      cards: cardsFlat.filter((item) => item.category === "Supporter"),
    },
    {
      key: "trainer",
      label: routeLang.value === "zh" ? "其他" : "OTHER",
      cards: cardsFlat.filter(
        (item) => item.category !== "Pokemon" && item.category !== "Supporter",
      ),
    },
  ].filter((group) => group.cards.length > 0);
}

function buildCardPanelGroupsFromAnalytics(analytics: DeckProfileAnalytics): RightDeckPanelGroup[] {
  return analytics.cardGroups.map((group) => ({
    key: group.key,
    label: getRightDeckPanelGroupLabel(group.key),
    showLabel: true,
    cards: group.cards.map((card) => ({
      key: card.key,
      code: card.code,
      set: card.set,
      number: card.number,
      name: card.name,
      image:
        card.image ||
        resolveCardImageUrl({
          set: card.set,
          number: card.number,
          code: card.code,
          name: card.name,
          fallbackImage: card.image,
        }),
      category: card.category,
      slotRatePct: card.inclusionPct,
      inclusionPct: card.inclusionPct,
      oneCopyPct: card.oneCopyPct,
      twoCopyPct: card.twoCopyPct,
      badgeText: formatPercentValue(card.inclusionPct),
      title:
        `${card.name} | Total ${formatPercentValue(card.inclusionPct)} | ` +
        `2x ${formatPercentValue(card.twoCopyPct)} | ` +
        `1x ${formatPercentValue(card.oneCopyPct)} | ` +
        `Avg copies ${card.avgCopies.toFixed(1)}`,
    })),
  }));
}

const rightDeckPanelGroups = computed<RightDeckPanelGroup[]>(() => {
  if (rightDeckMode.value === "sample") {
    const sample = rightAnalytics.value.sampleDeck;
    if (!sample) return [];

    return [
      {
        key: "sample",
        label: "",
        showLabel: false,
        cards: sample.cards.map((card, index) => ({
          key: `${card.key}-${index}`,
          code: card.code,
          set: card.set,
          number: card.number,
          name: card.name,
          image:
            card.image ||
            resolveCardImageUrl({
              set: card.set,
              number: card.number,
              code: card.code,
              name: card.name,
              fallbackImage: card.image,
            }),
          category: "",
          slotRatePct: card.count,
          inclusionPct: 0,
          oneCopyPct: 0,
          twoCopyPct: 0,
          badgeText: `x${card.count}`,
          title: `${card.name} x${card.count}`,
        })),
      },
    ];
  }

  return buildCardPanelGroupsFromAnalytics(rightAnalytics.value);
});

const rightDeckPanelCards = computed<RightDeckPanelCard[]>(() => {
  return rightDeckPanelGroups.value.flatMap((group) => group.cards);
});

const rightDeckPanelSubtitleText = computed(() => {
  if (rightDeckMode.value === "sample") {
    if (!rightAnalytics.value.sampleDeck) {
      return "Best-performing filtered sample deck";
    }

    const sample = rightAnalytics.value.sampleDeck;
    return `${sample.player} | ${sample.placeLabel}`;
  }

  return routeLang.value === "zh"
    ? "依總投入率分為寶可夢、支援者、其他訓練家，並顯示 2x / 1x 比例"
    : "Pokemon, Supporters, and other Trainer cards grouped by inclusion, with 2x / 1x breakdown";
});

const rightDeckPanelSubtitle = computed(() => {
  if (rightDeckMode.value === "sample") {
    if (!rightAnalytics.value.sampleDeck) {
      return "Best-performing filtered sample deck";
    }

    const sample = rightAnalytics.value.sampleDeck;
    return `${sample.player} | ${sample.placeLabel}`;
  }

  return routeLang.value === "zh"
    ? "寶可夢、支援者、其他訓練家依投入率分組"
    : "Pokemon, Supporters, and other Trainer cards grouped by inclusion rate";
});

const rightDeckPanelEmptyText = computed(() => {
  if (rightDeckMode.value === "sample") {
    return "No sample deck is available for the current filters.";
  }

  return "No cards meet the current display threshold.";
});

watch(
  () => rightDeckPanelCards.value.length,
  async () => {
    await nextTick();
    bindDeckGridObserver();
    updateDeckViewportHeight();
  },
  { immediate: true },
);

watch(
  () => rightDeckMode.value,
  async () => {
    await nextTick();
    updateDeckViewportHeight();
  },
);

const displayDeckName = computed(() => {
  const deck = props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : {};
  const nestedDeck = deck.deck ?? {};
  const metaDeck = deck.meta?.deck ?? {};

  return (
    firstText([
      deck.displayName,
      deck.display_name,
      deck.name,
      deck.deckName,
      deck.deck_name,
      deck.title,
      deck.deckTitle,
      deck.deck_title,
      deck.archetypeName,
      deck.archetype_name,
      deck.archetype,

      nestedDeck.displayName,
      nestedDeck.display_name,
      nestedDeck.name,
      nestedDeck.deckName,
      nestedDeck.deck_name,
      nestedDeck.title,
      nestedDeck.deckTitle,
      nestedDeck.deck_title,
      nestedDeck.archetypeName,
      nestedDeck.archetype_name,
      nestedDeck.archetype,

      metaDeck.displayName,
      metaDeck.display_name,
      metaDeck.name,
      metaDeck.deckName,
      metaDeck.deck_name,
      metaDeck.title,
      metaDeck.archetypeName,
      metaDeck.archetype_name,
      metaDeck.archetype,

      leftAnalytics.value.resolvedDeckDisplayName,
      rightAnalytics.value.resolvedDeckDisplayName,
      defaultDeckLabelFromKey(analysisDeckKey.value),
    ]) || "Unknown Deck"
  );
});

const displayDeckNameEn = computed(() => {
  const deck = props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : {};
  const nestedDeck = deck.deck ?? {};
  const metaDeck = deck.meta?.deck ?? {};

  const text = firstText([
    deck.displayNameEn,
    deck.display_name_en,
    deck.englishName,
    deck.english_name,
    deck.nameEn,
    deck.name_en,
    deck.enName,
    deck.en_name,

    nestedDeck.displayNameEn,
    nestedDeck.display_name_en,
    nestedDeck.englishName,
    nestedDeck.english_name,
    nestedDeck.nameEn,
    nestedDeck.name_en,
    nestedDeck.enName,
    nestedDeck.en_name,

    metaDeck.displayNameEn,
    metaDeck.display_name_en,
    metaDeck.englishName,
    metaDeck.english_name,
    metaDeck.nameEn,
    metaDeck.name_en,
    metaDeck.enName,
    metaDeck.en_name,

    leftAnalytics.value.resolvedDeckDisplayNameEn,
    rightAnalytics.value.resolvedDeckDisplayNameEn,
  ]);

  if (!text || text === displayDeckName.value) return "";
  return text;
});

const titleSpriteUrls = computed(() => {
  const fromDeck = extractSpriteUrls(props.deck ?? {});
  if (fromDeck.length > 0) return fromDeck.slice(0, 3);

  return uniqStrings([
    ...leftAnalytics.value.targetSpriteUrls,
    ...rightAnalytics.value.targetSpriteUrls,
  ]).slice(0, 3);
});

const primaryNameLines = computed(() => {
  const base = displayDeckName.value || "";
  if (!base) return [];
  const tokens = base.split(/[／/]/).map((item) => item.trim()).filter(Boolean);
  if (tokens.length >= 2) return [tokens[0], tokens[1]];
  return [base];
});

const activeTierRow = computed<TierRow | null>(() => {
  const precomputedTierRow = activePrecomputedProfileScope.value?.tierRow;
  if (precomputedTierRow?.tier) {
    return precomputedTierRow as TierRow;
  }

  const rows = tierRows.value;
  if (!rows.length) return null;

  const exactKey = normalizeDeckKey(analysisDeckKey.value);
  if (exactKey) {
    const exact = rows.find((row) => normalizeDeckKey(row.deck) === exactKey);
    if (exact) return exact;
  }

  const targetKeys = targetDeckKeySet.value;
  if (!targetKeys.size) return null;

  return (
    rows.find((row) => {
      const normalized = normalizeDeckKey(row.deck);
      const stripped = stripDeckSetTokens(row.deck);
      return targetKeys.has(normalized) || targetKeys.has(stripped);
    }) ?? null
  );
});

const deckTierInfo = computed(() => {
  const row = activeTierRow.value;
  if (!row) return null;
  return {
    tier: row.tier,
    score: row.score,
    samples: row.total_samples,
  };
});

interface ExportZipFile {
  name: string;
  blob: Blob;
}

interface CreatorDeckExport {
  key: string;
  index: number;
  row: PrecomputedTopDeckRow;
  analytics: DeckProfileAnalytics;
  groups: RightDeckPanelGroup[];
  cards: RightDeckPanelCard[];
  sampleCards: RightDeckPanelCard[];
  sample: SampleDeckEntry | null;
  displayName: string;
  displayNameEn: string;
  spriteUrls: string[];
}

const creatorDeckExports = computed<CreatorDeckExport[]>(() =>
  creatorTopDeckRows.value
    .map((row, index) => {
      const scope = findDeckProfileScopeFromPayload(creatorTopDeckProfiles.value.get(row.key) ?? null);
      if (!scope) return null;

      const analytics = hydratePrecomputedAnalytics(scope);
      const groups = buildCardPanelGroupsFromAnalytics(analytics);
      const cards = groups.flatMap((group) => group.cards);
      const sampleCards = sampleDeckToPanelCards(analytics.sampleDeck);

      return {
        key: row.key || `top-${index + 1}`,
        index,
        row,
        analytics,
        groups,
        cards,
        sampleCards,
        sample: analytics.sampleDeck,
        displayName:
          (routeLang.value === "zh"
            ? getLocalizedDeckName(row.rawName, row.iconKeys ?? [], "zh")
            : "") ||
          analytics.resolvedDeckDisplayName ||
          row.rawName ||
          defaultDeckLabelFromKey(row.key) ||
          row.key,
        displayNameEn:
          analytics.resolvedDeckDisplayNameEn ||
          getLocalizedDeckName(row.rawName, row.iconKeys ?? [], "en") ||
          row.rawName ||
          row.key,
        spriteUrls:
          analytics.targetSpriteUrls.length > 0
            ? analytics.targetSpriteUrls
            : resolveDeckSpriteUrlsFromIconKeys(row.iconKeys ?? parseTwoFromDeckId(row.key)),
      };
    })
    .filter((panel): panel is NonNullable<typeof panel> => panel !== null),
);

const exportTopDeckPanels = computed(() =>
  creatorDeckExports.value.filter((panel) => panel.cards.length > 0),
);

const exportRenderedTopDeckPanels = computed(() =>
  props.creatorPackAssetMode === "decklists" ? [] : exportTopDeckPanels.value,
);

function sampleDeckToPanelCards(sample: SampleDeckEntry | null): RightDeckPanelCard[] {
  if (!sample) return [];

  return sample.cards.map((card, index) => ({
    key: `${card.key}-${index}`,
    code: card.code,
    set: card.set,
    number: card.number,
    name: card.name,
    image:
      card.image ||
      resolveCardImageUrl({
        set: card.set,
        number: card.number,
        code: card.code,
        name: card.name,
        fallbackImage: card.image,
      }),
    category: card.category,
    slotRatePct: card.count,
    inclusionPct: 0,
    oneCopyPct: 0,
    twoCopyPct: 0,
    badgeText: `x${card.count}`,
    title: `${card.name} x${card.count}`,
  }));
}

const exportSampleDeckPanels = computed(() =>
  creatorDeckExports.value
    .filter((panel) => panel.sampleCards.length > 0)
    .map((panel) => ({
      ...panel,
      cards: panel.sampleCards,
    })),
);

function creatorDeckNameZh(row: PrecomputedTopDeckRow) {
  return (
    getLocalizedDeckName(row.rawName, row.iconKeys ?? [], "zh") ||
    row.rawName ||
    defaultDeckLabelFromKey(row.key) ||
    row.key
  );
}

function creatorDeckNameEn(row: PrecomputedTopDeckRow) {
  return (
    getLocalizedDeckName(row.rawName, row.iconKeys ?? [], "en") ||
    row.rawName ||
    defaultDeckLabelFromKey(row.key) ||
    row.key
  );
}

function creatorCurrentRank(row: PrecomputedTopDeckRow, fallbackIndex: number) {
  const rank = Number(row.baseRank ?? fallbackIndex + 1);
  return Number.isFinite(rank) && rank > 0 ? Math.round(rank) : fallbackIndex + 1;
}

function creatorPreviousRank(row: PrecomputedTopDeckRow) {
  const previousRow = creatorPreviousTopDeckScope.value?.rows.find((item) => item.key === row.key);
  if (!previousRow) return "—";

  const rank = Number(previousRow.baseRank ?? 0);
  return Number.isFinite(rank) && rank > 0 ? `#${Math.round(rank)}` : "—";
}

function htmlEscape(value: unknown) {
  return cleanDeckText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTopDeckMatchup(sourceKey: string, targetKey: string) {
  const matchups = activeCreatorTopDeckScope.value?.matchups ?? [];
  const direct = matchups.find((item) => item.deckA === sourceKey && item.deckB === targetKey);
  if (direct) {
    const wins = Number(direct.winsA ?? 0);
    const losses = Number(direct.lossesA ?? 0);
    const ties = Number(direct.ties ?? 0);
    const total = Number(direct.total ?? wins + losses + ties);
    return {
      wins,
      losses,
      ties,
      total,
      winRate: total > 0 ? (wins + ties * 0.5) / total : 0,
    };
  }

  const reverse = matchups.find((item) => item.deckA === targetKey && item.deckB === sourceKey);
  if (reverse) {
    const wins = Number(reverse.lossesA ?? 0);
    const losses = Number(reverse.winsA ?? 0);
    const ties = Number(reverse.ties ?? 0);
    const total = Number(reverse.total ?? wins + losses + ties);
    return {
      wins,
      losses,
      ties,
      total,
      winRate: total > 0 ? (wins + ties * 0.5) / total : 0,
    };
  }

  return {
    wins: 0,
    losses: 0,
    ties: 0,
    total: 0,
    winRate: null as number | null,
  };
}

/*
const creatorReportHtml = computed(() => {
  const rows = creatorTopDeckRows.value;
  if (rows.length === 0) return "";

  const generatedAt = activeCreatorTopDeckScope.value
    ? new Date(precomputedTopDecks.value?.generatedAtMs ?? Date.now()).toLocaleString("zh-HK")
    : new Date().toLocaleString("zh-HK");

  const summaryRows = rows
    .map((row, index) => {
      const currentRank = creatorCurrentRank(row, index);
      const previousRank = creatorPreviousRank(row);
      const tier = cleanDeckText(row.tier) || "—";
      return `
        <tr>
          <td class="rank">#${currentRank}</td>
          <td>${htmlEscape(previousRank)}</td>
          <td><span class="tier-pill">${htmlEscape(tier)}</span></td>
          <td>${htmlEscape(creatorDeckNameZh(row))}</td>
          <td>${htmlEscape(creatorDeckNameEn(row))}</td>
          <td>${formatPercentValue((row.topCutShare ?? 0) * 100)}</td>
          <td>${formatPct(row.winRate)}</td>
        </tr>`;
    })
    .join("");

  const matchupHead = rows
    .map((row, index) => `<th><span>#${index + 1}</span><small>${htmlEscape(creatorDeckNameEn(row))}</small></th>`)
    .join("");

  const matchupRows = rows
    .map((source, sourceIndex) => {
      const cells = rows
        .map((target) => {
          if (source.key === target.key) return `<td class="self">—</td>`;
          const matchup = getTopDeckMatchup(source.key, target.key);
          if (!matchup.total || matchup.winRate == null) {
            return `<td><span class="muted">0勝 0敗 0平</span><span class="muted">0場</span></td>`;
          }
          return `<td><strong>${matchup.wins}勝 ${matchup.losses}敗 ${matchup.ties}平</strong><span>${matchup.total}場 · ${formatPct(matchup.winRate)}</span></td>`;
        })
        .join("");

      return `
        <tr>
          <th class="row-head">
            <span>#${sourceIndex + 1}</span>
            <strong>${htmlEscape(creatorDeckNameZh(source))}</strong>
            <small>${htmlEscape(creatorDeckNameEn(source))}</small>
          </th>
          ${cells}
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Battle Tower Meta Creator Pack - Top 15</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, "Microsoft JhengHei", sans-serif; background: #07131f; color: #eef6ff; }
    body { margin: 0; padding: 32px; background: radial-gradient(circle at top left, #0b3340, #07131f 48%, #080d1a); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 32px 0 12px; font-size: 20px; }
    p { margin: 0 0 18px; color: #9fb4c7; }
    table { width: 100%; border-collapse: collapse; background: rgba(9, 21, 36, 0.82); border: 1px solid rgba(125, 211, 252, 0.24); }
    th, td { border: 1px solid rgba(148, 163, 184, 0.18); padding: 10px; vertical-align: middle; }
    th { color: #bfe8ff; background: rgba(37, 99, 235, 0.12); text-align: left; }
    td { color: #f8fbff; }
    .rank { width: 52px; color: #7dd3fc; font-weight: 800; }
    .tier-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid rgba(251, 191, 36, 0.38); background: rgba(120, 79, 28, 0.48); color: #fff5d6; font-weight: 900; }
    .matrix-wrap { overflow-x: auto; }
    .matrix { min-width: 1280px; font-size: 12px; }
    .matrix th span, .matrix td span { display: block; color: #9fb4c7; margin-top: 3px; }
    .matrix td strong { display: block; white-space: nowrap; }
    .matrix th small, .row-head small { display: block; color: #8aa1b5; font-weight: 500; line-height: 1.25; }
    .row-head { min-width: 210px; }
    .row-head span { color: #7dd3fc; }
    .row-head strong { display: block; margin: 3px 0; color: #fff; }
    .self, .muted { color: #6b7f92; }
    strong { color: #fff; }
  </style>
</head>
<body>
  <h1>Battle Tower Meta Top 15 Creator Report</h1>
  <p>Generated: ${htmlEscape(generatedAt)} · Current: ${htmlEscape(leftPanelFilters.time)} / Top Cut ${htmlEscape(leftPanelFilters.topCut)} · Last week: previous 7 days</p>

  <h2>Top 15 牌組總覽</h2>
  <table>
    <thead>
      <tr>
        <th>目前排名</th>
        <th>上周排名</th>
        <th>Tier</th>
        <th>中文名</th>
        <th>English Name</th>
        <th>Top Cut %</th>
        <th>Win %</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Top 15 對戰矩陣</h2>
  <p>每格格式：該列牌組視角的勝-敗-平，下一行為總對戰數與勝率。</p>
  <div class="matrix-wrap">
    <table class="matrix">
      <thead>
        <tr>
          <th>Deck</th>
          ${matchupHead}
        </tr>
      </thead>
      <tbody>${matchupRows}</tbody>
    </table>
  </div>
</body>
</html>`;
});

*/

function csvCell(value: unknown) {
  const text = cleanDeckText(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvTable(headers: string[], rows: unknown[][]) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");
}

function createJsonZipFile(name: string, value: unknown): ExportZipFile {
  return createTextZipFile(name, `${JSON.stringify(value, null, 2)}\n`, "application/json;charset=utf-8");
}

function creatorMatchupRowsForPanels(panels: CreatorDeckExport[]) {
  const rows: Array<Record<string, unknown>> = [];

  for (const source of panels) {
    for (const target of panels) {
      if (source.row.key === target.row.key) continue;
      const matchup = getTopDeckMatchup(source.row.key, target.row.key);
      rows.push({
        sourceRank: creatorCurrentRank(source.row, source.index),
        sourceKey: source.row.key,
        sourceName: source.displayName,
        targetRank: creatorCurrentRank(target.row, target.index),
        targetKey: target.row.key,
        targetName: target.displayName,
        wins: matchup.wins,
        losses: matchup.losses,
        draws: matchup.ties,
        total: matchup.total,
        winRate: matchup.winRate,
      });
    }
  }

  return rows;
}

const creatorReportHtmlV2 = computed(() => {
  const panels = creatorDeckExports.value;
  if (panels.length === 0) return "";

  const generatedAt = activeCreatorTopDeckScope.value
    ? new Date(precomputedTopDecks.value?.generatedAtMs ?? Date.now()).toLocaleString("zh-HK")
    : new Date().toLocaleString("zh-HK");

  const summaryRows = panels
    .map((panel) => {
      const row = panel.row;
      const analytics = panel.analytics;

      return `
        <tr>
          <td class="rank">#${creatorCurrentRank(row, panel.index)}</td>
          <td>${htmlEscape(creatorPreviousRank(row))}</td>
          <td><span class="tier-pill">${htmlEscape(cleanDeckText(row.tier) || "-")}</span></td>
          <td>${htmlEscape(panel.displayName)}</td>
          <td>${htmlEscape(panel.displayNameEn)}</td>
          <td>${formatPercentValue((row.topCutShare ?? 0) * 100)}</td>
          <td>${formatPct(row.winRate)}</td>
          <td>${htmlEscape(formatRecord(analytics.wins, analytics.losses, analytics.draws))}</td>
          <td>${Number(row.selectedSamples ?? 0).toLocaleString()}</td>
        </tr>`;
    })
    .join("");

  const matchupHead = panels
    .map((panel) => `<th><span>#${creatorCurrentRank(panel.row, panel.index)}</span><small>${htmlEscape(panel.displayNameEn || panel.displayName)}</small></th>`)
    .join("");

  const matchupRows = panels
    .map((source) => {
      const cells = panels
        .map((target) => {
          if (source.row.key === target.row.key) return `<td class="self">-</td>`;
          const matchup = getTopDeckMatchup(source.row.key, target.row.key);
          if (!matchup.total || matchup.winRate == null) {
            return `<td><span class="muted">0-0-0</span><span class="muted">0 games</span></td>`;
          }
          return `<td><strong>${matchup.wins}-${matchup.losses}-${matchup.ties}</strong><span>${matchup.total} games / ${formatPct(matchup.winRate)}</span></td>`;
        })
        .join("");

      return `
        <tr>
          <th class="row-head">
            <span>#${creatorCurrentRank(source.row, source.index)}</span>
            <strong>${htmlEscape(source.displayName)}</strong>
            <small>${htmlEscape(source.displayNameEn)}</small>
          </th>
          ${cells}
        </tr>`;
    })
    .join("");

  const decklistSections = panels
    .map((panel) => {
      const cardRows = (panel.sample?.cards ?? [])
        .map((card, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${htmlEscape(card.name)}</td>
            <td>${htmlEscape(card.code || `${card.set} ${card.number}`)}</td>
            <td>${Number(card.count ?? 0)}</td>
            <td>${htmlEscape(card.category)}</td>
          </tr>`)
        .join("");

      return `
        <section class="decklist-block">
          <h3>#${creatorCurrentRank(panel.row, panel.index)} ${htmlEscape(panel.displayName)}</h3>
          <p>${htmlEscape(panel.sample?.player ?? "")} ${htmlEscape(panel.sample?.placeLabel ?? "")} ${htmlEscape(panel.sample?.tournamentName ?? "")}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Card</th>
                <th>Code</th>
                <th>Count</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>${cardRows || `<tr><td colspan="5" class="muted">No decklist data</td></tr>`}</tbody>
          </table>
        </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Battle Tower Meta Creator Pack - S to C tiers</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, "Microsoft JhengHei", sans-serif; background: #07131f; color: #eef6ff; }
    body { margin: 0; padding: 32px; background: radial-gradient(circle at top left, #0b3340, #07131f 48%, #080d1a); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin: 32px 0 12px; font-size: 20px; }
    h3 { margin: 22px 0 8px; font-size: 16px; color: #fff; }
    p { margin: 0 0 18px; color: #9fb4c7; }
    table { width: 100%; border-collapse: collapse; background: rgba(9, 21, 36, 0.82); border: 1px solid rgba(125, 211, 252, 0.24); }
    th, td { border: 1px solid rgba(148, 163, 184, 0.18); padding: 10px; vertical-align: middle; }
    th { color: #bfe8ff; background: rgba(37, 99, 235, 0.12); text-align: left; }
    td { color: #f8fbff; }
    .rank { width: 52px; color: #7dd3fc; font-weight: 800; }
    .tier-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid rgba(251, 191, 36, 0.38); background: rgba(120, 79, 28, 0.48); color: #fff5d6; font-weight: 900; }
    .matrix-wrap { overflow-x: auto; }
    .matrix { min-width: 1280px; font-size: 12px; }
    .matrix th span, .matrix td span { display: block; color: #9fb4c7; margin-top: 3px; }
    .matrix td strong { display: block; white-space: nowrap; }
    .matrix th small, .row-head small { display: block; color: #8aa1b5; font-weight: 500; line-height: 1.25; }
    .row-head { min-width: 210px; }
    .row-head span { color: #7dd3fc; }
    .row-head strong { display: block; margin: 3px 0; color: #fff; }
    .decklist-block { margin-top: 20px; }
    .self, .muted { color: #6b7f92; }
    strong { color: #fff; }
  </style>
</head>
<body>
  <h1>Battle Tower Meta S-C Creator Report</h1>
  <p>Generated: ${htmlEscape(generatedAt)} / Scope: ${htmlEscape(leftPanelFilters.time)} / Top Cut ${htmlEscape(leftPanelFilters.topCut)} / Tiers: ${CREATOR_EXPORT_TIERS.join(", ")}</p>

  <h2>Deck table data</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Previous</th>
        <th>Tier</th>
        <th>Name</th>
        <th>English Name</th>
        <th>Top Cut %</th>
        <th>Win %</th>
        <th>Record</th>
        <th>Samples</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Head-to-head matchup win rates</h2>
  <div class="matrix-wrap">
    <table class="matrix">
      <thead>
        <tr>
          <th>Deck</th>
          ${matchupHead}
        </tr>
      </thead>
      <tbody>${matchupRows}</tbody>
    </table>
  </div>

  <h2>Decklists</h2>
  ${decklistSections}
</body>
</html>`;
});

function buildCreatorDataZipFiles(): ExportZipFile[] {
  const panels = creatorDeckExports.value;
  if (panels.length === 0) return [];

  const generatedAt = precomputedTopDecks.value?.generatedAt ?? new Date().toISOString();
  const matchups = creatorMatchupRowsForPanels(panels);
  const deckRows = panels.map((panel) => {
    const row = panel.row;
    const analytics = panel.analytics;
    return {
      rank: creatorCurrentRank(row, panel.index),
      previousRank: creatorPreviousRank(row),
      tier: cleanDeckText(row.tier),
      key: row.key,
      name: panel.displayName,
      nameEn: panel.displayNameEn,
      score: row.score,
      topCutShare: row.topCutShare,
      winRate: row.winRate,
      record: {
        wins: analytics.wins,
        losses: analytics.losses,
        draws: analytics.draws,
        matches: analytics.matchCount,
      },
      samples: {
        all: row.allSamples,
        selected: row.selectedSamples,
        baselineTop32: row.baselineTop32Samples,
      },
      top4Counts: analytics.top4Counts,
      sampleDeck: panel.sample
        ? {
            player: panel.sample.player,
            place: panel.sample.place,
            placeLabel: panel.sample.placeLabel,
            tournamentName: panel.sample.tournamentName,
            dateLabel: panel.sample.dateLabel,
            listUrl: panel.sample.listUrl,
            cards: panel.sample.cards,
          }
        : null,
      cardTable: analytics.cardsFlat,
      bestFinishes: analytics.bestFinishes,
    };
  });

  const deckCsv = csvTable(
    ["rank", "previous_rank", "tier", "key", "name", "name_en", "score", "top_cut_share", "win_rate", "wins", "losses", "draws", "selected_samples"],
    deckRows.map((deck) => [
      deck.rank,
      deck.previousRank,
      deck.tier,
      deck.key,
      deck.name,
      deck.nameEn,
      deck.score,
      deck.topCutShare,
      deck.winRate ?? "",
      deck.record.wins,
      deck.record.losses,
      deck.record.draws,
      deck.samples.selected,
    ]),
  );

  const decklistCsv = csvTable(
    ["deck_rank", "deck_key", "deck_name", "card_index", "card_name", "card_code", "set", "number", "count", "category"],
    panels.flatMap((panel) =>
      (panel.sample?.cards ?? []).map((card, index) => [
        creatorCurrentRank(panel.row, panel.index),
        panel.row.key,
        panel.displayName,
        index + 1,
        card.name,
        card.code,
        card.set,
        card.number,
        card.count,
        card.category,
      ]),
    ),
  );

  const matchupsCsv = csvTable(
    ["source_rank", "source_key", "source_name", "target_rank", "target_key", "target_name", "wins", "losses", "draws", "total", "win_rate"],
    matchups.map((row) => [
      row.sourceRank,
      row.sourceKey,
      row.sourceName,
      row.targetRank,
      row.targetKey,
      row.targetName,
      row.wins,
      row.losses,
      row.draws,
      row.total,
      row.winRate ?? "",
    ]),
  );

  const bestFinishesCsv = csvTable(
    ["deck_rank", "deck_key", "deck_name", "player", "place", "place_label", "tournament", "date", "players", "decklist_url"],
    panels.flatMap((panel) =>
      panel.analytics.bestFinishes.map((finish) => [
        creatorCurrentRank(panel.row, panel.index),
        panel.row.key,
        panel.displayName,
        finish.player,
        finish.place,
        finish.placeLabel,
        finish.tournamentName,
        finish.dateLabel,
        finish.players ?? "",
        finish.listUrl,
      ]),
    ),
  );

  return [
    createJsonZipFile("data/decks.json", {
      generatedAt,
      filters: {
        time: leftPanelFilters.time,
        set: activeTopDeckSetValue(),
        topCut: leftPanelFilters.topCut,
        tiers: CREATOR_EXPORT_TIERS,
      },
      decks: deckRows,
      matchups,
    }),
    createTextZipFile("data/decks.csv", `${deckCsv}\r\n`, "text/csv;charset=utf-8"),
    createTextZipFile("data/decklists.csv", `${decklistCsv}\r\n`, "text/csv;charset=utf-8"),
    createTextZipFile("data/matchups.csv", `${matchupsCsv}\r\n`, "text/csv;charset=utf-8"),
    createTextZipFile("data/best-finishes.csv", `${bestFinishesCsv}\r\n`, "text/csv;charset=utf-8"),
  ];
}

const creatorTopDeckProfilesReady = computed(() => {
  const rows = creatorTopDeckRows.value;
  return rows.length > 0 && rows.every((row) => creatorTopDeckProfiles.value.has(row.key));
});

const creatorPackAvailable = computed(() => {
  if (!creatorTopDeckProfilesReady.value) return false;

  const hasDecklistPanels = exportSampleDeckPanels.value.length > 0;
  const hasCardRatePanels = exportRenderedTopDeckPanels.value.length > 0;

  return (
    hasCardRatePanels ||
    hasDecklistPanels ||
    creatorReportHtmlV2.value.length > 0
  );
});

const creatorPackDataLoading = computed(() => {
  return (
    precomputedTopDecksLoading.value ||
    creatorTopDeckProfilesLoading.value ||
    precomputedProfileLoading.value
  );
});

function setTopDeckExportPanelRef(el: Element | null | unknown, key: string) {
  if (el instanceof HTMLElement) {
    topDeckExportPanelRefs.set(key, el);
  } else {
    topDeckExportPanelRefs.delete(key);
  }
}

function setSampleDeckExportPanelRef(el: Element | null | unknown, key: string) {
  if (el instanceof HTMLElement) {
    sampleDeckExportPanelRefs.set(key, el);
  } else {
    sampleDeckExportPanelRefs.delete(key);
  }
}

async function waitForImages(root: HTMLElement) {
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
        window.setTimeout(finish, 2500);
      });
    }),
  );
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

function zipSafePngPath(value: string) {
  const parts = value
    .split(/[\\/]+/)
    .map((part) => slugify(part))
    .filter(Boolean);

  return `${parts.join("/") || "battle-tower-panel"}.png`;
}

function createTextZipFile(name: string, content: string, type = "text/html;charset=utf-8"): ExportZipFile {
  return {
    name: name.replace(/\\/g, "/"),
    blob: new Blob([content], { type }),
  };
}

async function renderElementAsTransparentPng(
  element: HTMLElement,
  fileName: string,
): Promise<ExportZipFile | null> {
  await waitForImages(element);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: CREATOR_EXPORT_PIXEL_RATIO,
    backgroundColor: "rgba(0,0,0,0)",
    filter: (node) => !(node instanceof HTMLElement && node.dataset.exportIgnore === "true"),
  });

  if (!blob) return null;

  return {
    name: zipSafePngPath(fileName),
    blob,
  };
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }

  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosTime, dosDate };
}

function writeZipHeader(
  signature: number,
  size: number,
  nameBytes: Uint8Array,
  dataSize: number,
  crc: number,
  localOffset = 0,
) {
  const header = new Uint8Array(size + nameBytes.length);
  const view = new DataView(header.buffer);
  const { dosTime, dosDate } = dosDateTime();

  view.setUint32(0, signature, true);

  if (signature === 0x04034b50) {
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataSize, true);
    view.setUint32(22, dataSize, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    return header;
  }

  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime, true);
  view.setUint16(14, dosDate, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, dataSize, true);
  view.setUint32(24, dataSize, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localOffset, true);
  header.set(nameBytes, 46);

  return header;
}

function createEndOfCentralDirectory(fileCount: number, centralSize: number, centralOffset: number) {
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);

  return end;
}

async function createZipBlob(files: ExportZipFile[]) {
  const encoder = new TextEncoder();
  const localParts: BlobPart[] = [];
  const centralParts: BlobPart[] = [];
  let localOffset = 0;
  let centralSize = 0;

  for (const file of files) {
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const nameBytes = encoder.encode(file.name.replace(/\\/g, "/"));
    const checksum = crc32(data);
    const localHeader = writeZipHeader(0x04034b50, 30, nameBytes, data.byteLength, checksum);
    const centralHeader = writeZipHeader(
      0x02014b50,
      46,
      nameBytes,
      data.byteLength,
      checksum,
      localOffset,
    );

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    localOffset += localHeader.byteLength + data.byteLength;
    centralSize += centralHeader.byteLength;
  }

  const end = createEndOfCentralDirectory(files.length, centralSize, localOffset);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

async function downloadCreatorPack() {
  if (downloadingCreatorPack.value || !creatorPackAvailable.value) return;

  downloadingCreatorPack.value = true;
  exportStageActive.value = true;
  topDeckExportPanelRefs.clear();
  sampleDeckExportPanelRefs.clear();

  try {
    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const includeCardRatePanels = props.creatorPackAssetMode !== "decklists";
    const baseName =
      props.creatorPackAssetMode === "decklists"
        ? "battle-tower-meta-s-to-c-decklists"
        : "battle-tower-meta-s-to-c";
    const downloads: Array<{ element: HTMLElement | null; fileName: string }> = [
      ...(includeCardRatePanels
        ? exportRenderedTopDeckPanels.value.map((panel) => ({
            element: topDeckExportPanelRefs.get(panel.key) ?? null,
            fileName: `card-rates/top-${String(panel.index + 1).padStart(2, "0")}-${panel.displayNameEn || panel.displayName}-card-rates`,
          }))
        : []),
      ...exportSampleDeckPanels.value.map((panel) => ({
        element: sampleDeckExportPanelRefs.get(panel.key) ?? null,
        fileName: `decklists/top-${String(panel.index + 1).padStart(2, "0")}-${panel.displayNameEn || panel.displayName}-decklist`,
      })),
    ];
    const files: ExportZipFile[] = [];

    if (creatorReportHtmlV2.value) {
      files.push(createTextZipFile("index.html", creatorReportHtmlV2.value));
    }

    files.push(...buildCreatorDataZipFiles());

    for (const item of downloads) {
      if (!item.element) continue;
      const rendered = await renderElementAsTransparentPng(item.element, item.fileName);
      if (rendered) files.push(rendered);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
    }

    if (files.length === 0) return;

    const zipBlob = await createZipBlob(files);
    triggerBlobDownload(zipBlob, `${baseName}-creator-pack.zip`);
  } catch (error) {
    console.error("[DeckProfile] downloadCreatorPack failed:", error);
  } finally {
    exportStageActive.value = false;
    downloadingCreatorPack.value = false;
  }
}

watch(
  () =>
    [
      props.autoDownloadCreatorPack,
      creatorPackAvailable.value,
      creatorPackDataLoading.value,
      cardCatalogLoaded.value,
    ] as const,
  async ([shouldDownload, available, loading, catalogReady]) => {
    if (!shouldDownload || !available || loading || !catalogReady || autoCreatorStarted.value) return;

    autoCreatorStarted.value = true;
    await nextTick();
    await downloadCreatorPack();
    emit("creatorPackFinished");
  },
  { immediate: true },
);

async function downloadTransparentDeckPanel() {
  if (downloadingDeckPanel.value) return;
  if (!deckPanelRef.value) return;

  downloadingDeckPanel.value = true;

  const viewport = deckCardsViewportRef.value;
  const prevMaxHeight = viewport?.style.maxHeight ?? "";
  const prevOverflowY = viewport?.style.overflowY ?? "";

  try {
    if (viewport) {
      viewport.style.maxHeight = "none";
      viewport.style.overflowY = "visible";
    }

    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(deckPanelRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "rgba(0,0,0,0)",
      filter: (node) => !(node instanceof HTMLElement && node.dataset.exportIgnore === "true"),
    });

    const link = document.createElement("a");
    const fileName =
      slugify(displayDeckNameEn.value || displayDeckName.value || analysisDeckKey.value) ||
      "deck-panel";

    link.href = dataUrl;
    link.download = `${fileName}-transparent.png`;
    link.click();
  } catch (error) {
    console.error("[DeckProfile] downloadTransparentDeckPanel failed:", error);
  } finally {
    if (viewport) {
      viewport.style.maxHeight = prevMaxHeight;
      viewport.style.overflowY = prevOverflowY;
    }

    downloadingDeckPanel.value = false;
  }
}

/* -----------------------------
   sort
------------------------------ */

function toggleFinishSort(key: FinishSortKey) {
  if (finishSort.key === key) {
    finishSort.dir = finishSort.dir === "asc" ? "desc" : "asc";
  } else {
    finishSort.key = key;
    finishSort.dir = key === "dateMs" ? "desc" : "asc";
  }
  // 排序条件改变时重置页码
  resetPage();
}

function finishSortMark(key: FinishSortKey) {
  if (finishSort.key !== key) return "↕";
  return finishSort.dir === "asc" ? "↑" : "↓";
}

const sortedBestFinishes = computed(() => {
  const rows = [...leftAnalytics.value.bestFinishes];

  rows.sort((a, b) => {
    let result = 0;

    switch (finishSort.key) {
      case "player":
        result = compareText(a.player, b.player);
        break;
      case "tournamentName":
        result = compareText(a.tournamentName, b.tournamentName);
        break;
      case "dateMs":
        result = a.dateMs - b.dateMs;
        break;
      case "place":
        result = a.place - b.place || (b.players ?? 0) - (a.players ?? 0) || b.dateMs - a.dateMs || compareText(a.player, b.player);
        break;
    }

    return finishSort.dir === "asc" ? result : -result;
  });

  return rows;
});

// 分页后的数据
const paginatedBestFinishes = computed(() => {
  const rows = sortedBestFinishes.value;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return rows.slice(start, end);
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(sortedBestFinishes.value.length / pageSize.value);
});

// 切换页码
function changePage(page: number) {
  currentPage.value = page;
}

// 重置页码（当排序或筛选条件改变时）
function resetPage() {
  currentPage.value = 1;
}
</script>

<style scoped>
.deck-profile {
  --bg-main: #07131f;
  --bg-panel: rgba(10, 24, 42, 0.94);
  --bg-panel-2: rgba(14, 25, 43, 0.78);
  --border: rgba(115, 192, 255, 0.18);
  --border-soft: rgba(115, 192, 255, 0.12);
  --text-main: #f5fbff;
  --text-soft: #9bbad6;
  --text-dim: #6f8cab;
  --accent: #ff7f50;
  --accent-soft: rgba(255, 127, 80, 0.18);
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.28);

  position: relative;
  width: 100%;
  min-height: 0;
  display: grid;
  gap: 14px;
  color: var(--text-main);
}

.deck-profile,
.deck-profile * {
  box-sizing: border-box;
}

.deck-profile,
.hero-grid,
.hero-panel--decklist,
.card-grid--flat,
.table-scroll {
  scrollbar-width: none;
}

.deck-profile::-webkit-scrollbar,
.hero-grid::-webkit-scrollbar,
.hero-panel--decklist::-webkit-scrollbar,
.card-grid--flat::-webkit-scrollbar,
.table-scroll::-webkit-scrollbar {
  display: none;
}

.mono {
  font-family: var(--font-num);
}

.hero-grid {
  --tech-frame-cyan: rgba(64, 230, 255, 0.55);
  --tech-frame-cyan-dim: rgba(64, 230, 255, 0.22);
  --tech-frame-amber: rgba(255, 140, 90, 0.55);
  --tech-frame-amber-dim: rgba(255, 140, 90, 0.2);

  position: relative;
  z-index: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
  isolation: isolate;
  padding: 16px 18px 18px;
  margin: 4px 0 0;
}

.hero-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: 3px;
  border: 1px solid var(--tech-frame-cyan-dim);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 28px rgba(0, 200, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  clip-path: polygon(
    0 14px,
    14px 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% calc(100% - 14px),
    calc(100% - 14px) 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
}

.hero-grid::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.92;
  background:
    linear-gradient(90deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px 12px / 28px 2px no-repeat,
    linear-gradient(180deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px 12px / 2px 28px no-repeat,
    linear-gradient(270deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 12px) 12px / 28px 2px no-repeat,
    linear-gradient(180deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 14px) 12px / 2px 28px no-repeat,
    linear-gradient(90deg, var(--tech-frame-cyan-dim), var(--tech-frame-cyan)) 12px calc(100% - 12px) / 28px 2px no-repeat,
    linear-gradient(0deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px calc(100% - 14px) / 2px 28px no-repeat,
    linear-gradient(90deg, var(--tech-frame-amber-dim), var(--tech-frame-amber)) calc(100% - 12px) calc(100% - 12px) / 28px 2px no-repeat,
    linear-gradient(0deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 14px) calc(100% - 14px) / 2px 28px no-repeat,
    linear-gradient(90deg, transparent, rgba(0, 220, 255, 0.12), transparent) 18px 0 / calc(100% - 36px) 1px no-repeat;
  clip-path: polygon(
    0 14px,
    14px 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% calc(100% - 14px),
    calc(100% - 14px) 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
}

.hero-sidebar {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 12px;
}

.hero-panel,
.table-card {
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.18), rgba(8, 16, 28, 0.18)),
    var(--bg-panel);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-left: none;
  border-top: none;
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.hero-panel {
  padding: 14px;
}

.hero-panel--title {
  padding: 20px;
  text-align: center;
}

.panel-kicker {
  display: none;
  margin-bottom: 12px;
  color: #8ed2ff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.deck-title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.deck-title-text {
  min-width: 0;
  flex: 1 1 auto;
}

.deck-display-line {
  margin: 0;
  font-size: 1.7rem;
  line-height: 1.08;
  font-weight: 900;
  color: #f8fbff;
  word-break: break-word;
}

.deck-display-subline {
  margin: 2px 0 0;
  font-size: 1.4rem;
  line-height: 1.08;
  font-weight: 800;
  color: #f5fbff;
}

.deck-english-name {
  margin: 4px 0 0;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.deck-meta-line {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.deck-meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.24);
  background: rgba(5, 20, 36, 0.85);
  color: #e6f3ff;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.deck-title-right {
  display: grid;
  align-content: space-between;
  justify-items: center;
  gap: 6px;
}

.sprite-stack--title {
  min-width: 96px;
}

.sprite-chip--title {
  width: 44px;
  height: 44px;
}

.deck-tier-line {
  display: flex;
  justify-content: center;
}

.sprite-stack {
  min-width: 84px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
}

.sprite-stack--small {
  min-width: 0;
  justify-content: center;
}

.sprite-chip {
  width: 36px;
  height: 36px;
  object-fit: contain;
  image-rendering: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.26));
}

.sprite-chip--small {
  width: 28px;
  height: 28px;
}

.sprite-fallback {
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  font-weight: 900;
}

.sprite-fallback--small {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  font-size: 0.82rem;
}

.hero-panel--stats {
  display: grid;
  gap: 16px;
  align-content: start;
  padding: 20px;
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-title {
  margin: 0;
  color: var(--text-main);
  font-size: 1.3rem;
  font-weight: 900;
  text-align: center;
  width: 100%;
}

.placement-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.placement-card {
  border-radius: 14px;
  padding: 10px 8px;
  border: 1px solid var(--border-soft);
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
}

.placement-card--gold {
  background: rgba(195, 156, 42, 0.18);
}

.placement-card--silver {
  background: rgba(137, 154, 181, 0.18);
}

.placement-card--bronze {
  background: rgba(172, 116, 72, 0.14);
}

.placement-card--blue {
  background: rgba(96, 128, 198, 0.14);
}

.placement-rank {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #dceeff;
  letter-spacing: 0.08em;
}

.placement-value {
  display: block;
  margin-top: 6px;
  font-size: 1.08rem;
  color: #ffffff;
}

.metric-row {
  margin-top: 2px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  border-radius: 14px;
  background: rgba(14, 25, 43, 0.6);
  border: 1px solid var(--border-soft);
  padding: 6px 10px 4px;
}

.semi-gauge {
  position: relative;
  height: 86px;
}

.semi-gauge__svg {
  width: 100%;
  height: 70px;
  display: block;
}

.semi-gauge__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 14;
  stroke-linecap: butt;
}

.semi-gauge__value {
  fill: none;
  stroke: var(--accent);
  stroke-width: 14;
  stroke-linecap: butt;
}

.semi-gauge__label {
  position: absolute;
  left: 0;
  right: 0;
  top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.semi-gauge__label strong {
  font-size: 1.2rem;
  color: #ffffff;
}

.semi-gauge__caption {
  margin-top: 4px;
  text-align: center;
  color: var(--text-soft);
  font-size: 1.2rem;
}

.record-line {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 10px;
  text-align: center;
  color: #d7e8ff;
  font-size: 0.92rem;
  overflow-x: auto;
  padding: 0 4px;
}

.record-bubble {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(18, 32, 56, 0.72);
  color: #dceeff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
  flex: 0 0 auto;
}

.record-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.record-bubble--win {
  border-color: rgba(120, 220, 160, 0.55);
  background: rgba(18, 42, 34, 0.55);
}

.record-bubble--loss {
  border-color: rgba(255, 130, 130, 0.5);
  background: rgba(42, 22, 26, 0.5);
}

.record-bubble--draw {
  border-color: rgba(240, 210, 120, 0.55);
  background: rgba(42, 38, 22, 0.5);
}

.hero-panel--matchups {
  display: grid;
  gap: 16px;
  align-content: start;
  padding: 20px;
}

.matchup-group {
  display: grid;
  gap: 12px;
}

.matchup-group__title {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-align: center;
}

.matchup-group__title--good {
  color: #d9fff0;
}

.matchup-group__title--bad {
  color: #ffe2e2;
}

.matchup-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.matchup-tile {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  padding: 8px 6px;
  text-align: center;
}

.matchup-tile--good {
  background: rgba(18, 74, 58, 0.22);
}

.matchup-tile--bad {
  background: rgba(96, 36, 36, 0.22);
}

.matchup-rate {
  margin-top: 4px;
  font-size: 1.2rem;
  font-weight: 800;
  color: #f8fbff;
}

.matchup-empty {
  min-height: 46px;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.hero-panel--decklist {
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.cards-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  text-align: center;
}

.card-grid--flat {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
  overflow: hidden;
}

.card-tile--flat {
  position: relative;
  border: none;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: none;
}

.card-image--flat,
.card-image-fallback--flat {
  width: 100%;
  aspect-ratio: 63 / 88;
  display: block;
  object-fit: contain;
  border-radius: 10px;
  background: transparent;
}

.card-image-fallback--flat {
  display: grid;
  place-items: center;
  background: rgba(20, 30, 48, 0.7);
  color: #eef6ff;
  font-size: 1.2rem;
  font-weight: 900;
}

.card-rate-overlay {
  position: absolute;
  left: 8px;
  bottom: 8px;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(5, 10, 18, 0.82);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
}

.card-copy-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(255, 127, 80, 0.96);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.table-card {
  overflow: hidden;
}

.section-head {
  padding: 16px 18px 8px;
}

.section-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #f6fbff;
}

.table-scroll {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table thead th {
  position: relative;
  text-align: left;
  padding: 12px 18px;
  color: #d8e8f8;
  font-size: 0.94rem;
  font-weight: 900;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  white-space: nowrap;
}

.results-table tbody td {
  padding: 14px 18px;
  border-top: 1px solid rgba(115, 192, 255, 0.08);
  color: #edf7ff;
  vertical-align: middle;
}

.results-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.025);
}

.player-col {
  font-weight: 800;
  color: #ffffff;
}

.tournament-col {
  color: #ffd27a;
  font-weight: 700;
}

.sort-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-weight: 800;
  color: inherit;
}

.sort-mark {
  color: #7ec8ff;
  font-size: 0.8rem;
}

.list-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: #fff5f0;
  text-decoration: none;
  font-weight: 800;
  border: 1px solid rgba(255, 127, 80, 0.4);
}

.list-btn:hover {
  background: rgba(255, 127, 80, 0.3);
}

.muted {
  color: var(--text-dim);
}

.empty-table {
  text-align: center;
  color: var(--text-dim);
  padding: 22px 18px;
}

@media (max-width: 1280px) {
  .hero-grid {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .card-grid--flat {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-sidebar {
    grid-template-rows: auto auto auto;
  }

  .card-grid--flat {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .deck-display-name {
    font-size: 1.55rem;
  }

  .placement-grid,
  .metric-row,
  .matchup-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-grid--flat {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .results-table thead th,
  .results-table tbody td {
    padding: 12px 12px;
    font-size: 0.92rem;
  }
}

/* ===== DeckProfile override: restore tech frame + report-like cards ===== */

.deck-profile {
  padding-top: 10px;
}

.deck-profile::before {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  top: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(126, 200, 255, 0),
    rgba(126, 200, 255, 0.92),
    rgba(126, 200, 255, 0)
  );
  opacity: 0.9;
}

.hero-grid {
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: start;
}

@media (min-width: 1081px) {
  .hero-sidebar {
    position: sticky;
    top: 82px;
  }
}

.hero-panel,
.table-card {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.2), rgba(6, 12, 22, 0.2)),
    rgba(9, 22, 39, 0.96);
  border-right: 1px solid rgba(77, 154, 220, 0.26);
  border-bottom: 1px solid rgba(77, 154, 220, 0.26);
  border-left: none;
  border-top: none;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(86, 173, 255, 0.06);
}

.hero-panel::before,
.table-card::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: none;
  border-radius: 14px;
  pointer-events: none;
}

.hero-panel::after,
.table-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(126, 200, 255, 0.7), transparent 72%) top 16px left 16px / 96px 1px no-repeat,
    linear-gradient(180deg, rgba(126, 200, 255, 0.55), transparent 72%) top 16px left 16px / 1px 72px no-repeat,
    linear-gradient(90deg, transparent, rgba(126, 200, 255, 0.4)) bottom 16px right 16px / 84px 1px no-repeat,
    linear-gradient(180deg, transparent, rgba(126, 200, 255, 0.38)) bottom 16px right 16px / 1px 64px no-repeat;
  opacity: 0.8;
}

.hero-panel--title {
  display: grid;
  gap: 12px;
}

.hero-panel--decklist {
  min-height: 680px;
  max-height: 980px;
  overflow: auto;
  padding: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(126, 200, 255, 0.24) rgba(255, 255, 255, 0.04);
}

.hero-panel--decklist::-webkit-scrollbar {
  display: block;
  width: 10px;
}

.hero-panel--decklist::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.hero-panel--decklist::-webkit-scrollbar-thumb {
  background: rgba(126, 200, 255, 0.24);
  border-radius: 999px;
  border: 2px solid rgba(7, 19, 31, 0.92);
}

.decklist-shell {
  position: relative;
  z-index: 1;
  padding: 18px;
  display: grid;
  gap: 20px;
}

.cardsGrid--profile {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.profileCard {
  min-width: 0;
}

.profileCard__imageWrap {
  position: relative;
  aspect-ratio: 5 / 7;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(115, 192, 255, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.profileCard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.03);
}

.profileCard__fallback {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.85),
    rgba(15, 23, 42, 0.92)
  );
  color: rgba(255, 255, 255, 0.94);
}

.profileCard__fallbackName {
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.3;
}

.profileCard__fallbackCode {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.78rem;
}

.profileCard__rate {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 2;
  min-height: 38px;
  min-width: 72px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.03em;
  background: linear-gradient(180deg, rgba(18, 83, 143, 0.96) 0%, rgba(9, 45, 83, 0.96) 100%);
  border: 1px solid rgba(126, 200, 255, 0.34);
  color: #eef7ff;
  font-size: 1.4rem;
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}


.profileCard__body {
  padding: 10px 4px 0;
}

.cards-empty {
  min-height: 260px;
  border-radius: 16px;
  border: 1px dashed rgba(115, 192, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

@media (max-width: 1380px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .hero-grid {
    grid-template-columns: 300px minmax(0, 1fr);
  }
}

@media (max-width: 1080px) {
  .hero-panel--decklist {
    min-height: 0;
    max-height: none;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .decklist-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileCard__name {
    font-size: 0.9rem;
  }

  .profileCard__rate {
    min-height: 34px;
    min-width: 64px;
    padding: 0 12px;
    font-size: 0.86rem;
  }
}

.deck-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.download-btn {
  appearance: none;
  border: 1px solid rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.22);
  color: #eef7ff;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  white-space: nowrap;
}

.download-btn:hover:not(:disabled) {
  background: rgba(18, 83, 143, 0.34);
  border-color: rgba(126, 200, 255, 0.42);
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.decklist-shell {
  gap: 16px;
}

.decklist-group {
  gap: 0;
}

.profileCard {
  min-width: 0;
}

.profileCard__body {
  display: none;
}

@media (max-width: 720px) {
  .deck-actions {
    justify-content: stretch;
  }

  .download-btn {
    width: 100%;
  }
}

.hero-panel--title {
  display: grid;
  gap: 12px;
}

.hero-panel--decklist {
  min-height: 0;
  max-height: none;
  overflow: hidden;
  padding: 0;
}

.decklist-shell {
  position: relative;
  z-index: 1;
  padding: 18px;
  display: grid;
  gap: 0;
}

.decklist-viewport {
  overflow: hidden;
}

.decklist-viewport--scrollable {
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(126, 200, 255, 0.24) rgba(255, 255, 255, 0.04);
}

.decklist-viewport--scrollable::-webkit-scrollbar {
  display: block;
  width: 8px;
}

.decklist-viewport--scrollable::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.decklist-viewport--scrollable::-webkit-scrollbar-thumb {
  background: rgba(126, 200, 255, 0.24);
  border-radius: 999px;
  border: 2px solid rgba(7, 19, 31, 0.92);
}

.cardsGrid--profile {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  align-content: start;
}

.profileCard {
  min-width: 0;
}

.profileCard__imageWrap {
  position: relative;
  aspect-ratio: 5 / 7;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(115, 192, 255, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.profileCard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.03);
}

.profileCard__body {
  display: none;
}

.profileCard--breakdown {
  display: block;
}

.profileCard__imageWrap--breakdown {
  flex: 0 0 auto;
}

.profileCard__stats {
  --one-rate: 0%;
  --two-rate: 0%;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 53%;
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  align-items: center;
  gap: 7px;
  padding: 8px;
  border-radius: 0 0 12px 12px;
  border-top: 1px solid rgba(126, 200, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(4, 14, 26, 0.1) 0%, rgba(4, 14, 26, 0.88) 24%, rgba(3, 10, 19, 0.98) 100%),
    rgba(7, 18, 32, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 -12px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
}

.profileCard__rateDial {
  position: relative;
  width: 100%;
  height: 100%;
  justify-self: center;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 5px;
  padding-top: 5px;
}

.profileCard__rateDialLabel {
  color: rgba(236, 247, 255, 0.92);
  font-size: 0.86rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
}

.profileCard__rateDialValue {
  position: relative;
  width: min(122px, calc(100% - 4px));
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 1.06rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  background:
    radial-gradient(circle, rgba(5, 16, 29, 0.98) 0 52%, transparent 53%),
    conic-gradient(
      from 0deg,
      rgba(64, 148, 255, 0.98) 0 var(--one-rate),
      rgba(255, 122, 82, 0.98) var(--one-rate) calc(var(--one-rate) + var(--two-rate)),
      rgba(255, 255, 255, 0.18) calc(var(--two-rate) + var(--one-rate)) 100%
    );
  box-shadow:
    0 7px 15px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.48);
}

.profileCard__copyBreakdown {
  display: grid;
  grid-template-rows: repeat(2, clamp(40px, 30%, 54px));
  align-content: center;
  gap: 7px;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.profileCard__copyStat {
  position: relative;
  display: grid;
  grid-template-columns: minmax(18px, 0.72fr) 2px minmax(36px, 1.28fr);
  align-items: center;
  column-gap: 5px;
  min-height: 0;
  padding: 4px 7px;
  border-radius: 13px;
  border: 2px solid rgba(39, 227, 255, 0.7);
  overflow: hidden;
  color: #eef7ff;
  line-height: 1;
  background:
    radial-gradient(circle at 18% 50%, rgba(35, 171, 255, 0.28), transparent 58%),
    linear-gradient(180deg, rgba(6, 25, 55, 0.98), rgba(0, 9, 28, 0.98));
  box-shadow:
    0 0 12px rgba(21, 201, 255, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 0 18px rgba(21, 201, 255, 0.1);
}

.profileCard__copyStat--two {
  border-color: rgba(43, 230, 255, 0.88);
  background:
    radial-gradient(circle at 17% 50%, rgba(45, 204, 255, 0.34), transparent 60%),
    linear-gradient(180deg, rgba(7, 32, 70, 0.98), rgba(0, 10, 30, 0.98));
}

.profileCard__copyStat--one {
  border-color: rgba(95, 189, 255, 0.58);
  background:
    radial-gradient(circle at 17% 50%, rgba(84, 169, 255, 0.24), transparent 60%),
    linear-gradient(180deg, rgba(5, 25, 55, 0.96), rgba(0, 9, 27, 0.98));
}

.profileCard__copyIcon {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  max-width: 44px;
  height: 28px;
  object-fit: contain;
  justify-self: center;
  transform: translateX(-1px) scale(2.55);
  transform-origin: center;
  pointer-events: none;
  opacity: 0.95;
  filter:
    drop-shadow(0 0 7px rgba(34, 213, 255, 0.72))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.48));
}

.profileCard__copyStat--one .profileCard__copyIcon {
  transform: translateX(-1px) scale(2.24);
}

.profileCard__copyDivider {
  position: relative;
  z-index: 1;
  width: 2px;
  height: 66%;
  justify-self: center;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(36, 230, 255, 0.96), transparent);
  box-shadow: 0 0 8px rgba(32, 219, 255, 0.82);
}

.profileCard__copyValue {
  position: relative;
  z-index: 1;
  min-width: 0;
  justify-self: end;
  color: #fff;
  font-size: 0.94rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  text-align: right;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

.cards-empty {
  min-height: 220px;
  border-radius: 16px;
  border: 1px dashed rgba(115, 192, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.deck-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.download-btn {
  appearance: none;
  border: 1px solid rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.22);
  color: #eef7ff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}

.download-btn:hover:not(:disabled) {
  background: rgba(18, 83, 143, 0.34);
  border-color: rgba(126, 200, 255, 0.42);
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 1380px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .hero-panel--decklist {
    min-height: 0;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .profileCard__stats {
    height: 50%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 7px;
  }

  .profileCard__rateDial {
    gap: 4px;
    padding-top: 4px;
  }

  .profileCard__rateDialLabel {
    font-size: 0.76rem;
  }

  .profileCard__rateDialValue {
    width: min(96px, calc(100% - 4px));
    font-size: 0.9rem;
  }

  .profileCard__copyBreakdown {
    grid-template-rows: repeat(2, clamp(36px, 28%, 46px));
    gap: 6px;
  }

  .profileCard__copyStat {
    grid-template-columns: minmax(16px, 0.68fr) 2px minmax(32px, 1.32fr);
    column-gap: 4px;
    padding: 3px 6px;
    border-radius: 11px;
  }

  .profileCard__copyIcon {
    max-width: 36px;
    height: 24px;
    transform: translateX(-1px) scale(2.36);
  }

  .profileCard__copyStat--one .profileCard__copyIcon {
    transform: translateX(-1px) scale(2.08);
  }

  .profileCard__copyValue {
    font-size: 0.82rem;
  }

  .deck-actions {
    justify-content: stretch;
  }

  .download-btn {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileCard__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
    padding: 6px;
  }

  .profileCard__rateDialValue {
    width: min(84px, calc(100% - 4px));
    font-size: 0.84rem;
  }

  .profileCard__copyBreakdown {
    grid-template-rows: repeat(2, clamp(34px, 28%, 42px));
    gap: 4px;
  }

  .profileCard__copyStat {
    grid-template-columns: minmax(15px, 0.62fr) 2px minmax(31px, 1.38fr);
    column-gap: 4px;
    padding: 3px 5px;
    border-width: 1px;
    border-radius: 10px;
  }

  .profileCard__copyIcon {
    max-width: 32px;
    height: 22px;
    transform: translateX(-1px) scale(2.22);
  }

  .profileCard__copyStat--one .profileCard__copyIcon {
    transform: translateX(-1px) scale(1.96);
  }

  .profileCard__copyDivider {
    height: 60%;
  }

  .profileCard__copyValue {
    font-size: 0.76rem;
  }
}

.profileFilters {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.profileFilterGroup {
  position: relative;
  min-width: 0;
  padding: 12px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.2), rgba(6, 12, 22, 0.2)),
    rgba(9, 22, 39, 0.96);
  border: 1px solid rgba(77, 154, 220, 0.26);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(86, 173, 255, 0.06);
}

.profileFilterGroup::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(126, 200, 255, 0.08);
  border-radius: 14px;
  pointer-events: none;
}

.profileFilterGroup__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  z-index: 1;
  margin-bottom: 10px;
}

.profileFilterGroup__head__content {
  flex: 1;
  min-width: 0;
}

.profileFilterGroup__head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.profileFilterGroup__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 900;
  color: #f6fbff;
}

.profileFilterGroup__sub {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.68);
  line-height: 1.4;
}

.profileFilterGrid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profileFilterGrid--sidebar {
  grid-template-columns: 1fr;
}

.profileFilterField {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
  padding: 10px;
  min-width: 0;
}

.profileFilterField label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.profileFilterField select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  height: 40px;
  outline: none;
}

.hint {
  margin-left: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
  font-weight: 600;
}

@media (max-width: 1280px) {
  .profileFilters {
    grid-template-columns: 300px minmax(0, 1fr);
  }
}

@media (max-width: 1080px) {
  .profileFilters {
    grid-template-columns: 1fr;
  }

  .profileFilterGrid {
    grid-template-columns: 1fr;
  }
}

/* ===== title block: back to early version feel ===== */

.deck-title-block--classic {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.deck-title-text--classic {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
  align-items: center;
  text-align: center;
}

/* 优化文字显示效果 */
.deck-title-block--classic {
  align-items: center;
  gap: 12px;
}

.deck-display-name--classic {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.1;
  font-weight: 900;
  color: #f8fbff;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.deck-english-name--classic {
  margin: 0;
  color: #9ed6ff;
  font-size: 0.8rem;
  opacity: 0.9;
  white-space: nowrap;
}

.deck-context-line {
  margin: 0;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  opacity: 0.8;
}

.deck-title-media {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0;
}



.sprite-stack--title {
  min-width: 0;
  justify-content: flex-end;
}

.sprite-chip--title {
  width: 46px;
  height: 46px;
}

.tier-badge {
  position: relative;
  overflow: hidden;
  min-width: 74px;
  height: 60px;
  padding: 6px 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid rgba(126, 200, 255, 0.3);
  background: linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.tier-badge::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 48%);
}

.tier-badge__label {
  position: relative;
  z-index: 1;
  font-size: 0.56rem;
  letter-spacing: 0.18em;
  color: rgba(245, 249, 255, 0.78);
}

.tier-badge__value {
  position: relative;
  z-index: 1;
  font-size: 2.6rem;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.tier-badge--sss,
.tier-badge--ss,
.tier-badge--s {
  background: linear-gradient(180deg, rgba(178, 97, 56, 0.96) 0%, rgba(103, 49, 22, 0.98) 100%);
  border-color: rgba(226, 164, 98, 0.54);
}

.tier-badge--a {
  background: linear-gradient(180deg, rgba(156, 110, 53, 0.95) 0%, rgba(89, 61, 23, 0.98) 100%);
  border-color: rgba(203, 154, 92, 0.46);
}

.tier-badge--b {
  background: linear-gradient(180deg, rgba(145, 128, 55, 0.95) 0%, rgba(84, 73, 24, 0.98) 100%);
  border-color: rgba(188, 169, 86, 0.42);
}

.tier-badge--c {
  background: linear-gradient(180deg, rgba(97, 146, 82, 0.94) 0%, rgba(55, 92, 46, 0.98) 100%);
  border-color: rgba(132, 181, 118, 0.4);
}

.tier-badge--d {
  background: linear-gradient(180deg, rgba(84, 110, 144, 0.94) 0%, rgba(46, 61, 86, 0.98) 100%);
  border-color: rgba(118, 145, 184, 0.42);
}

.tier-badge--e {
  background: linear-gradient(180deg, rgba(105, 92, 140, 0.94) 0%, rgba(59, 49, 84, 0.98) 100%);
  border-color: rgba(145, 128, 190, 0.36);
}

.tier-badge--f {
  background: linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%);
  border-color: rgba(122, 132, 146, 0.3);
}

.tier-badge--sss .tier-badge__value,
.tier-badge--ss .tier-badge__value,
.tier-badge--s .tier-badge__value {
  color: #fff4d8;
}

.tier-badge--a .tier-badge__value {
  color: #fff0d3;
}

.tier-badge--b .tier-badge__value {
  color: #fff6cf;
}

.tier-badge--c .tier-badge__value {
  color: #ecffe8;
}

.tier-badge--d .tier-badge__value {
  color: #e9f1ff;
}

/* ===== semi gauge center value ===== */

.metric-card {
  padding: 8px 10px 6px;
}

.semi-gauge {
  position: relative;
  height: 92px;
}

.semi-gauge__svg {
  width: 100%;
  height: 74px;
  display: block;
}

.semi-gauge__label {
  position: absolute;
  left: 50%;
  top: 46px;
  transform: translate(-50%, -50%);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.semi-gauge__label strong {
  font-size: 1.2rem;
  line-height: 1;
  color: #ffffff;
}

.semi-gauge__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  margin-top: 0;
  text-align: center;
  color: var(--text-soft);
  font-size: 1rem;
}

@media (max-width: 720px) {
  .deck-display-name--classic {
    font-size: 1.7rem;
  }

  .deck-english-name--classic {
    font-size: 0.9rem;
  }

  .deck-context-line {
    font-size: 0.78rem;
  }

  .sprite-chip--title {
    width: 40px;
    height: 40px;
  }

  .tier-badge {
      min-width: 66px;
      height: 54px;
      padding: 5px 10px;
    }

    .tier-badge__value {
      font-size: 1.2rem;
    }

    .tier-badge__label {
      font-size: 0.52rem;
    }

  .semi-gauge__label {
    top: 46px;
  }
}

.profileFilters {
  grid-template-columns: minmax(440px, 0.9fr) minmax(560px, 1.1fr);
  gap: 16px;
}

.profileFilterGroup {
  padding: 16px 18px;
}

.profileFilterGrid--left {
  grid-template-columns: repeat(2, minmax(180px, 240px));
  justify-content: start;
}

.profileFilterGrid--right {
  grid-template-columns: minmax(140px, 0.9fr) minmax(140px, 0.9fr) minmax(180px, 1.2fr);
  justify-content: start;
}

.profileFilterField--toggle {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.view-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.35);
  align-items: center;
}

.view-toggle__option {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  padding: 6px 8px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  height: 30px;
  min-width: 0;
  white-space: nowrap;
  word-break: normal;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.view-toggle__option--active {
  color: #eef7ff;
  border-color: rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.28);
}

.decklist-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.decklist-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.decklist-head__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
  text-align: left;
}

.decklist-head__copy .panel-title {
  text-align: left;
}

.decklist-head__copy .decklist-head__sub {
  text-align: left;
}

.decklist-head__sub {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.45;
}

.decklist-groups {
  display: grid;
  gap: 18px;
}

.decklist-shell--rates {
  gap: 18px;
}

.decklist-shell--rates .decklist-groups {
  align-items: stretch;
  gap: 26px;
}

.cardsGrid--rates {
  gap: 14px;
}

.decklist-shell--rates .profileCard__imageWrap {
  border-radius: 12px;
}

.decklist-shell--rates .decklist-group {
  gap: 12px;
}

.decklist-shell--rates .decklist-group + .decklist-group {
  margin-top: 0;
}

.decklist-group {
  display: grid;
  gap: 10px;
}

.decklist-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.decklist-group__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text);
}

.decklist-group__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(126, 200, 255, 0.24);
  background: rgba(7, 19, 31, 0.6);
  color: var(--text-soft);
  font-size: 0.78rem;
}

.sample-deck-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -4px 0 16px;
}

.sample-deck-meta__item {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(11, 27, 47, 0.84);
  color: #eef7ff;
  font-size: 0.82rem;
}

.matchup-record {
  font-size: 0.78rem;
  color: var(--text-soft);
  white-space: nowrap;
}

.profileCard__rate.profileCard__rate--count {
  container-type: inline-size;
  bottom: 4%;
  width: min(78%, 172px);
  height: 33%;
  min-width: 0;
  min-height: 44px;
  max-height: 76px;
  padding: 5px 12px;
  display: grid;
  grid-template-columns: minmax(34px, 0.95fr) 2px minmax(42px, 0.95fr);
  align-items: center;
  column-gap: 10px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 22% 48%, rgba(39, 185, 255, 0.34), transparent 60%),
    linear-gradient(180deg, rgba(6, 25, 57, 0.99), rgba(0, 8, 28, 0.99));
  border: 3px solid rgba(45, 233, 255, 0.94);
  color: #fff;
  font-size: 1rem;
  letter-spacing: 0;
  box-shadow:
    0 0 22px rgba(21, 201, 255, 0.46),
    0 14px 22px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 0 22px rgba(21, 201, 255, 0.12);
  overflow: hidden;
}

.profileCard__rateIcon {
  width: 100%;
  max-width: 66px;
  height: 82%;
  object-fit: contain;
  justify-self: center;
  transform: translateX(-2px) scale(2.34);
  transform-origin: center;
  pointer-events: none;
  filter:
    drop-shadow(0 0 9px rgba(34, 213, 255, 0.9))
    drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
}

.profileCard__rateDivider {
  width: 2px;
  height: 74%;
  justify-self: center;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(37, 231, 255, 1), transparent);
  box-shadow: 0 0 10px rgba(34, 213, 255, 0.96);
}

.profileCard__rateText {
  justify-self: end;
  font-family: var(--font-num);
  font-size: 2.8rem;
  font-size: clamp(1.55rem, 42cqw, 3.15rem);
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  text-transform: lowercase;
  text-shadow:
    0 0 8px rgba(125, 224, 255, 0.28),
    0 3px 6px rgba(0, 0, 0, 0.48);
}

.cards-empty__copy {
  display: block;
  margin-bottom: 8px;
}

@media (max-width: 1280px) {
  .profileFilterGrid--right {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileFilterField--toggle {
    grid-column: span 2;
  }
}

@media (max-width: 1080px) {
  .profileFilters {
    grid-template-columns: 1fr;
  }

  .profileFilterGrid--left,
  .profileFilterGrid--right {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .profileFilterGrid--left,
  .profileFilterGrid--right {
    grid-template-columns: 1fr;
  }

  .profileFilterField--toggle {
    grid-column: auto;
  }

  .decklist-head {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .sample-deck-meta {
    margin-bottom: 12px;
  }

  .decklist-shell {
    padding: 14px;
    gap: 14px;
  }

  .hero-panel--decklist,
  .decklist-viewport,
  .decklist-viewport--scrollable {
    overflow: visible;
    max-height: none !important;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px;
  }

  .profileCard__rate {
    min-height: 32px;
    min-width: 58px;
    padding: 0 10px;
    bottom: 8px;
    font-size: 0.82rem;
  }
}

.export-stage {
  position: fixed;
  left: -12000px;
  top: 0;
  z-index: -1;
  display: grid;
  gap: 24px;
  width: 1600px;
  pointer-events: none;
}

.export-panel {
  position: relative;
  overflow: hidden;
  width: 1500px;
  padding: 28px;
  border-radius: 20px;
  border: 1px solid rgba(77, 154, 220, 0.26);
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.2), rgba(6, 12, 22, 0.2)),
    rgba(9, 22, 39, 0.96);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(86, 173, 255, 0.06);
}

.export-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-kicker--visible {
  display: block;
  margin-bottom: 6px;
}

.export-panel__head h3 {
  margin: 0;
  color: #f6fbff;
  font-size: 1.55rem;
  font-weight: 950;
}

.export-panel__head p {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-weight: 800;
}

.export-tier-panel {
  width: 860px;
}

.export-tier-lanes {
  display: grid;
  gap: 14px;
}

.export-tier-lane {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.export-tier-lane__badge {
  display: grid;
  place-items: center;
  min-height: 118px;
  border-radius: 18px;
  color: #fff;
  font-size: 3rem;
  font-weight: 950;
  background: linear-gradient(180deg, rgba(239, 74, 56, 0.96), rgba(124, 74, 18, 0.96));
}

.export-tier-lane__decks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.export-tier-deck {
  min-height: 96px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(126, 200, 255, 0.14);
  background: rgba(3, 11, 22, 0.52);
}

.export-tier-deck__name {
  color: #eef7ff;
  font-weight: 900;
  line-height: 1.2;
}

.sprite-stack--export {
  min-width: 0;
  justify-content: center;
}

.sprite-chip--export {
  width: 42px;
  height: 42px;
}

.export-card-groups {
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 28px;
}

.decklist-shell--sample .cardsGrid--profile {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.export-sample-panel {
  width: 1180px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.export-sample-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px;
}

@media (max-width: 1080px) {
  .export-card-groups {
    grid-template-columns: 1fr;
  }
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 20px;
  padding-top: 24px;
  padding-bottom: 20px;
  border-top: 1px solid rgba(115, 192, 255, 0.2);
  background: linear-gradient(180deg, rgba(126, 200, 255, 0.02), rgba(126, 200, 255, 0));
}

.pagination-btn {
  appearance: none;
  border: 1px solid rgba(115, 192, 255, 0.3);
  border-radius: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(44, 130, 201, 0.6), rgba(17, 60, 122, 0.9));
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.pagination-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(54, 140, 211, 0.7), rgba(27, 70, 132, 1));
  border-color: rgba(115, 192, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.pagination-btn:hover:not(:disabled)::before {
  left: 100%;
}

.pagination-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(44, 130, 201, 0.2);
  border-color: rgba(115, 192, 255, 0.15);
  box-shadow: none;
}

.pagination-info {
  color: #d7ebff;
  font-weight: 700;
  font-size: 1rem;
  min-width: 140px;
  text-align: center;
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(11, 27, 47, 0.8);
  border: 1px solid rgba(115, 192, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 720px) {
  .pagination {
    flex-wrap: wrap;
    gap: 10px;
    padding-top: 20px;
    margin-top: 20px;
  }
  
  .pagination-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
  }
  
  .pagination-info {
    min-width: 120px;
    padding: 8px 14px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .pagination {
    gap: 8px;
  }
  
  .pagination-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  
  .pagination-info {
    min-width: 100px;
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}

</style>
