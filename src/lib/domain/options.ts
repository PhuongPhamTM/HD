import { CHANNELS, CHECK_NAMES, PHASES, PUB_STATES, STAGES } from "./constants";
import type { ContentStatus, PublicationStatus } from "./types";

/**
 * Option lists that the team manages in the "Options" tab of the Google Sheet.
 * `constants.ts` holds the built-in defaults used when the Sheet has no rows for a group.
 *
 * Stage and publication-status keys are part of the code (status checks such as
 * `status === "posted"`), so the Sheet can only relabel, reorder or deactivate them.
 * Phases, channels and checks are free to add or remove.
 */
export interface OptionItem<Key extends string = string> {
  key: Key;
  label: string;
  /** Inactive options are hidden from pickers but still label existing records. */
  active: boolean;
}
export interface PhaseOption extends OptionItem {
  statuses: ContentStatus[];
}
export interface HubOptions {
  stages: OptionItem<ContentStatus>[];
  publicationStatuses: OptionItem<PublicationStatus>[];
  phases: PhaseOption[];
  channels: OptionItem[];
  checks: OptionItem[];
}
export type OptionGroup = "stage" | "publication_status" | "phase" | "channel" | "check";
export const OPTION_GROUPS: OptionGroup[] = [
  "stage",
  "publication_status",
  "phase",
  "channel",
  "check",
];
/** One row of the Sheet's Options tab. */
export interface OptionRow {
  group: string;
  key: string;
  label: string;
  order: string;
  active: string;
  /** Phase rows only: comma-separated stage keys. */
  stages: string;
}

export const toOptionKey = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Check keys in the order the old `checks: boolean[]` used, for migrating legacy data. */
export const LEGACY_CHECK_KEYS = CHECK_NAMES.map(toOptionKey);

export const DEFAULT_OPTIONS: HubOptions = {
  stages: STAGES.map((stage) => ({ ...stage, active: true })),
  publicationStatuses: PUB_STATES.map((status) => ({ ...status, active: true })),
  phases: PHASES.map((phase) => ({ ...phase, active: true })),
  // Publications store the channel name itself, so a channel's key is its label.
  channels: CHANNELS.map((channel) => ({ key: channel, label: channel, active: true })),
  checks: CHECK_NAMES.map((check) => ({ key: toOptionKey(check), label: check, active: true })),
};

const isActiveCell = (value: string) =>
  !["false", "no", "0", "n"].includes(value.trim().toLowerCase());
const splitList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Turns Options-tab rows into option lists, falling back to defaults per group. */
export function buildOptions(rows: OptionRow[]): HubOptions {
  const rowsByGroup = new Map<string, OptionRow[]>();
  for (const row of rows) {
    const group = row.group.trim().toLowerCase();
    if (!row.key.trim() && !row.label.trim()) continue;
    rowsByGroup.set(group, [...(rowsByGroup.get(group) ?? []), row]);
  }
  const ordered = (groupRows: OptionRow[]) =>
    groupRows
      .map((row, rowIndex) => ({ row, rowIndex, order: Number.parseFloat(row.order) }))
      .sort(
        (left, right) =>
          (Number.isFinite(left.order) ? left.order : Infinity) -
            (Number.isFinite(right.order) ? right.order : Infinity) ||
          left.rowIndex - right.rowIndex,
      )
      .map(({ row }) => row);
  const toItem = (row: OptionRow): OptionItem => ({
    key: row.key.trim() || toOptionKey(row.label),
    label: row.label.trim() || row.key.trim(),
    active: isActiveCell(row.active),
  });

  /** Fixed-key groups: the Sheet may relabel, reorder or deactivate known keys only. */
  function fixedGroup<Key extends string>(group: OptionGroup, defaults: OptionItem<Key>[]) {
    const groupRows = rowsByGroup.get(group);
    if (!groupRows?.length) return defaults;
    const known = new Map(defaults.map((item) => [item.key as string, item]));
    const fromSheet = ordered(groupRows)
      .map(toItem)
      .filter((item) => known.has(item.key)) as OptionItem<Key>[];
    const listed = new Set(fromSheet.map((item) => item.key));
    // Keys missing from the Sheet stay available so existing records keep a label.
    return [...fromSheet, ...defaults.filter((item) => !listed.has(item.key))];
  }
  /** Free groups: the Sheet's rows are the list. */
  function freeGroup(group: OptionGroup, defaults: OptionItem[], keyIsLabel = false) {
    const groupRows = rowsByGroup.get(group);
    if (!groupRows?.length) return defaults;
    const seen = new Set<string>();
    return ordered(groupRows)
      .map(toItem)
      .map((item) => (keyIsLabel ? { ...item, key: item.label } : item))
      .filter((item) => item.key && !seen.has(item.key) && seen.add(item.key));
  }

  const stages = fixedGroup("stage", DEFAULT_OPTIONS.stages);
  const stageKeys = new Set<string>(stages.map((stage) => stage.key));
  const phaseRows = rowsByGroup.get("phase");
  const phases: PhaseOption[] = phaseRows?.length
    ? ordered(phaseRows)
        .map((row) => ({
          ...toItem(row),
          statuses: splitList(row.stages).filter((status) =>
            stageKeys.has(status),
          ) as ContentStatus[],
        }))
        // A phase is a board lane; it needs at least one stage to drop cards into.
        .filter((phase) => phase.key && phase.statuses.length)
    : DEFAULT_OPTIONS.phases;

  return {
    stages,
    publicationStatuses: fixedGroup("publication_status", DEFAULT_OPTIONS.publicationStatuses),
    phases: phases.length ? phases : DEFAULT_OPTIONS.phases,
    channels: freeGroup("channel", DEFAULT_OPTIONS.channels, true),
    checks: freeGroup("check", DEFAULT_OPTIONS.checks),
  };
}

/** Default rows written to a fresh Options tab. */
export function defaultOptionRows(): OptionRow[] {
  const toRows = (group: OptionGroup, items: (OptionItem & { statuses?: string[] })[]) =>
    items.map((item, itemIndex) => ({
      group,
      key: item.key,
      label: item.label,
      order: String(itemIndex + 1),
      active: "TRUE",
      stages: item.statuses?.join(",") ?? "",
    }));
  return [
    ...toRows("stage", DEFAULT_OPTIONS.stages),
    ...toRows("publication_status", DEFAULT_OPTIONS.publicationStatuses),
    ...toRows("phase", DEFAULT_OPTIONS.phases),
    ...toRows("channel", DEFAULT_OPTIONS.channels),
    ...toRows("check", DEFAULT_OPTIONS.checks),
  ];
}

export const activeOptions = <Item extends OptionItem>(items: Item[]) =>
  items.filter((item) => item.active);

/** Active options plus the current value, so a record using a retired option still shows it. */
export function selectableOptions<Item extends OptionItem>(items: Item[], currentKey?: string) {
  return items.filter((item) => item.active || item.key === currentKey);
}

export const optionLabel = (items: OptionItem[], key: string) =>
  items.find((item) => item.key === key)?.label ?? key;

export const optionLabelMap = <Key extends string>(items: OptionItem<Key>[]) =>
  Object.fromEntries(items.map((item) => [item.key, item.label])) as Record<Key, string>;
