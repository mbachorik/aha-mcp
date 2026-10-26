import { afterEach, vi } from "vitest";
import { Handlers } from "../src/handlers";
import { IDEA_REF_REGEX } from "../src/types";

const call = (args: object) =>
  new Handlers({} as any, "https://acme.aha.io/api/v1", "token").handleGetIdea({
    params: { arguments: args },
  });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe("IDEA_REF_REGEX", () => {
  it("accepts idea references only", () => {
    expect(IDEA_REF_REGEX.test("PO-I-47")).toBe(true);
    expect(IDEA_REF_REGEX.test("ABC-I-123")).toBe(true);
    expect(IDEA_REF_REGEX.test("ABC-123")).toBe(false);
    expect(IDEA_REF_REGEX.test("ABC-E-123")).toBe(false);
  });
});

describe("handleGetIdea", () => {
  it("rejects invalid references", async () => {
    await expect(call({ reference: "ABC-123" })).rejects.toThrow(/ABC-I-123/);
  });

  it("returns the idea without comments by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ idea: { name: "X" } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call({ reference: "PO-I-47" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://acme.aha.io/api/v1/ideas/PO-I-47");
    expect(JSON.parse(res.content[0].text)).toEqual({ idea: { name: "X" } });
  });

  it("reports a missing idea on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 404)));
    const res = await call({ reference: "PO-I-1" });
    expect(res.content[0].text).toMatch(/No idea found/);
  });

  it("follows comment pages when includeComments is set", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ idea: { name: "X" } }))
      .mockResolvedValueOnce(json({ comments: [{ id: 1 }], pagination: { total_pages: 2 } }))
      .mockResolvedValueOnce(json({ comments: [{ id: 2 }], pagination: { total_pages: 2 } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call({ reference: "PO-I-47", includeComments: true });
    const out = JSON.parse(res.content[0].text);

    expect(out.comments).toEqual([{ id: 1 }, { id: 2 }]);
    expect(out.truncated).toBe(false);
    expect(fetchMock.mock.calls[1][0]).toContain("/ideas/PO-I-47/comments?page=1");
  });
});
