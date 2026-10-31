import assert from "node:assert/strict";
import { it } from "node:test";
import { extractFromAccept } from "../src/strategies/accept.js";

for (const value of [
  "application/vnd.my.company.v2+json",
  "Application/Vnd.Api.v2+JSON",
  "application/vnd.api+mobile.v2+json",
]) {
  it(`extracts valid vendor media type ${value}`, () => {
    assert.equal(
      extractFromAccept(
        new Request("http://localhost", { headers: { Accept: value } })
      ),
      "v2"
    );
  });
}
it("ignores vendor text inside quoted media parameters", () => {
  const req = new Request("http://localhost", {
    headers: {
      Accept:
        'text/plain; note="ignore,application/vnd.api.v9+json", application/vnd.api.v2+json',
    },
  });
  assert.equal(extractFromAccept(req), "v2");
});
it("skips explicitly unacceptable versions", () => {
  const req = new Request("http://localhost", {
    headers: {
      Accept: "application/vnd.api.v1+json;q=0, application/vnd.api.v2+json",
    },
  });
  assert.equal(extractFromAccept(req), "v2");
});
it("selects the highest-quality vendor version", () => {
  const req = new Request("http://localhost", {
    headers: {
      Accept:
        "application/vnd.api.v1+json;q=0.1, application/vnd.api.v2+json;q=0.9",
    },
  });
  assert.equal(extractFromAccept(req), "v2");
});
it("returns null when every vendor version is unacceptable", () => {
  const req = new Request("http://localhost", {
    headers: { Accept: "application/vnd.api.v1+json;q=0" },
  });
  assert.equal(extractFromAccept(req), null);
});

it("preserves existing mixed-case version identifiers", () => {
  const req = new Request("http://localhost", {
    headers: { Accept: "application/vnd.api.vBeta+json" },
  });
  assert.equal(extractFromAccept(req), "vBeta");
});
