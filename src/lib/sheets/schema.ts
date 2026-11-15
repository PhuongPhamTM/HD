import { mapContentStatus, mapPublicationStatus, normalizeChecks } from "@/lib/domain/legacy-map";
import { OPTION_GROUPS, type OptionRow } from "@/lib/domain/options";
import type { HubData } from "@/lib/domain/types";

/**
 * How each collection is laid out in the Google Sheet: one tab per collection,
 * one row per record, header in row 1. Columns are matched by header name, so they
 * can be reordered in the Sheet. Fields not listed here go into the `extra` JSON column.
 */
type ColumnType = "text" | "boolean" | "list";
interface Column {
  name: string;
  type?: ColumnType;
}
export interface TabSchema {
  tab: string;
  columns: Column[];
  /** Whether unknown fields are kept in an `extra` JSON column. */
  extra: boolean;
}
export type CollectionName = "campaigns" | "content" | "media" | "publications" | "activity";
export const COLLECTIONS: CollectionName[] = [
  "campaigns",
  "content",
  "media",
  "publications",
  "activity",
];
export const EXTRA_COLUMN = "extra";

const text = (...names: string[]): Column[] => names.map((name) => ({ name }));
export const TAB_SCHEMAS: Record<CollectionName, TabSchema> = {
  campaigns: {
    tab: "Campaigns",
    columns: text("id", "title", "owner", "goal", "start", "end", "source", "sourceCampaign"),
    extra: true,
  },
  content: {
    tab: "Content",
    columns: [
      ...text("id", "title", "campaign", "owner", "location", "status", "shoot", "shootTime"),
      ...text("edit", "due", "script", "format", "priority", "pillar"),
      { name: "checks", type: "list" },
      ...text("createdAt", "approvedAt"),
      { name: "historyOnly", type: "boolean" },
      { name: "thumbnail" },
    ],
    extra: true,
  },
  media: {
    tab: "Media",
    columns: text("id", "title", "content", "type", "url", "approval", "createdAt"),
    extra: true,
  },
  publications: {
    tab: "Publications",
    columns: [
      ...text("id", "content", "channel", "account", "date", "time", "posted", "status"),
      ...text("url", "caption", "hashtags"),
      { name: "scheduleUnknown", type: "boolean" },
    ],
    extra: true,
  },
  activity: { tab: "Activity", columns: text("id", "at", "actor", "message"), extra: false },
};
export const OPTIONS_TAB: TabSchema = {
  tab: "Options",
  columns: text("group", "key", "label", "order", "active", "stages"),
  extra: false,
};

/** Sign-in accounts. Read only on the server; password hashes never reach the browser. */
export const USERS_TAB: TabSchema = {
  tab: "Users",
  columns: text("email", "name", "passwordHash", "role", "active", "createdAt", "updatedAt"),
  extra: false,
};

export const headerFor = (schema: TabSchema) => [
  ...schema.columns.map((column) => column.name),
  ...(schema.extra ? [EXTRA_COLUMN] : []),
];

type Cell = string | number | boolean | null | undefined;
const cellText = (value: Cell) => (value == null ? "" : String(value));

function encodeValue(value: unknown, type: ColumnType = "text") {
  if (value == null) return "";
  if (type === "boolean") return value ? "TRUE" : "FALSE";
  if (type === "list") return Array.isArray(value) ? value.join(",") : String(value);
  return typeof value === "string" ? value : JSON.stringify(value);
}
function decodeValue(value: string, type: ColumnType = "text") {
  if (type === "boolean") return value.trim().toUpperCase() === "TRUE";
  if (type === "list")
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  return value;
}

