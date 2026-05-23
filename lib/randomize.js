export const maxSeed = (2 ** 32) - 1;
const randomModulus = (2 ** 31) - 1;
const randomStateCount = randomModulus - 1;

export function generateSeed() {
	return Math.floor(Math.random() * maxSeed) + 1;
}

export function normalizeSeed(value) {
	const seed = Number(value);
	if (!Number.isInteger(seed) || seed < 1 || seed > maxSeed) {
		throw new TypeError(`Seed must be an integer between 1 and ${maxSeed}.`);
	}

	return seed;
}

export function seedForString(seed, string) {
	let hash = normalizeSeed(seed);
	for (const character of string) {
		hash = ((hash * 33) + character.codePointAt(0)) % maxSeed;
	}

	return hash === 0 ? maxSeed : hash;
}

function nextRandom(seed) {
	const state = (seed * 48_271) % randomModulus;

	return {
		seed: state,
		value: state / randomModulus,
	};
}

export function shuffle(items, seed) {
	const shuffled = [...items];
	let state = ((normalizeSeed(seed) - 1) % randomStateCount) + 1;

	for (let index = shuffled.length - 1; index > 0; index--) {
		const random = nextRandom(state);
		state = random.seed;
		const swapIndex = Math.floor(random.value * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}

	return shuffled;
}
