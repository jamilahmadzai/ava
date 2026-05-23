import test from '@ava/test';

import {fixture} from '../helpers/exec.js';

test('cleanup hooks run in documented order', async t => {
	const result = await fixture(['order.js']);

	t.deepEqual(result.stats.passed.map(({title}) => title), ['first', 'second']);
	t.is(result.stats.failedHooks.length, 0);
});

test('cleanup hooks run after a failed test', async t => {
	const result = await t.throwsAsync(fixture(['failure.js']));

	t.deepEqual(result.stats.failed.map(({title}) => title), ['fails']);
	t.is(result.stats.failedHooks.length, 0);
});
