const chainRegistry = new WeakSet();

function startChain(name, call, defaults) {
	const fn = (...args) => call(defaults, args);
	Object.defineProperty(fn, 'name', {value: name});
	chainRegistry.add(fn);
	return fn;
}

function extendChain(previous, name, call, flag) {
	if (!chainRegistry.has(previous)) {
		throw new Error('A chain can only be extended once');
	}

	const defaults = {...previous.defaults, [flag]: true};
	const fn = startChain(name, call, defaults);
	Object.assign(fn, previous);
	delete fn[flag];
	previous[flag] = fn;
	previous.defaults = defaults;
	return fn;
}

function callWithFlag(previous, name, call, flag, value) {
	const fn = (...args) => call({...previous.defaults, [flag]: value}, args);
	Object.defineProperty(fn, 'name', {value: name});
	return fn;
}

function getSkippedTarget(chain, target) {
	return chainRegistry.has(target) ? target.skip : target;
}

function createConditionalChain(parent, name, call, defaults, condition, skip) {
	const fn = startChain(name, call, {...defaults, skip});
	chainRegistry.delete(fn);

	return new Proxy(fn, {
		get(target, propertyKey) {
			if (propertyKey === 'defaults') {
				return {...target.defaults, skip};
			}

			if (propertyKey === 'skip') {
				return undefined;
			}

			if (propertyKey === 'skipIf') {
				return (newCondition, ...args) => createConditionalChain(parent, `${name}.skipIf`, call, target.defaults, newCondition, skip || newCondition(...args));
			}

			if (propertyKey === 'runIf') {
				return (newCondition, ...args) => createConditionalChain(parent, `${name}.runIf`, call, target.defaults, newCondition, skip || !newCondition(...args));
			}

			return getSkippedTarget(target, Reflect.get(parent, propertyKey));
		},

		set(target, propertyKey, value) {
			if (propertyKey === 'defaults') {
				Object.assign(target.defaults, value);
				return true;
			}

			throw new TypeError(`Cannot set property ${String(propertyKey)} on conditional chain`);
		},
	});
}

function addConditionalModifiers(root, name, call, defaults) {
	root.skipIf = (condition, ...args) => createConditionalChain(root, `${name}.skipIf`, call, defaults, condition, condition(...args));
	root.runIf = (condition, ...args) => createConditionalChain(root, `${name}.runIf`, call, defaults, condition, !condition(...args));
}

function createHookChain(hook, isAfterHook) {
	hook.skip = extendChain(hook, `${hook.name}.skip`, hook, 'skip');
	if (isAfterHook) {
		hook.always = extendChain(hook, `${hook.name}.always`, hook, 'always');
	}

	return hook;
}

function createCleanupChain(name, call, defaults, beforeType, afterType) {
	const fn = (...args) => {
		call({...defaults, type: beforeType}, args);
		call({...defaults, type: afterType, always: true}, args);
	};
	Object.defineProperty(fn, 'name', {value: name});
	return fn;
}

export default function createChain(fn, defaults, meta) {
	const root = startChain('test', fn, defaults);
	root.serial = extendChain(root, 'test.serial', fn, 'serial');
	root.only = extendChain(root, 'test.only', fn, 'exclusive');
	root.serial.only = extendChain(root.serial, 'test.serial.only', fn, 'exclusive');
	root.skip = extendChain(root, 'test.skip', fn, 'skip');
	root.serial.skip = extendChain(root.serial, 'test.serial.skip', fn, 'skip');
	root.failing = extendChain(root, 'test.failing', fn, 'failing');
	root.serial.failing = extendChain(root.serial, 'test.serial.failing', fn, 'failing');
	extendChain(root, 'test.todo', fn, 'todo');

	addConditionalModifiers(root, 'test', fn, defaults);
	addConditionalModifiers(root.serial, 'test.serial', fn, {...defaults, serial: true});

	root.after = createHookChain(startChain('test.after', fn, {...defaults, type: 'after'}), true);
	root.afterEach = createHookChain(startChain('test.afterEach', fn, {...defaults, type: 'afterEach'}), true);
	root.before = createHookChain(startChain('test.before', fn, {...defaults, type: 'before'}), false);
	root.beforeEach = createHookChain(startChain('test.beforeEach', fn, {...defaults, type: 'beforeEach'}), false);
	root.cleanup = createCleanupChain('test.cleanup', fn, defaults, 'before', 'after');
	root.cleanupEach = createCleanupChain('test.cleanupEach', fn, defaults, 'beforeEach', 'afterEach');

	root.serial.after = createHookChain(startChain('test.after', fn, {...defaults, serial: true, type: 'after'}), true);
	root.serial.afterEach = createHookChain(startChain('test.afterEach', fn, {...defaults, serial: true, type: 'afterEach'}), true);
	root.serial.before = createHookChain(startChain('test.before', fn, {...defaults, serial: true, type: 'before'}), false);
	root.serial.beforeEach = createHookChain(startChain('test.beforeEach', fn, {...defaults, serial: true, type: 'beforeEach'}), false);
	root.serial.cleanup = createCleanupChain('test.serial.cleanup', fn, {...defaults, serial: true}, 'before', 'after');
	root.serial.cleanupEach = createCleanupChain('test.serial.cleanupEach', fn, {...defaults, serial: true}, 'beforeEach', 'afterEach');

	for (const key of Reflect.ownKeys(meta)) {
		Reflect.defineProperty(root, key, {
			get() {
				return meta[key];
			},
		});
	}

	return root;
}
