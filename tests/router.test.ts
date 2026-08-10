import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createVersionRouter } from "../src/router.js";

describe("VersionRouter", () => {
  it("dispatches to correct handler for header strategy", async () => {
    const router = createVersionRouter({
      strategy: "header",
      versions: {
        "1": {},
        "2": {},
      },
    });

    router
      .handle("1", () => new Response("v1"))
      .handle("2", () => new Response("v2"));

    const mw = router.middleware();

    const res = await mw(
      new Request("http://localhost/users", {
        headers: { "Api-Version": "2" },
      })
    );

    assert.equal(await res.text(), "v2");
  });

  it("dispatches to correct handler for url strategy", async () => {
    const router = createVersionRouter({
      strategy: "url",
      versions: {
        "2": {},
      },
    });

    router.handle("2", () => new Response("url-v2"));

    const mw = router.middleware();
    const res = await mw(new Request("http://localhost/v2/users"));
    assert.equal(await res.text(), "url-v2");
  });

  it("dispatches to correct handler for accept strategy", async () => {
    const router = createVersionRouter({
      strategy: "accept",
      versions: {
        v2: {},
      },
    });

    router.handle("v2", () => new Response("accept-v2"));

    const mw = router.middleware();
    const res = await mw(
      new Request("http://localhost/users", {
        headers: { Accept: "application/vnd.api.v2+json" },
      })
    );
    assert.equal(await res.text(), "accept-v2");
  });

  it("uses defaultVersion when no version found", async () => {
    const router = createVersionRouter({
      defaultVersion: "1",
      strategy: "header",
      versions: {
        "1": {},
      },
    });

    router.handle("1", () => new Response("default-v1"));

    const mw = router.middleware();
    const res = await mw(new Request("http://localhost/users"));
    assert.equal(await res.text(), "default-v1");
  });

  it("returns 400 when no version found and no default", async () => {
    const router = createVersionRouter({
      strategy: "header",
      versions: {},
    });

    const mw = router.middleware();
    const res = await mw(new Request("http://localhost/users"));
    assert.equal(res.status, 400);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "API version is required");
  });

  it("returns 400 for unsupported version", async () => {
    const router = createVersionRouter({
      strategy: "header",
      versions: {
        "1": {},
      },
    });

    router.handle("1", () => new Response("v1"));

    const mw = router.middleware();
    const res = await mw(
      new Request("http://localhost/users", {
        headers: { "Api-Version": "99" },
      })
    );
    assert.equal(res.status, 400);

    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "Unsupported API version: 99");
  });

  it("resolveVersion returns correct version", () => {
    const router = createVersionRouter({
      strategy: "header",
      versions: {},
    });

    const req = new Request("http://localhost/users", {
      headers: { "Api-Version": "3" },
    });
    assert.equal(router.resolveVersion(req), "3");
  });
});
