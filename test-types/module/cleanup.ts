/* eslint-disable @typescript-eslint/no-empty-function */
import {expectType} from 'tsd';

import type {TestFn} from '../../entrypoints/main.js';
import anyTest from '../../entrypoints/main.js';

type Context = {
	foo: string;
};

const test = anyTest as TestFn<Context>;
const macro = test.macro((t, expected: string) => {
	expectType<Context>(t.context);
	expectType<string>(expected);
});

test.cleanup('cleanup', t => {
	expectType<Context>(t.context);
});
test.cleanup(t => {
	expectType<Context>(t.context);
});
test.cleanup('cleanup macro', macro, 'foo');
test.cleanup(macro, 'foo');
test.cleanup.skip('cleanup skip', () => {});
test.cleanup.skip(() => {});

test.cleanupEach('cleanup each', t => {
	expectType<Context>(t.context);
});
test.cleanupEach(t => {
	expectType<Context>(t.context);
});
test.cleanupEach('cleanup each macro', macro, 'foo');
test.cleanupEach(macro, 'foo');
test.cleanupEach.skip('cleanup each skip', () => {});
test.cleanupEach.skip(() => {});

test.serial.cleanup('serial cleanup', macro, 'foo');
test.serial.cleanupEach('serial cleanup each', macro, 'foo');
