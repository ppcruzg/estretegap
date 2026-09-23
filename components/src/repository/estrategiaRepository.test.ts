import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };
type Call = { table: string; ops: Array<[string, unknown[]]> };

// Minimal chainable fake of the supabase query builder. Every `from()` call
// records its chain and resolves with the next queued result.
const calls: Call[] = [];
const results: Result[] = [];

function makeBuilder(table: string) {
  const call: Call = { table, ops: [] };
  calls.push(call);
  const settle = () => Promise.resolve(results.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {
    then: (ok: (r: Result) => unknown, fail?: (e: unknown) => unknown) => settle().then(ok, fail),
  };
  for (const name of ["select", "insert", "update", "upsert", "delete", "eq", "order", "limit"]) {
    builder[name] = (...args: unknown[]) => {
      call.ops.push([name, args]);
      return builder;
    };
  }
  for (const name of ["single", "maybeSingle"]) {
    builder[name] = () => {
      call.ops.push([name, []]);
      return settle();
    };
  }
  return builder;
}

vi.mock("../lib/supabaseClient", () => ({
  supabase: { from: (table: string) => makeBuilder(table) },
}));

const repo = await import("./estrategiaRepository");

const op = (call: Call, name: string) => call.ops.filter(([n]) => n === name).map(([, a]) => a);

beforeEach(() => {
  calls.length = 0;
  results.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getPage", () => {
  it("scopes the query by page id and company id", async () => {
    results.push({ data: null, error: { message: "boom" } });
    await repo.getPage("p1", "c1");

    expect(calls[0].table).toBe("pages");
    expect(op(calls[0], "eq")).toEqual([
      ["id", "p1"],
      ["company_id", "c1"],
    ]);
    expect(op(calls[0], "single")).toHaveLength(1);
  });

  it("returns null when supabase returns an error", async () => {
    results.push({ data: null, error: { message: "not found" } });
    await expect(repo.getPage("p1", "c1")).resolves.toBeNull();
  });

  it("maps the row and sorts columns and items by position", async () => {
    results.push({
      data: {
        id: "p1",
        identifier: "ID",
        title: "Title",
        footer_title: "Footer",
        created_at: "2026-01-01T00:00:00Z",
        columns: [
          { id: "b", position: 2, items: [] },
          {
            id: "a",
            position: 1,
            column_status_categories: [{ status_id: "pendiente" }],
            items: [
              { id: "i2", position: 5 },
              { id: "i1", position: 0 },
            ],
          },
        ],
      },
      error: null,
    });

    const page = await repo.getPage("p1", "c1");

    expect(page?.pageConfig).toMatchObject({
      identifier: "ID",
      title: "Title",
      footerTitle: "Footer",
    });
    expect(page?.columns.map((c) => c.id)).toEqual(["a", "b"]);
    expect(page?.columns[0].items.map((i: { id: string }) => i.id)).toEqual(["i1", "i2"]);
    expect(page?.columns[1].statusCategories).toEqual([]);
    expect(page?.documentationLinks).toEqual([]);
    expect(page?.createdAt).toBe(Date.parse("2026-01-01T00:00:00Z"));
  });
});

describe("getPagesList", () => {
  it("lists pages of a company ordered by creation date", async () => {
    const pages = [{ id: "p1", identifier: "A", title: "A" }];
    results.push({ data: pages, error: null });

    await expect(repo.getPagesList("c1")).resolves.toEqual(pages);
    expect(op(calls[0], "eq")).toEqual([["company_id", "c1"]]);
    expect(op(calls[0], "order")).toEqual([["created_at", { ascending: true }]]);
  });

  it("returns an empty list on error", async () => {
    results.push({ data: null, error: { message: "rls" } });
    await expect(repo.getPagesList("c1")).resolves.toEqual([]);
  });
});

describe("createItem", () => {
  it('appends after the last item and defaults status to "pendiente" when the column has it', async () => {
    results.push({ data: { status_id: "pendiente" }, error: null }); // status lookup
    results.push({ data: [{ position: 4 }], error: null }); // last position
    results.push({ data: { id: "new" }, error: null }); // insert

    await expect(repo.createItem("col1", "u1")).resolves.toEqual({ id: "new" });
    const [inserted] = op(calls[2], "insert")[0] as [Record<string, unknown>];
    expect(calls[2].table).toBe("items");
    expect(inserted).toMatchObject({
      column_id: "col1",
      position: 5,
      status: "pendiente",
      type: "leaf",
    });
  });

  it('starts at position 0 with no status for an empty column without "pendiente"', async () => {
    results.push({ data: null, error: null });
    results.push({ data: [], error: null });
    results.push({ data: { id: "new" }, error: null });

    await repo.createItem("col1", "u1");
    const [inserted] = op(calls[2], "insert")[0] as [Record<string, unknown>];
    expect(inserted).toMatchObject({ position: 0, status: null });
  });

  it("throws when the insert fails", async () => {
    const error = { message: "insert failed" };
    results.push({ data: null, error: null }, { data: [], error: null }, { data: null, error });
    await expect(repo.createItem("col1", "u1")).rejects.toBe(error);
  });
});

describe("updateItem / deleteItem", () => {
  it("updateItem throws on error", async () => {
    const error = { message: "denied" };
    results.push({ data: null, error });
    await expect(repo.updateItem("i1", { label: "x" })).rejects.toBe(error);
    expect(op(calls[0], "eq")).toEqual([["id", "i1"]]);
  });

  it("deleteItem rejects when supabase returns an error", async () => {
    const error = { message: "denied" };
    results.push({ data: null, error });
    await expect(repo.deleteItem("i1")).rejects.toBe(error);
    expect(calls[0].table).toBe("items");
    expect(op(calls[0], "eq")).toEqual([["id", "i1"]]);
  });

  it("deleteColumn rejects when supabase returns an error", async () => {
    const error = { message: "denied" };
    results.push({ data: null, error });
    await expect(repo.deleteColumn("c1")).rejects.toBe(error);
    expect(calls[0].table).toBe("columns");
    expect(op(calls[0], "eq")).toEqual([["id", "c1"]]);
  });

  it("deleteItem resolves when supabase succeeds", async () => {
    results.push({ data: null, error: null });
    await expect(repo.deleteItem("i1")).resolves.toBeUndefined();
  });
});

describe("system config & project tags", () => {
  it("updateSystemConfig upserts by config_key and throws on error", async () => {
    const error = { message: "forbidden" };
    results.push({ data: null, error });

    await expect(repo.updateSystemConfig("k", "v", "u1")).rejects.toBe(error);
    const [row, opts] = op(calls[0], "upsert")[0] as [Record<string, unknown>, unknown];
    expect(calls[0].table).toBe("system_config");
    expect(row).toMatchObject({ config_key: "k", config_value: "v", updated_by: "u1" });
    expect(opts).toEqual({ onConflict: "config_key" });
  });

  it("getProjectTags returns defaults when nothing is stored", async () => {
    results.push({ data: null, error: null });
    await expect(repo.getProjectTags()).resolves.toEqual([
      "#Urgente",
      "#Importante",
      "#Review",
      "#Bloqueado",
    ]);
  });

  it("getProjectTags parses stored JSON", async () => {
    results.push({ data: { config_value: '["#A","#B"]' }, error: null });
    await expect(repo.getProjectTags()).resolves.toEqual(["#A", "#B"]);
  });

  it("getProjectTags returns an empty list for corrupt JSON", async () => {
    results.push({ data: { config_value: "{not json" }, error: null });
    await expect(repo.getProjectTags()).resolves.toEqual([]);
  });
});
