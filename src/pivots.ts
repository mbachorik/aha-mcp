export type PivotView = "list" | "pivot";

export interface PivotCell {
  id?: string;
  plain_value: unknown;
  html_value?: string;
  rich_value?: unknown;
}

export interface PivotHeader extends PivotCell {
  ref: number;
  parent_ref: number | null;
  child_refs: number[];
  field_definition_ref: number;
}

export interface PivotFieldDefinition {
  ref: number;
  table: string;
  field: string;
  title: string;
}

export interface ListReportResponse {
  pagination: { total_records: number; total_pages: number; current_page: number }[];
  columns: { table: string; field: string; title: string }[];
  rows: PivotCell[][];
}

export interface PivotReportResponse {
  top_level_columns: number[];
  columns: { [ref: string]: PivotHeader };
  top_level_rows: number[];
  rows: { [ref: string]: PivotHeader };
  cells: unknown;
  field_definitions: { [ref: string]: PivotFieldDefinition };
}

const REPORT_ID_REGEX = /^\d+$/;
const REPORT_URL_REGEX = /custom_pivots\/(\d+)/;

export const LIST_PAGE_SIZE = 200;
export const MAX_LIST_PAGES = 50;

export function parseReportId(input: string): string | undefined {
  const trimmed = input.trim();
  if (REPORT_ID_REGEX.test(trimmed)) return trimmed;
  return trimmed.match(REPORT_URL_REGEX)?.[1];
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
  baseDelayMs = 500
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, init).catch((error) => {
      if (attempt >= attempts) throw error;
      return undefined;
    });
    const retryable =
      !response || response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= attempts) return response!;
    await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
  }
}

export function compactListReport(pages: ListReportResponse[]) {
  const first = pages[0];
  return {
    view: "list" as const,
    totalRecords: first.pagination[0]?.total_records ?? 0,
    columns: first.columns.map((c) => ({
      title: c.title,
      table: c.table,
      field: c.field,
    })),
    rows: pages.flatMap((p) => p.rows.map((row) => row.map((c) => c.plain_value))),
  };
}

function headerPath(
  headers: { [ref: string]: PivotHeader },
  ref: number | null | undefined
): unknown[] {
  const path: unknown[] = [];
  let current = ref == null ? undefined : headers[String(ref)];
  while (current) {
    path.unshift(current.plain_value);
    current =
      current.parent_ref == null ? undefined : headers[String(current.parent_ref)];
  }
  return path;
}

function collectCells(node: unknown, out: (PivotCell & Record<string, unknown>)[]) {
  if (Array.isArray(node)) {
    for (const child of node) collectCells(child, out);
  } else if (node && typeof node === "object" && "plain_value" in node) {
    out.push(node as PivotCell & Record<string, unknown>);
  }
}

export function compactPivotReport(data: PivotReportResponse) {
  const fieldTitle = (ref: unknown) =>
    data.field_definitions[String(ref)]?.title ?? null;
  const groupingFields = (headers: { [ref: string]: PivotHeader }) => [
    ...new Set(Object.values(headers).map((h) => fieldTitle(h.field_definition_ref))),
  ];

  const rawCells: (PivotCell & Record<string, unknown>)[] = [];
  collectCells(data.cells, rawCells);

  return {
    view: "pivot" as const,
    rowGrouping: groupingFields(data.rows),
    columnGrouping: groupingFields(data.columns),
    cells: rawCells.map((cell) => ({
      row: headerPath(data.rows, cell.row_ref as number | null),
      column: headerPath(data.columns, cell.column_ref as number | null),
      field: fieldTitle(cell.field_definition_ref),
      value: cell.plain_value,
    })),
  };
}
