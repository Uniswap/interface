
/** @private */
export function map(array, mapper) {
	return Promise.all(array.map(mapper));
}

/** Invoke a list (object or array) of functions, returning their results in the same structure.
 *	@private
 */
export function resolve(list) {
	let out = Array.isArray(list) ? [] : {};
	for (let i in list) if (list.hasOwnProperty(i)) out[i] = list[i]();
	return out;
}

/** reduce() callback that pushes values into an Array accumulator
 *	@private
 */
export async function pushReducer(acc, v) {
	acc.push(await v());
	return acc;
}

/**
 * Base `map` to invoke `Array` operation **in parallel**.
 * @private
 * @param {String} operation		The operation name of `Array` to be invoked.
 * @return {Array} resulting mapped/transformed values.
 */
export function baseMap(operation) {
	return async (array, predicate) => {
		let mapped = await map(array, predicate);
		return array[operation]( (v, i) => mapped[i] );
	};
}