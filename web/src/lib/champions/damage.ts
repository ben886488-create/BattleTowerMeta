export type DamageActorInput = {
  pokemon: string;
  level: number;
  type: string;
  teraType: string;
  nature: string;
  ability: string;
  item: string;
  evs: string;
  ivs: string;
  boosts: string;
  status: string;
};

export type DamageFieldInput = {
  format: "singles" | "doubles";
  weather: string;
  terrain: string;
  screens: string[];
  hazards: string[];
  modifiers: string[];
};

export type DamageInput = {
  attacker: DamageActorInput;
  defender: DamageActorInput & { currentHp: number };
  move: string;
  field: DamageFieldInput;
};

export type DamageResult = {
  damageRange: string;
  percentageRange: string;
  koChance: string;
  rolls: string[];
  unsupportedModifiers: string[];
  engineStatus: "skeleton";
};

export function calculateDamage(input: DamageInput): DamageResult {
  return {
    damageRange: "—",
    percentageRange: "—",
    koChance: "—",
    rolls: [],
    unsupportedModifiers: [
      ...input.field.screens,
      ...input.field.hazards,
      ...input.field.modifiers,
      input.attacker.ability,
      input.defender.ability,
      input.attacker.item,
      input.defender.item,
    ].filter((value) => value.trim() && value !== "none"),
    engineStatus: "skeleton",
  };
}
