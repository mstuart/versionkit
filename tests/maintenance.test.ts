import assert from "node:assert/strict";
import { it } from "node:test";
import { createVersionRouter } from "../src/router.js";

it("marks deprecated versions when optional deprecation details are absent", async () => {
  const router = createVersionRouter({
    strategy: "header",
    versions: { "1": { deprecated: true } },
  });
  router.handle("1", () => new Response("old API", { status: 202 }));
  const response = await router.middleware()(
    new Request("https://example.com", { headers: { "Api-Version": "1" } })
  );
  assert.equal(response.headers.get("Deprecation"), "true");
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
