import { afterEach, vi } from "vitest";
import {
  compactListReport,
  compactPivotReport,
  fetchWithRetry,
  parseReportId,
  PivotReportResponse,
} from "../src/pivots";

describe("parseReportId", () => {
  it("accepts a bare numeric ID", () => {
    expect(parseReportId(" 7498703245593563916 ")).toBe("7498703245593563916");
  });

  it("extracts the first ID from a custom_pivots URL", () => {
    expect(
      parseReportId("https://acme.aha.io/bookmarks/custom_pivots/111/222")
    ).toBe("111");
  });

  it("rejects anything else", () => {
    expect(parseReportId("ABC-123")).toBeUndefined();
    expect(parseReportId("https://acme.aha.io/features/ABC-1")).toBeUndefined();
  });
});

describe("compactListReport", () => {
  it("merges pages into plain-value rows", () => {
    const page = (values: string[]) => ({
      pagination: [{ total_records: 2, total_pages: 2, current_page: 1 }],
      columns: [
        { table: "projects", field: "name", title: "Product name" },
        { table: "releases", field: "capacity", title: "Capacity" },
      ],
      rows: [values.map((v) => ({ plain_value: v, html_value: `<b>${v}</b>` }))],
    });

    const result = compactListReport([page(["Alpha", "10"]), page(["Beta", "20"])]);

    expect(result.totalRecords).toBe(2);
    expect(result.columns.map((c) => c.title)).toEqual(["Product name", "Capacity"]);
    expect(result.rows).toEqual([
      ["Alpha", "10"],
      ["Beta", "20"],
    ]);
  });
});

describe("compactPivotReport", () => {
  const header = (ref: number, value: string, fd: number, parent: number | null = null) => ({
    ref,
    parent_ref: parent,
    child_refs: [],
    plain_value: value,
    field_definition_ref: fd,
  });

  it("resolves nested row/column paths and field titles for every cell", () => {
    const data: PivotReportResponse = {
      top_level_columns: [1],
      columns: { "1": header(1, "Done", 10) },
      top_level_rows: [1],
      rows: { "1": header(1, "Product A", 11), "2": header(2, "2026-Q4", 12, 1) },
      cells: [
        [
          [[{ plain_value: 40, row_ref: 2, column_ref: 1, field_definition_ref: 13 }]],
          [],
        ],
      ],
      field_definitions: {
        "10": { ref: 10, table: "features", field: "status", title: "Status" },
        "11": { ref: 11, table: "projects", field: "name", title: "Product" },
        "12": { ref: 12, table: "features", field: "cf", title: "Quarter" },
        "13": { ref: 13, table: "features", field: "estimate", title: "Estimate" },
      },
    };

    const result = compactPivotReport(data);

    expect(result.rowGrouping).toEqual(["Product", "Quarter"]);
    expect(result.columnGrouping).toEqual(["Status"]);
    expect(result.cells).toEqual([
      { row: ["Product A", "2026-Q4"], column: ["Done"], field: "Estimate", value: 40 },
    ]);
  });

  it("handles pivots without column grouping", () => {
    const result = compactPivotReport({
      top_level_columns: [],
      columns: {},
      top_level_rows: [1],
      rows: { "1": header(1, "Product A", 11) },
      cells: [[[[{ plain_value: 5, row_ref: 1, column_ref: null, field_definition_ref: 11 }]]]],
      field_definitions: {
        "11": { ref: 11, table: "projects", field: "name", title: "Product" },
      },
    });

    expect(result.cells[0].column).toEqual([]);
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries 5xx then returns success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry("https://example.test", {}, 3, 1);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithRetry("https://example.test", {}, 3, 1);

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
