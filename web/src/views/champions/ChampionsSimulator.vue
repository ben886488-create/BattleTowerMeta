<template>
  <section class="champions-page">
    <ChampionsHero title-key="champions.simulator.title" subtitle-key="champions.simulator.subtitle" variant="compact" />

    <div class="champions-stack champions-simulator">
      <ChampionsPanel title-key="champions.sections.teamSetup">
        <div class="champions-grid">
          <div>
            <p class="champions-eyebrow mono">{{ t("champions.sections.myTeam") }}</p>
            <div class="champions-team-slots">
              <div v-for="slot in myTeam" :key="slot.id" class="champions-field">
                <label>{{ t("champions.labels.teamSlot") }} {{ slot.id }}</label>
                <input v-model="slot.pokemon" type="text" :placeholder="t('champions.placeholders.selectPokemon')" />
                <input v-model="slot.move" type="text" :placeholder="t('champions.placeholders.move')" />
                <input v-model="slot.item" type="text" :placeholder="t('champions.placeholders.item')" />
                <input v-model="slot.ability" type="text" :placeholder="t('champions.placeholders.ability')" />
              </div>
            </div>
          </div>

          <div>
            <p class="champions-eyebrow mono">{{ t("champions.sections.opponentTeam") }}</p>
            <div class="champions-team-slots">
              <div v-for="slot in opponentTeam" :key="slot.id" class="champions-field">
                <label>{{ t("champions.labels.teamSlot") }} {{ slot.id }}</label>
                <input v-model="slot.pokemon" type="text" :placeholder="t('champions.placeholders.selectPokemon')" />
                <input v-model="slot.move" type="text" :placeholder="t('champions.placeholders.move')" />
                <input v-model="slot.item" type="text" :placeholder="t('champions.placeholders.item')" />
                <input v-model="slot.ability" type="text" :placeholder="t('champions.placeholders.ability')" />
              </div>
            </div>
          </div>
        </div>
      </ChampionsPanel>

      <ChampionsPanel title-key="champions.sections.battleLog">
        <div class="champions-form-grid">
          <div class="champions-field">
            <label for="champions-turn-number">{{ t("champions.labels.turn") }}</label>
            <input id="champions-turn-number" v-model.number="draft.turnNumber" type="number" min="1" />
          </div>
          <div class="champions-field">
            <label for="champions-my-active">{{ t("champions.labels.myActive") }}</label>
            <input id="champions-my-active" v-model="draft.myActive" type="text" />
          </div>
          <div class="champions-field">
            <label for="champions-op-active">{{ t("champions.labels.opponentActive") }}</label>
            <input id="champions-op-active" v-model="draft.opponentActive" type="text" />
          </div>
          <div class="champions-field">
            <label for="champions-move-order">{{ t("champions.labels.moveOrder") }}</label>
            <input id="champions-move-order" v-model="draft.moveOrder" type="text" />
          </div>
          <div class="champions-field">
            <label for="champions-my-action">{{ t("champions.labels.myAction") }}</label>
            <input id="champions-my-action" v-model="draft.myAction" type="text" />
          </div>
          <div class="champions-field">
            <label for="champions-op-action">{{ t("champions.labels.opponentAction") }}</label>
            <input id="champions-op-action" v-model="draft.opponentAction" type="text" />
          </div>
          <div class="champions-field">
            <label for="champions-result-note">{{ t("champions.labels.resultNote") }}</label>
            <textarea
              id="champions-result-note"
              v-model="draft.resultNote"
              :placeholder="t('champions.placeholders.note')"
            ></textarea>
          </div>
        </div>

        <div class="champions-actions">
          <button class="champions-button champions-button--primary" type="button" @click="addTurn">
            {{ t("champions.actions.addTurn") }}
          </button>
          <button class="champions-button" type="button" :disabled="turns.length === 0" @click="clearLog">
            {{ t("champions.actions.clearLog") }}
          </button>
          <button class="champions-button" type="button" :disabled="!exportText" @click="copyText">
            {{ copyStatus || t("champions.actions.copyText") }}
          </button>
          <button class="champions-button" type="button" :disabled="!exportText" @click="downloadText">
            {{ t("champions.actions.downloadText") }}
          </button>
        </div>

        <article v-for="turn in turns" :key="turn.id" class="champions-turn-card">
          <div class="champions-titleline">
            <strong>{{ t("champions.labels.turn") }} {{ turn.turnNumber }}</strong>
            <span>{{ turn.moveOrder || t("champions.placeholders.notSyncedValue") }}</span>
          </div>
          <div class="champions-kv-grid">
            <div class="champions-kv">
              <span>{{ t("champions.labels.myAction") }}</span>
              <strong>{{ turn.myAction || t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.opponentAction") }}</span>
              <strong>{{ turn.opponentAction || t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.resultNote") }}</span>
              <strong>{{ turn.resultNote || t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
          </div>
          <div class="champions-actions">
            <button class="champions-button" type="button" @click="duplicateTurn(turn.id)">
              {{ t("champions.actions.duplicateTurn") }}
            </button>
            <button class="champions-button" type="button" @click="removeTurn(turn.id)">
              {{ t("champions.actions.removeTurn") }}
            </button>
          </div>
        </article>

        <pre class="champions-export">{{ exportText || t("champions.empty.noResults") }}</pre>
      </ChampionsPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsPanel from "../../components/champions/ChampionsPanel.vue";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { routeLang } from "../../lib/siteI18n";

type TeamSlot = {
  id: number;
  pokemon: string;
  move: string;
  item: string;
  ability: string;
};

type BattleTurn = {
  id: number;
  turnNumber: number;
  myActive: string;
  opponentActive: string;
  myAction: string;
  opponentAction: string;
  moveOrder: string;
  resultNote: string;
};

const route = useRoute();
const lang = computed(() => routeLang(route));
const myTeam = reactive<TeamSlot[]>(createTeamSlots());
const opponentTeam = reactive<TeamSlot[]>(createTeamSlots());
const turns = ref<BattleTurn[]>([]);
const copyStatus = ref("");
const draft = reactive<BattleTurn>({
  id: 0,
  turnNumber: 1,
  myActive: "",
  opponentActive: "",
  myAction: "",
  opponentAction: "",
  moveOrder: "",
  resultNote: "",
});

const exportText = computed(() =>
  turns.value
    .map((turn) =>
      [
        `${t("champions.labels.turn")} ${turn.turnNumber}`,
        `${t("champions.labels.myActive")}: ${turn.myActive}`,
        `${t("champions.labels.opponentActive")}: ${turn.opponentActive}`,
        `${t("champions.labels.myAction")}: ${turn.myAction}`,
        `${t("champions.labels.opponentAction")}: ${turn.opponentAction}`,
        `${t("champions.labels.moveOrder")}: ${turn.moveOrder}`,
        `${t("champions.labels.resultNote")}: ${turn.resultNote}`,
      ]
        .filter((line) => !line.endsWith(": "))
        .join("\n"),
    )
    .join("\n\n"),
);

function createTeamSlots(): TeamSlot[] {
  return Array.from({ length: 6 }, (_value, index) => ({
    id: index + 1,
    pokemon: "",
    move: "",
    item: "",
    ability: "",
  }));
}

function addTurn() {
  turns.value.push({
    ...draft,
    id: Date.now(),
  });
  draft.turnNumber += 1;
  draft.myAction = "";
  draft.opponentAction = "";
  draft.moveOrder = "";
  draft.resultNote = "";
}

function removeTurn(id: number) {
  turns.value = turns.value.filter((turn) => turn.id !== id);
}

function duplicateTurn(id: number) {
  const turn = turns.value.find((item) => item.id === id);
  if (!turn) return;
  turns.value.push({
    ...turn,
    id: Date.now(),
    turnNumber: turn.turnNumber + 1,
  });
}

function clearLog() {
  turns.value = [];
  draft.turnNumber = 1;
}

async function copyText() {
  copyStatus.value = "";
  if (!navigator?.clipboard || !exportText.value) {
    copyStatus.value = t("champions.status.clipboardUnavailable");
    return;
  }
  await navigator.clipboard.writeText(exportText.value);
  copyStatus.value = t("champions.status.clipboardCopied");
  window.setTimeout(() => {
    copyStatus.value = "";
  }, 1600);
}

function downloadText() {
  if (!exportText.value) return;
  const blob = new Blob([exportText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "champions-battle-log.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
