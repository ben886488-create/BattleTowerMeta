import assert from "node:assert/strict";
import test from "node:test";
import { abilityIsActive, calculateEffectiveSpeed, statPointsToEv, type SpeedInput } from "./speed";

const baseInput: SpeedInput = {
  baseSpeed: 100,
  level: 50,
  nature: "neutral",
  ev: 0,
  iv: 31,
  stage: 0,
  item: "none",
  ability: "none",
  weather: "none",
  tailwind: false,
};

test("Champions Stat Points map to EV breakpoints", () => {
  assert.equal(statPointsToEv(0), 0);
  assert.equal(statPointsToEv(1), 4);
  assert.equal(statPointsToEv(32), 252);
});

test("level 50 Garchomp with 252 Speed EVs and Jolly reaches 169", () => {
  const result = calculateEffectiveSpeed({ ...baseInput, baseSpeed: 102, nature: "plus", ev: 252 });
  assert.equal(result.calculatedSpeed, 169);
  assert.equal(result.effectiveSpeed, 169);
});

test("stage, Choice Scarf, Swift Swim, and Tailwind apply in order", () => {
  const result = calculateEffectiveSpeed({
    ...baseInput,
    baseSpeed: 80,
    stage: 1,
    item: "choiceScarf",
    ability: "swiftSwim",
    weather: "rain",
    tailwind: true,
  });
  assert.equal(result.calculatedSpeed, 100);
  assert.equal(result.effectiveSpeed, 900);
  assert.equal(result.abilityActive, true);
});

test("weather-gated abilities do not activate in the wrong weather", () => {
  assert.equal(abilityIsActive("chlorophyll", "rain"), false);
  const result = calculateEffectiveSpeed({ ...baseInput, ability: "chlorophyll", weather: "rain" });
  assert.equal(result.effectiveSpeed, 120);
});

test("Iron Ball and a negative stage floor after each modifier", () => {
  const result = calculateEffectiveSpeed({ ...baseInput, stage: -1, item: "ironBall" });
  assert.equal(result.calculatedSpeed, 120);
  assert.equal(result.effectiveSpeed, 40);
});

test("level 100 and Quick Feet are supported", () => {
  const result = calculateEffectiveSpeed({
    ...baseInput,
    level: 100,
    ev: 252,
    ability: "quickFeet",
  });
  assert.equal(result.calculatedSpeed, 299);
  assert.equal(result.effectiveSpeed, 448);
});
