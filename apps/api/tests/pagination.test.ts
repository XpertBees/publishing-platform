import { describe, expect, it } from "vitest";
import { paginate, parsePagination } from "../src/utils/pagination";

describe("parsePagination", () => {
  it("defaults to page 1, pageSize 20", () => {
    expect(parsePagination({})).toEqual({ limit: 20, offset: 0, page: 1, pageSize: 20 });
  });

  it("parses page/pageSize from query strings", () => {
    expect(parsePagination({ page: "3", pageSize: "10" })).toEqual({
      limit: 10,
      offset: 20,
      page: 3,
      pageSize: 10,
    });
  });

  it("clamps pageSize to 100 and floors page at 1", () => {
    expect(parsePagination({ page: "0", pageSize: "500" })).toEqual({
      limit: 100,
      offset: 0,
      page: 1,
      pageSize: 100,
    });
  });

  it("falls back to defaults for non-numeric input", () => {
    expect(parsePagination({ page: "abc", pageSize: "xyz" })).toEqual({
      limit: 20,
      offset: 0,
      page: 1,
      pageSize: 20,
    });
  });
});

describe("paginate", () => {
  it("wraps items in the shared Paginated shape", () => {
    const params = parsePagination({ page: "2", pageSize: "10" });
    expect(paginate(["a", "b"], 25, params)).toEqual({
      items: ["a", "b"],
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it("totalPages is at least 1 for an empty result", () => {
    expect(paginate([], 0, parsePagination({}))).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
  });
});
