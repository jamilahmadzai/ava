import test from 'ava';

const events = [];

test.cleanup('file cleanup', () => {
	events.push('file cleanup');
});

test.cleanupEach('each cleanup', () => {
	events.push('each cleanup');
});

test.serial('fails', t => {
	events.push('fails');
	t.fail();
});

test.after.always('cleanup ran', t => {
	t.deepEqual(events, [
		'file cleanup',
		'each cleanup',
		'fails',
		'file cleanup',
		'each cleanup',
	]);
});
