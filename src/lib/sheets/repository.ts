import { DEFAULT_OPTIONS, defaultOptionRows, type OptionRow } from "@/lib/domain/options";
import type { HubData } from "@/lib/domain/types";
import { USER_ROLES } from "@/lib/auth/roles";
import { a1, SheetsError, sheetsRequest, type SheetsConfig } from "./client";
import {
  COLLECTIONS,
  headerFor,
  OPTIONS_TAB,
  parseWorkspace,
  TAB_SCHEMAS,
  toRow,
  USERS_TAB,
  type CollectionName,
  type TabSchema,
} from "./schema";

type Cell = string | number | boolean;
type Values = Cell[][];
type SheetRecord = { id: string };

/** Record-level changes sent from the app; only the touched rows are written. */
export interface HubChanges {
  upsert?: Partial<Record<CollectionName, SheetRecord[]>>;
  remove?: Partial<Record<CollectionName, string[]>>;
}

export class SheetNotReadyError extends SheetsError {
  constructor(readonly missingTabs: string[]) {
    super(`The Sheet is missing these tabs: ${missingTabs.join(", ")}. Run "Set up Sheet".`, 409);
    this.name = "SheetNotReadyError";
  }
}

/** Tabs the app needs to load data. */
const DATA_TABS: TabSchema[] = [...COLLECTIONS.map((name) => TAB_SCHEMAS[name]), OPTIONS_TAB];
/** Tabs "Set up Sheet" creates. Users is optional: without it, sign-in falls back to HUB_USERS. */
const ALL_TABS: TabSchema[] = [...DATA_TABS, USERS_TAB];

/**
 * Writes from this server instance run one at a time, so row numbers read for one
 * change are not shifted by a delete from another change in the middle of it.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
export function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

export async function getTabIds(config: SheetsConfig) {
  const spreadsheet = await sheetsRequest<{
    sheets?: { properties: { sheetId: number; title: string } }[];
  }>(config, "?fields=sheets.properties(sheetId,title)");
  return new Map(
    (spreadsheet.sheets ?? []).map((sheet) => [sheet.properties.title, sheet.properties.sheetId]),
  );
}

export async function batchGet(config: SheetsConfig, ranges: string[]): Promise<Values[]> {
  if (!ranges.length) return [];
  const query = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join("&");
  const response = await sheetsRequest<{ valueRanges?: { values?: Values }[] }>(
    config,
    `/values:batchGet?${query}&majorDimension=ROWS`,
  );
  return ranges.map((_, rangeIndex) => response.valueRanges?.[rangeIndex]?.values ?? []);
}

export async function writeValues(config: SheetsConfig, data: { range: string; values: Values }[]) {
  if (!data.length) return;
  await sheetsRequest(config, "/values:batchUpdate", {
    method: "POST",
    body: { valueInputOption: "RAW", data },
  });
}

export async function appendRows(config: SheetsConfig, tab: string, rows: Values) {
  if (!rows.length) return;
  await sheetsRequest(
    config,
    `/values/${encodeURIComponent(a1(tab, "A1"))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: { values: rows } },
  );
}

export async function updateSpreadsheet(config: SheetsConfig, requests: unknown[]) {
  if (!requests.length) return;
  await sheetsRequest(config, ":batchUpdate", { method: "POST", body: { requests } });
}

export const headerOf = (values: Values) => (values[0] ?? []).map((cell) => String(cell).trim());

/** Reads every tab and returns the data plus the Options rows. */
export async function readWorkspace(config: SheetsConfig) {
  const tabIds = await getTabIds(config);
  const missingTabs = DATA_TABS.map((schema) => schema.tab).filter((tab) => !tabIds.has(tab));
  if (missingTabs.length) throw new SheetNotReadyError(missingTabs);
  const [optionValues, ...collectionValues] = await batchGet(config, [
    a1(OPTIONS_TAB.tab),
    ...COLLECTIONS.map((name) => a1(TAB_SCHEMAS[name].tab)),
  ]);
  return parseWorkspace(
    Object.fromEntries(
      COLLECTIONS.map((name, collectionIndex) => [name, collectionValues[collectionIndex]]),
    ) as Record<CollectionName, Values>,
    optionValues,
  );
}

