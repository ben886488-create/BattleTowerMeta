<template>
  <section class="champions-page">
    <ChampionsHero title-key="champions.damage.title" subtitle-key="champions.damage.subtitle" variant="compact" />

    <div class="champions-stack">
      <div class="champions-calculator">
        <ChampionsPanel title-key="champions.sections.attackPokemon">
          <ActorForm
            :actor="attacker"
            side="attack"
            :labels="actorLabels"
          />
          <div class="champions-form-grid">
            <div v-for="index in moveSlots" :key="index" class="champions-field">
              <label :for="`champions-attack-move-${index}`">{{ movePlaceholder(index) }}</label>
              <input
                :id="`champions-attack-move-${index}`"
                :value="attackMoves[index] ?? ''"
                type="text"
                :placeholder="movePlaceholder(index)"
                @input="setAttackMove(index, $event)"
              />
            </div>
          </div>
        </ChampionsPanel>

        <ChampionsPanel title-key="champions.sections.fieldConditions">
          <div class="champions-form-grid">
            <div class="champions-field">
              <label for="champions-damage-format">{{ t("champions.filters.format") }}</label>
              <select id="champions-damage-format" v-model="field.format">
                <option value="singles">{{ t("champions.options.singles") }}</option>
                <option value="doubles">{{ t("champions.options.doubles") }}</option>
              </select>
            </div>

            <div class="champions-field">
              <label for="champions-damage-weather">{{ t("champions.filters.weather") }}</label>
              <select id="champions-damage-weather" v-model="field.weather">
                <option value="none">{{ t("champions.options.none") }}</option>
                <option value="sun">{{ t("champions.options.sun") }}</option>
                <option value="rain">{{ t("champions.options.rain") }}</option>
                <option value="sand">{{ t("champions.options.sand") }}</option>
                <option value="snow">{{ t("champions.options.snow") }}</option>
              </select>
            </div>

            <div class="champions-field">
              <label for="champions-damage-terrain">{{ t("champions.filters.terrain") }}</label>
              <select id="champions-damage-terrain" v-model="field.terrain">
                <option value="none">{{ t("champions.options.none") }}</option>
                <option value="electric">{{ t("champions.options.electric") }}</option>
                <option value="grassy">{{ t("champions.options.grassy") }}</option>
                <option value="misty">{{ t("champions.options.misty") }}</option>
                <option value="psychic">{{ t("champions.options.psychic") }}</option>
              </select>
            </div>
          </div>

          <div class="champions-checks">
            <label v-for="screen in screenOptions" :key="screen.value" class="champions-check">
              <input v-model="field.screens" type="checkbox" :value="screen.value" />
              {{ t(screen.labelKey) }}
            </label>
            <label v-for="hazard in hazardOptions" :key="hazard.value" class="champions-check">
              <input v-model="field.hazards" type="checkbox" :value="hazard.value" />
              {{ t(hazard.labelKey) }}
            </label>
            <label v-for="modifier in disabledModifiers" :key="modifier" class="champions-check">
              <input type="checkbox" disabled />
              {{ modifier }}
            </label>
          </div>
        </ChampionsPanel>

        <ChampionsPanel title-key="champions.sections.defensePokemon">
          <ActorForm
            :actor="defender"
            side="defense"
            :labels="actorLabels"
          />
        </ChampionsPanel>
      </div>

      <ChampionsPanel title-key="champions.sections.damageResult">
        <div class="champions-kv-grid">
          <div class="champions-kv">
            <span>{{ t("champions.labels.damageRange") }}</span>
            <strong>{{ damageResult.damageRange }}</strong>
          </div>
          <div class="champions-kv">
            <span>{{ t("champions.labels.percentageRange") }}</span>
            <strong>{{ damageResult.percentageRange }}</strong>
          </div>
          <div class="champions-kv">
            <span>{{ t("champions.labels.koChance") }}</span>
            <strong>{{ damageResult.koChance }}</strong>
          </div>
          <div class="champions-kv">
            <span>{{ t("champions.labels.engineStatus") }}</span>
            <strong>{{ t("champions.status.engineSkeleton") }}</strong>
          </div>
        </div>
        <div class="champions-actions">
          <button class="champions-button champions-button--primary" type="button" disabled>
            {{ t("champions.actions.exportCalculation") }}
          </button>
        </div>
      </ChampionsPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive } from "vue";
import { useRoute } from "vue-router";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsPanel from "../../components/champions/ChampionsPanel.vue";
import { calculateDamage, type DamageActorInput } from "../../lib/champions/damage";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { routeLang } from "../../lib/siteI18n";

type ActorSide = "attack" | "defense";
type ActorLabels = {
  pokemon: string;
  level: string;
  type: string;
  teraType: string;
  nature: string;
  ability: string;
  item: string;
  evs: string;
  ivs: string;
  boosts: string;
  currentHp: string;
  status: string;
};