/** Builds a Sheet row in the order of the tab's actual header. */
export function toRow(schema: TabSchema, record: object, header: string[]): string[] {
  const columnsByName = new Map(schema.columns.map((column) => [column.name, column]));
  const values = record as Record<string, unknown>;
  // Fields without a column in this tab's actual header (unknown fields, or a column added to
  // the schema that the Sheet does not have yet) are kept in `extra` instead of being dropped.
  const headerNames = new Set(header);
  const extraFields = Object.fromEntries(
    Object.entries(values).filter(
      ([field, value]) =>
        !(columnsByName.has(field) && headerNames.has(field)) && value !== undefined,
    ),
  );
  return header.map((headerName) => {
    if (headerName === EXTRA_COLUMN && schema.extra)
      return Object.keys(extraFields).length ? JSON.stringify(extraFields) : "";
    const column = columnsByName.get(headerName);
    return column ? encodeValue(values[headerName], column.type) : "";
  });
}

/** Reads one Sheet row into a record, using the tab's actual header. */
export function fromRow(schema: TabSchema, header: string[], row: Cell[]) {
  const columnsByName = new Map(schema.columns.map((column) => [column.name, column]));
  let record: Record<string, unknown> = {};
  header.forEach((headerName, columnIndex) => {
    const value = cellText(row[columnIndex]);
    if (headerName === EXTRA_COLUMN && schema.extra) {
      if (!value.trim()) return;
      try {
        const extraFields: unknown = JSON.parse(value);
        if (extraFields && typeof extraFields === "object" && !Array.isArray(extraFields))
          record = { ...extraFields, ...record };
      } catch {
        // A hand-edited extra cell that is not valid JSON is ignored rather than breaking the load.
      }
      return;
    }
    const column = columnsByName.get(headerName);
    if (!column) return;
    const decoded = decodeValue(value, column.type);
    // Leave empty optional booleans unset instead of writing `false` into every record.
    if (column.type === "boolean" && !value.trim()) return;
    record[headerName] = decoded;
  });
  return record;
}

const isBlankRow = (row: Cell[]) => row.every((cell) => !cellText(cell).trim());

/** Converts the raw values of every tab into the app's data shape. */
export function parseWorkspace(
  tabValues: Record<CollectionName, Cell[][]>,
  optionValues: Cell[][],
): { data: HubData; optionRows: OptionRow[] } {
  const readTab = (schema: TabSchema, values: Cell[][]) => {
    const [headerRow = [], ...rows] = values;
    const header = headerRow.map((cell) => cellText(cell).trim());
    return rows.filter((row) => !isBlankRow(row)).map((row) => fromRow(schema, header, row));
  };
  const withId = <T extends { id?: unknown }>(records: T[]) =>
    records.filter((record) => typeof record.id === "string" && record.id.trim());

  const content = withId(readTab(TAB_SCHEMAS.content, tabValues.content)).map((record) => ({
    ...record,
    status: mapContentStatus(String(record.status ?? "")),
    checks: normalizeChecks(record.checks),
  }));
  const publications = withId(readTab(TAB_SCHEMAS.publications, tabValues.publications)).map(
    (record) => ({ ...record, status: mapPublicationStatus(String(record.status ?? "")) }),
  );
  const activity = withId(readTab(TAB_SCHEMAS.activity, tabValues.activity)).sort((left, right) =>
    String(right.at ?? "").localeCompare(String(left.at ?? "")),
  );
  return {
    data: {
      campaigns: withId(readTab(TAB_SCHEMAS.campaigns, tabValues.campaigns)),
      content,
      media: withId(readTab(TAB_SCHEMAS.media, tabValues.media)),
      publications,
      activity,
    } as unknown as HubData,
    optionRows: readTab(OPTIONS_TAB, optionValues)
      .map((record) => ({
        group: String(record.group ?? ""),
        key: String(record.key ?? ""),
        label: String(record.label ?? ""),
        order: String(record.order ?? ""),
        active: String(record.active ?? ""),
        stages: String(record.stages ?? ""),
      }))
      .filter((row) => (OPTION_GROUPS as string[]).includes(row.group.trim().toLowerCase())),
  };
}
