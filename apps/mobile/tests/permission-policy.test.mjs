import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPermissionPolicy } from '../src/location/permission-policy.ts';
import { withTimeout } from '../src/location/with-timeout.ts';

test('granted permission is read again but never requested again', async () => {
  let reads = 0;
  let requests = 0;
  const ensure = createPermissionPolicy(async () => { reads++; return { status: 'granted', canAskAgain: true }; }, async () => { requests++; });
  await ensure(); await ensure(); await ensure(true);
  assert.equal(reads, 3); assert.equal(requests, 0);
});
test('first undetermined permission requests once, then uses OS grant', async () => {
  let status = 'undetermined'; let requests = 0;
  const ensure = createPermissionPolicy(async () => ({ status, canAskAgain: true }), async () => { requests++; status = 'granted'; return { status, canAskAgain: true }; });
  await ensure(); await ensure();
  assert.equal(requests, 1);
});
test('denied permission is not automatically requested; explicit retry can request', async () => {
  let requests = 0;
  const ensure = createPermissionPolicy(async () => ({ status: 'denied', canAskAgain: true }), async () => { requests++; return { status: 'granted', canAskAgain: true }; });
  await ensure(); assert.equal(requests, 0);
  await ensure(true); assert.equal(requests, 1);
});
test('permanently denied permission never requests even on retry', async () => {
  const ensure = createPermissionPolicy(async () => ({ status: 'denied', canAskAgain: false }), async () => assert.fail('must not request'));
  assert.equal((await ensure(true)).status, 'denied');
});
test('permission revoked in Settings is not replaced with a stale grant', async () => {
  let status = 'granted';
  const ensure = createPermissionPolicy(async () => ({ status, canAskAgain: false }), async () => assert.fail('must not request'));
  assert.equal((await ensure()).status, 'granted');
  status = 'denied'; assert.equal((await ensure()).status, 'denied');
});
test('concurrent callers share one permission request', async () => {
  let requests = 0;
  const ensure = createPermissionPolicy(async () => ({ status: 'undetermined', canAskAgain: true }), async () => { requests++; return { status: 'granted', canAskAgain: true }; });
  await Promise.all([ensure(), ensure(), ensure()]);
  assert.equal(requests, 1);
});
test('failed permission reads can be retried', async () => {
  let first = true;
  const ensure = createPermissionPolicy(async () => { if (first) { first = false; throw Error('OS unavailable'); } return { status: 'granted', canAskAgain: true }; }, async () => assert.fail('must not request'));
  await assert.rejects(ensure());
  assert.equal((await ensure()).status, 'granted');
});

test('position timeout prevents an endless location spinner', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10), /Location timed out/);
});
test('successful positions and native errors are preserved', async () => {
  assert.equal(await withTimeout(Promise.resolve('position'), 1000), 'position');
  await assert.rejects(withTimeout(Promise.reject(Error('GPS unavailable')), 1000), /GPS unavailable/);
});