const route = useRoute();
const lang = computed(() => routeLang(route));
const attacker = reactive<DamageActorInput>({
  pokemon: "",
  level: 50,
  type: "",
  teraType: "",
  nature: "",
  ability: "none",
  item: "none",
  evs: "",
  ivs: "",
  boosts: "",
  status: "",
});
const defender = reactive<DamageActorInput & { currentHp: number }>({
  pokemon: "",
  level: 50,
  type: "",
  teraType: "",
  nature: "",
  ability: "none",
  item: "none",
  evs: "",
  ivs: "",
  boosts: "",
  status: "",
  currentHp: 100,
});
const field = reactive({
  format: "singles" as "singles" | "doubles",
  weather: "none",
  terrain: "none",
  screens: [] as string[],
  hazards: [] as string[],
  modifiers: [] as string[],
});
const attackMoves = reactive(["", "", "", ""]);
const moveSlots = [0, 1, 2, 3] as const;
const screenOptions = [
  { value: "reflect", labelKey: "champions.options.reflect" },
  { value: "lightScreen", labelKey: "champions.options.lightScreen" },
  { value: "auroraVeil", labelKey: "champions.options.auroraVeil" },
] as const satisfies readonly { value: string; labelKey: ChampionsTranslationKey }[];
const hazardOptions = [
  { value: "stealthRock", labelKey: "champions.options.stealthRock" },
  { value: "spikes", labelKey: "champions.options.spikes" },
] as const satisfies readonly { value: string; labelKey: ChampionsTranslationKey }[];
const disabledModifiers = ["Helping Hand", "Friend Guard", "Power Spot"];

const actorLabels = computed<ActorLabels>(() => ({
  pokemon: t("champions.labels.pokemon"),
  level: t("champions.filters.level"),
  type: t("champions.filters.type"),
  teraType: t("champions.filters.teraType"),
  nature: t("champions.filters.nature"),
  ability: t("champions.filters.ability"),
  item: t("champions.filters.item"),
  evs: t("champions.filters.ev"),
  ivs: t("champions.filters.iv"),
  boosts: t("champions.filters.statStage"),
  currentHp: t("champions.filters.currentHp"),
  status: t("champions.filters.status"),
}));
const movePlaceholders = computed(() =>
  Array.from({ length: 4 }, (_value, index) => `${t("champions.placeholders.move")} ${index + 1}`),
);
const damageResult = computed(() =>
  calculateDamage({
    attacker,
    defender,
    move: attackMoves[0] ?? "",
    field,
  }),
);

const ActorForm = defineComponent({
  name: "ChampionsDamageActorForm",
  props: {
    actor: {
      type: Object as () => DamageActorInput & { currentHp?: number },
      required: true,
    },
    side: {
      type: String as () => ActorSide,
      required: true,
    },
    labels: {
      type: Object as () => ActorLabels,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "champions-form-grid" }, [
        fieldNode(props.labels.pokemon, "pokemon", props.actor.pokemon, props.actor),
        fieldNode(props.labels.level, "level", String(props.actor.level), props.actor, "number"),
        fieldNode(props.labels.type, "type", props.actor.type, props.actor),
        fieldNode(props.labels.teraType, "teraType", props.actor.teraType, props.actor),
        fieldNode(props.labels.nature, "nature", props.actor.nature, props.actor),
        fieldNode(props.labels.ability, "ability", props.actor.ability, props.actor),
        fieldNode(props.labels.item, "item", props.actor.item, props.actor),
        fieldNode(props.labels.evs, "evs", props.actor.evs, props.actor),
        fieldNode(props.labels.ivs, "ivs", props.actor.ivs, props.actor),
        fieldNode(props.labels.boosts, "boosts", props.actor.boosts, props.actor),
        props.side === "defense"
          ? fieldNode(props.labels.currentHp, "currentHp", String(props.actor.currentHp ?? 100), props.actor, "number")
          : null,
        fieldNode(props.labels.status, "status", props.actor.status, props.actor),
      ]);
  },
});

function fieldNode(
  label: string,
  key: string,
  value: string,
  actor: DamageActorInput & { currentHp?: number },
  type = "text",
) {
  return h("div", { class: "champions-field" }, [
    h("label", label),
    h("input", {
      value,
      type,
      placeholder: label,
      onInput: (event: Event) => {
        const next = (event.target as HTMLInputElement).value;
        if (key === "level" || key === "currentHp") {
          Object.assign(actor, { [key]: Number(next) });
          return;
        }
        Object.assign(actor, { [key]: next });
      },
    }),
  ]);
}

function movePlaceholder(index: number) {
  return movePlaceholders.value[index] ?? t("champions.placeholders.move");
}

function setAttackMove(index: number, event: Event) {
  attackMoves[index] = (event.target as HTMLInputElement).value;
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
