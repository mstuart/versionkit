import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractFromAccept } from "../src/strategies/accept.js";
import { extractFromHeader } from "../src/strategies/header.js";
import { extractFromUrl } from "../src/strategies/url.js";

describe("header strategy", () => {
  it("extracts version from Api-Version header", () => {
    const req = new Request("http://localhost/users", {
      headers: { "Api-Version": "2025-01-01" },
    });
    assert.equal(extractFromHeader(req, "Api-Version"), "2025-01-01");
  });

  it("extracts version from custom header name", () => {
    const req = new Request("http://localhost/users", {
      headers: { "X-API-Version": "3" },
    });
    assert.equal(extractFromHeader(req, "X-API-Version"), "3");
  });

  it("returns null when header is missing", () => {
    const req = new Request("http://localhost/users");
    assert.equal(extractFromHeader(req, "Api-Version"), null);
  });
});

describe("url strategy", () => {
  it("extracts version from /v2/users", () => {
    const req = new Request("http://localhost/v2/users");
    assert.equal(extractFromUrl(req), "2");
  });

  it("extracts date-based version from /v2025-01-01/users", () => {
    const req = new Request("http://localhost/v2025-01-01/users");
    assert.equal(extractFromUrl(req), "2025-01-01");
  });

  it("returns null when no version prefix", () => {
    const req = new Request("http://localhost/users");
    assert.equal(extractFromUrl(req), null);
  });
});

describe("accept strategy", () => {
  it("extracts version from Accept header", () => {
    const req = new Request("http://localhost/users", {
      headers: { Accept: "application/vnd.api.v2+json" },
    });
    assert.equal(extractFromAccept(req), "v2");
  });

  it("returns null when Accept header has no version", () => {
    const req = new Request("http://localhost/users", {
      headers: { Accept: "application/json" },
    });
    assert.equal(extractFromAccept(req), null);
  });

  it("returns null when no Accept header", () => {
    const req = new Request("http://localhost/users");
    assert.equal(extractFromAccept(req), null);
  });
});
