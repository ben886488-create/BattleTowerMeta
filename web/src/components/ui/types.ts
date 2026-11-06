export const uiDensities = ["comfortable", "standard", "compact"] as const;

export type UiDensity = (typeof uiDensities)[number];
export type UiControlValue = string | number | null | undefined;
export type UiSegmentValue = string | number;

export type SegmentedOption = {
  value: UiSegmentValue;
  label: string;
  disabled?: boolean;
};
