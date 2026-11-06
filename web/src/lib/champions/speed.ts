export type SpeedNature = "neutral" | "plus" | "minus";
export type SpeedItem = "none" | "choiceScarf" | "ironBall";
export type SpeedWeather = "none" | "sun" | "rain" | "sand" | "snow";
export type SpeedAbility =
  | "none"
  | "chlorophyll"
  | "swiftSwim"
  | "sandRush"
  | "slushRush"
  | "unburden"
  | "surgeSurfer"
  | "quickFeet";

export type SpeedInput = {
  baseSpeed: number;
  level: 50 | 100;
  nature: SpeedNature;
  ev: number;
  iv: number;
  stage: number;
  item: SpeedItem;
  ability: SpeedAbility;
  weather: SpeedWeather;
  tailwind: boolean;
};

export type SpeedResult = {
  calculatedSpeed: number;
  originalEffectiveSpeed: number;
  effectiveSpeed: number;
  abilityActive: boolean;
  rulesAccuracy: "supported";
};

export type SpeedFieldItem = {
  slug: string;
  name: string;
  spriteUrl?: string;
  effectiveSpeed: number;
  order: number;
  accessibleLabel: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stageRatio(stage: number): [number, number] {
  const safeStage = clamp(Math.round(stage), -6, 6);
  return safeStage >= 0 ? [2 + safeStage, 2] : [2, 2 - safeStage];
}

function applyRatio(value: number, numerator: number, denominator: number) {
  return Math.max(1, Math.floor((value * numerator) / denominator));
}

/**
 * Champions stores 0–32 Stat Points. At level 50 these correspond to the
 * familiar 0–252 EV breakpoints: the first point costs 4 EV and every later
 * visible stat point costs another 8 EV.
 */
export function statPointsToEv(statPoints: number) {
  const points = clamp(Math.round(statPoints), 0, 32);
  return points === 0 ? 0 : Math.min(252, 4 + (points - 1) * 8);
}

export function abilityIsActive(ability: SpeedAbility, weather: SpeedWeather) {
  if (ability === "chlorophyll") return weather === "sun";
  if (ability === "swiftSwim") return weather === "rain";
  if (ability === "sandRush") return weather === "sand";
  if (ability === "slushRush") return weather === "snow";
  return ability !== "none";
}

export function calculateEffectiveSpeed(input: SpeedInput): SpeedResult {
  const baseSpeed = clamp(Math.round(input.baseSpeed), 1, 255);
  const ev = clamp(Math.round(input.ev), 0, 252);
  const iv = clamp(Math.round(input.iv), 0, 31);
  const level = input.level === 100 ? 100 : 50;
  const natureNumerator = input.nature === "plus" ? 110 : input.nature === "minus" ? 90 : 100;

  const beforeNature = Math.floor(((2 * baseSpeed + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const calculatedSpeed = Math.floor((beforeNature * natureNumerator) / 100);
  const [stageNumerator, stageDenominator] = stageRatio(input.stage);
  let effectiveSpeed = applyRatio(calculatedSpeed, stageNumerator, stageDenominator);

  if (input.item === "choiceScarf") effectiveSpeed = applyRatio(effectiveSpeed, 3, 2);
  if (input.item === "ironBall") effectiveSpeed = applyRatio(effectiveSpeed, 1, 2);

  const abilityActive = abilityIsActive(input.ability, input.weather);
  if (abilityActive) {
    effectiveSpeed = input.ability === "quickFeet"
      ? applyRatio(effectiveSpeed, 3, 2)
      : applyRatio(effectiveSpeed, 2, 1);
  }
  if (input.tailwind) effectiveSpeed = applyRatio(effectiveSpeed, 2, 1);

  return {
    calculatedSpeed,
    originalEffectiveSpeed: calculatedSpeed,
    effectiveSpeed,
    abilityActive,
    rulesAccuracy: "supported",
  };
}
