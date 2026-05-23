import test from 'ava';

const events = [];

test.cleanup('file cleanup', () => {
	events.push('file cleanup');
});

test.cleanupEach('each cleanup', () => {
	events.push('each cleanup');
});

test.serial('first', t => {
	events.push('first');
	t.pass();
});

test.serial('second', t => {
	events.push('second');
	t.pass();
});

test.after.always('cleanup order', t => {
	t.deepEqual(events, [
		'file cleanup',
		'each cleanup',
		'first',
		'each cleanup',
		'second',
		'file cleanup',
		'each cleanup',
	]);
});
