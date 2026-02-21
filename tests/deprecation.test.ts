import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyDeprecationHeaders } from '../src/deprecation.js';
import { createVersionRouter } from '../src/router.js';

describe('applyDeprecationHeaders', () => {
  it('injects Sunset header in HTTP-date format (RFC 8594)', () => {
    const headers = new Headers();
    const sunset = new Date('2026-06-01T00:00:00Z');
    applyDeprecationHeaders(headers, { sunset });

    assert.equal(headers.get('Sunset'), 'Mon, 01 Jun 2026 00:00:00 GMT');
  });

  it('injects Deprecation header with Unix timestamp (RFC 9745)', () => {
    const headers = new Headers();
    const deprecatedSince = new Date('2025-01-01T00:00:00Z');
    applyDeprecationHeaders(headers, { deprecatedSince });

    assert.equal(headers.get('Deprecation'), '@1735689600');
  });

  it('injects Deprecation: true when no date specified', () => {
    const headers = new Headers();
    applyDeprecationHeaders(headers, {});

    assert.equal(headers.get('Deprecation'), 'true');
  });

  it('injects Link header with rel="deprecation" (RFC 8594)', () => {
    const headers = new Headers();
    applyDeprecationHeaders(headers, { link: 'https://docs.example.com/changelog' });

    assert.equal(
      headers.get('Link'),
      '<https://docs.example.com/changelog>; rel="deprecation"'
    );
  });

  it('injects all headers when fully configured', () => {
    const headers = new Headers();
    applyDeprecationHeaders(headers, {
      sunset: new Date('2026-06-01T00:00:00Z'),
      deprecatedSince: new Date('2025-01-01T00:00:00Z'),
      link: 'https://docs.example.com/changelog',
    });

    assert.equal(headers.get('Sunset'), 'Mon, 01 Jun 2026 00:00:00 GMT');
    assert.equal(headers.get('Deprecation'), '@1735689600');
    assert.equal(headers.get('Link'), '<https://docs.example.com/changelog>; rel="deprecation"');
  });
});

describe('VersionRouter deprecation integration', () => {
  it('injects deprecation headers on response for deprecated version', async () => {
    const router = createVersionRouter({
      strategy: 'header',
      versions: {
        '1': {
          deprecated: true,
          deprecation: {
            sunset: new Date('2026-06-01T00:00:00Z'),
            deprecatedSince: new Date('2025-01-01T00:00:00Z'),
            link: 'https://docs.example.com/changelog',
          },
        },
        '2': {},
      },
    });

    router
      .handle('1', () => new Response('v1-body'))
      .handle('2', () => new Response('v2-body'));

    const mw = router.middleware();
    const res = await mw(new Request('http://localhost/users', {
      headers: { 'Api-Version': '1' },
    }));

    assert.equal(await res.text(), 'v1-body');
    assert.equal(res.headers.get('Sunset'), 'Mon, 01 Jun 2026 00:00:00 GMT');
    assert.equal(res.headers.get('Deprecation'), '@1735689600');
    assert.equal(res.headers.get('Link'), '<https://docs.example.com/changelog>; rel="deprecation"');
  });

  it('does not inject deprecation headers for non-deprecated version', async () => {
    const router = createVersionRouter({
      strategy: 'header',
      versions: {
        '2': {},
      },
    });

    router.handle('2', () => new Response('v2-body'));

    const mw = router.middleware();
    const res = await mw(new Request('http://localhost/users', {
      headers: { 'Api-Version': '2' },
    }));

    assert.equal(await res.text(), 'v2-body');
    assert.equal(res.headers.get('Sunset'), null);
    assert.equal(res.headers.get('Deprecation'), null);
  });
});
