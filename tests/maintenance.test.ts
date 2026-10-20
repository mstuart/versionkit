import assert from "node:assert/strict";
import { it } from "node:test";
import { createVersionRouter } from "../src/router.js";

it("marks deprecated versions when optional deprecation details are absent", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2025-01-01T00:00:00Z"),
  });
  const router = createVersionRouter({
    strategy: "header",
    versions: { "1": { deprecated: true } },
  });
  router.handle("1", () => new Response("old API", { status: 202 }));
  const response = await router.middleware()(
    new Request("https://example.com", { headers: { "Api-Version": "1" } })
  );
  assert.equal(response.headers.get("Deprecation"), "@1735689600");
  assert.equal(response.status, 202);
  assert.equal(await response.text(), "old API");
});

it("keeps handler pagination links when adding deprecation documentation", async () => {
  const next = '<https://example.com/page/2>; rel="next"';
  const router = createVersionRouter({
    strategy: "header",
    versions: {
      "1": {
        deprecated: true,
        deprecation: { link: "https://example.com/migration" },
      },
    },
  });
  router.handle("1", () => new Response("page", { headers: { Link: next } }));
  const response = await router.middleware()(
    new Request("https://example.com", { headers: { "Api-Version": "1" } })
  );
  assert.equal(
    response.headers.get("Link"),
    `${next}, <https://example.com/migration>; rel="deprecation"`
  );
});

it("preserves status-zero responses when deprecation details are omitted", async () => {
  const router = createVersionRouter({
    strategy: "header",
    versions: { "1": { deprecated: true } },
  });
  const response = Response.error();
  router.handle("1", () => response);
  const result = await router.middleware()(
    new Request("https://example.com", { headers: { "Api-Version": "1" } })
  );
  assert.equal(result, response);
  assert.equal(result.status, 0);
});

it("passes through runtime WebSocket upgrade responses with their extension", async () => {
  const router = createVersionRouter({
    strategy: "header",
    versions: { "1": { deprecated: true } },
  });
  const socket = {};
  const response = new Response(null);
  Object.defineProperties(response, {
    status: { value: 101 },
    webSocket: { value: socket },
  });
  router.handle("1", () => response);
  const result = await router.middleware()(
    new Request("https://example.com", { headers: { "Api-Version": "1" } })
  );
  assert.equal(result, response);
  assert.equal(Reflect.get(result, "webSocket"), socket);
});