/** Updates, deletes and appends only the rows named in `changes`. */
export function applyChanges(config: SheetsConfig, changes: HubChanges) {
  return withWriteLock(async () => {
    // Activity is append-only, so its (potentially long) tab never has to be read.
    const touched = COLLECTIONS.filter(
      (name) =>
        name !== "activity" && (changes.upsert?.[name]?.length || changes.remove?.[name]?.length),
    );
    const tabValues = await batchGet(
      config,
      touched.map((name) => a1(TAB_SCHEMAS[name].tab)),
    );
    const updates: { range: string; values: Values }[] = [];
    const appends: { tab: string; rows: Values }[] = [];
    const deletions: { tab: string; rowNumbers: number[] }[] = [];

    touched.forEach((name, tabIndex) => {
      const schema = TAB_SCHEMAS[name];
      const values = tabValues[tabIndex];
      const header = headerOf(values);
      const idColumn = header.indexOf("id");
      if (idColumn < 0) throw new SheetNotReadyError([schema.tab]);
      const rowNumberById = new Map<string, number>();
      values.slice(1).forEach((row, rowIndex) => {
        const id = String(row[idColumn] ?? "").trim();
        if (id && !rowNumberById.has(id)) rowNumberById.set(id, rowIndex + 2);
      });

      const removedIds = new Set(changes.remove?.[name] ?? []);
      const latestById = new Map(
        (changes.upsert?.[name] ?? []).map((record) => [record.id, record]),
      );
      const newRows: Values = [];
      for (const [id, record] of latestById) {
        if (removedIds.has(id)) continue;
        const rowNumber = rowNumberById.get(id);
        const row = toRow(schema, record, header);
        if (rowNumber) updates.push({ range: a1(schema.tab, `A${rowNumber}`), values: [row] });
        else newRows.push(row);
      }
      if (newRows.length) appends.push({ tab: schema.tab, rows: newRows });
      const rowNumbers = [...removedIds]
        .map((id) => rowNumberById.get(id))
        .filter((rowNumber): rowNumber is number => Boolean(rowNumber));
      if (rowNumbers.length) deletions.push({ tab: schema.tab, rowNumbers });
    });

    // Updates first, while the row numbers read above are still valid.
    await writeValues(config, updates);
    if (deletions.length) {
      const tabIds = await getTabIds(config);
      await updateSpreadsheet(
        config,
        deletions.flatMap(({ tab, rowNumbers }) =>
          // Bottom-up, so each deletion leaves the remaining row numbers unchanged.
          [...rowNumbers]
            .sort((left, right) => right - left)
            .map((rowNumber) => ({
              deleteDimension: {
                range: {
                  sheetId: tabIds.get(tab),
                  dimension: "ROWS",
                  startIndex: rowNumber - 1,
                  endIndex: rowNumber,
                },
              },
            })),
        ),
      );
    }
    const activity = changes.upsert?.activity ?? [];
    if (activity.length) {
      const schema = TAB_SCHEMAS.activity;
      appends.push({
        tab: schema.tab,
        rows: activity.map((record) => toRow(schema, record, headerFor(schema))),
      });
    }
    await Promise.all(appends.map(({ tab, rows }) => appendRows(config, tab, rows)));
  });
}

/** Replaces the rows of every collection tab with `data` (headers are rewritten too). */
export function replaceWorkspace(config: SheetsConfig, data: HubData) {
  return withWriteLock(async () => {
    const tabIds = await getTabIds(config);
    const missingTabs = COLLECTIONS.map((name) => TAB_SCHEMAS[name].tab).filter(
      (tab) => !tabIds.has(tab),
    );
    if (missingTabs.length) throw new SheetNotReadyError(missingTabs);
    await sheetsRequest(config, "/values:batchClear", {
      method: "POST",
      body: { ranges: COLLECTIONS.map((name) => a1(TAB_SCHEMAS[name].tab)) },
    });
    await writeValues(
      config,
      COLLECTIONS.map((name) => {
        const schema = TAB_SCHEMAS[name];
        const header = headerFor(schema);
        return {
          range: a1(schema.tab, "A1"),
          values: [header, ...data[name].map((record) => toRow(schema, record, header))],
        };
      }),
    );
  });
}

/**
 * Creates any missing tabs, adds missing header columns, formats the tabs as plain text
 * (so Sheets does not turn "2026-11-15" into a locale date), adds status dropdowns and seeds
 * the Options tab. Collection tabs that have no rows yet are filled from `seed`.
 */
export function setupSpreadsheet(config: SheetsConfig, seed: HubData | null) {
  return withWriteLock(async () => {
    let tabIds = await getTabIds(config);
    const missingTabs = ALL_TABS.filter((schema) => !tabIds.has(schema.tab));
    if (missingTabs.length) {
      await updateSpreadsheet(
        config,
        missingTabs.map((schema) => ({ addSheet: { properties: { title: schema.tab } } })),
      );
      tabIds = await getTabIds(config);
    }

    const currentValues = await batchGet(
      config,
      ALL_TABS.map((schema) => a1(schema.tab, "A1:ZZ2")),
    );
    const headers = new Map<string, string[]>();
    const emptyTabs = new Set<string>();
    const headerWrites: { range: string; values: Values }[] = [];
    ALL_TABS.forEach((schema, tabIndex) => {
      const existingHeader = headerOf(currentValues[tabIndex]).filter(Boolean);
      const missingColumns = headerFor(schema).filter((name) => !existingHeader.includes(name));
      const header = [...existingHeader, ...missingColumns];
      headers.set(schema.tab, header);
      if (missingColumns.length)
        headerWrites.push({ range: a1(schema.tab, "A1"), values: [header] });
      if (currentValues[tabIndex].length < 2) emptyTabs.add(schema.tab);
    });
    await writeValues(config, headerWrites);

    const formatting = ALL_TABS.flatMap((schema) => {
      const sheetId = tabIds.get(schema.tab);
      const header = headers.get(schema.tab) ?? [];
      return [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          repeatCell: {
            range: { sheetId },
            cell: { userEnteredFormat: { numberFormat: { type: "TEXT" } } },
            fields: "userEnteredFormat.numberFormat",
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        ...dropdownValidations(schema, header, sheetId),
      ];
    });
    await updateSpreadsheet(config, formatting);

    if (emptyTabs.has(OPTIONS_TAB.tab)) {
      const header = headers.get(OPTIONS_TAB.tab) ?? headerFor(OPTIONS_TAB);
      await appendRows(
        config,
        OPTIONS_TAB.tab,
        defaultOptionRows().map((row: OptionRow) => toRow(OPTIONS_TAB, row, header)),
      );
    }
    const seeded = seed
      ? COLLECTIONS.filter((name) => emptyTabs.has(TAB_SCHEMAS[name].tab) && seed[name]?.length)
      : [];
    await Promise.all(
      seeded.map((name) => {
        const schema = TAB_SCHEMAS[name];
        const header = headers.get(schema.tab) ?? headerFor(schema);
        return appendRows(
          config,
          schema.tab,
          seed![name].map((record) => toRow(schema, record, header)),
        );
      }),
    );
    return { createdTabs: missingTabs.map((schema) => schema.tab), seeded };
  });
}

/** Columns with a fixed set of values get a dropdown; it warns rather than rejects. */
function dropdownValidations(schema: TabSchema, header: string[], sheetId: number | undefined) {
  const dropdownsByTab: Record<string, Record<string, string[]>> = {
    [TAB_SCHEMAS.content.tab]: { status: DEFAULT_OPTIONS.stages.map((stage) => stage.key) },
    [TAB_SCHEMAS.publications.tab]: {
      status: DEFAULT_OPTIONS.publicationStatuses.map((status) => status.key),
    },
    [USERS_TAB.tab]: { role: [...USER_ROLES], active: ["TRUE", "FALSE"] },
  };
  return Object.entries(dropdownsByTab[schema.tab] ?? {})
    .map(([columnName, keys]) => ({ keys, column: header.indexOf(columnName) }))
    .filter(({ column }) => column >= 0)
    .map(({ keys, column: statusColumn }) => ({
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          startColumnIndex: statusColumn,
          endColumnIndex: statusColumn + 1,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: keys.map((key) => ({ userEnteredValue: key })),
          },
          showCustomUi: true,
          strict: false,
        },
      },
    }));
}
