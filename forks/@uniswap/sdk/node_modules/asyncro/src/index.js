import { resolve, pushReducer, map, baseMap } from './util';


/** Invoke an async reducer function on each item in the given Array,
 *	where the reducer transforms an accumulator value based on each item iterated over.
 *	**Note:** because `reduce()` is order-sensitive, iteration is sequential.
 *
 *	> This is an asynchronous version of `Array.prototype.reduce()`
 *
 *	@param {Array} array			The Array to reduce
 *	@param {Function} reducer		Async function, gets passed `(accumulator, value, index, array)` and returns a new value for `accumulator`
 *	@param {*} [accumulator]		Optional initial accumulator value
 *	@returns final `accumulator` value
 *
 *	@example
 *	await reduce(
 *		['/foo', '/bar', '/baz'],
 *		async (accumulator, value) => {
 *			accumulator[v] = await fetch(value);
 *			return accumulator;
 *		},
 *		{}
 *	);
 */
export async function reduce(array, reducer, accumulator) {
	for (let i=0; i<array.length; i++) {
		accumulator = await reducer(accumulator, array[i], i, array);
	}
	return accumulator;
}


/** Invoke an async transform function on each item in the given Array **in parallel**,
 *	returning the resulting Array of mapped/transformed items.
 *
 *	> This is an asynchronous, parallelized version of `Array.prototype.map()`.
 *
 *	@function
 *	@name map
 *	@param {Array} array			The Array to map over
 *	@param {Function} mapper		Async function, gets passed `(value, index, array)`, returns the new value.
 *	@returns {Array} resulting mapped/transformed values.
 *
 *	@example
 *	await map(
 *		['foo', 'baz'],
 *		async v => await fetch(v)
 *	)
 */
export { map };


/** Invoke an async filter function on each item in the given Array **in parallel**,
 *	returning an Array of values for which the filter function returned a truthy value.
 *
 *	> This is an asynchronous, parallelized version of `Array.prototype.filter()`.
 *
 *	@param {Array} array			The Array to filter
 *	@param {Function} filterer		Async function. Gets passed `(value, index, array)`, returns true to keep the value in the resulting filtered Array.
 *	@returns {Array} resulting filtered values
 *
 *	@example
 *	await filter(
 *		['foo', 'baz'],
 *		async v => (await fetch(v)).ok
 *	)
 */
export const filter = baseMap('filter');


/** Invoke an async function on each item in the given Array **in parallel**,
 *  returning the first element predicate returns truthy for.
 *
 *	> This is an asynchronous, parallelized version of `Array.prototype.find()`.
 *
 *	@param {Array} array			The Array to find
 *	@param {Function} predicate		Async function. Gets passed `(value, index, array)`, returns true to be the find result.
 *	@returns {*} resulting find value
 *
 *	@example
 *	await find(
 *		['foo', 'baz', 'root'],
 *		async v => (await fetch(v)).name === 'baz'
 *	)
 */
export const find = baseMap('find');


/** Checks if predicate returns truthy for **all** elements of collection **in parallel**.
 *
 *	> This is an asynchronous, parallelized version of `Array.prototype.every()`.
 *
*	@param {Array} array			The Array to iterate over.
 *	@param {Function} predicate		Async function. Gets passed `(value, index, array)`, The function invoked per iteration.
 *	@returns {Boolean} Returns true if **all** element passes the predicate check, else false.
 *
 *	@example
 *	await every(
 *		[2, 3],
 *		async v => (await fetch(v)).ok
 *	)
 */
export const every = baseMap('every');


/** Checks if predicate returns truthy for **any** element of collection **in parallel**.
 *
 *	> This is an asynchronous, parallelized version of `Array.prototype.some()`.
 *
 *	@param {Array} array			The Array to iterate over.
 *	@param {Function} filterer		Async function. Gets passed `(value, index, array)`, The function invoked per iteration.
 *	@returns {Boolean} Returns true if **any** element passes the predicate check, else false.
 *
 *	@example
 *	await some(
 *		['foo', 'baz'],
 *		async v => (await fetch(v)).ok
 *	)
 */
export const some = baseMap('some');


/** Invoke all async functions in an Array or Object **in parallel**, returning the result.
 *	@param {Array<Function>|Object<Function>} list		Array/Object with values that are async functions to invoke.
 *	@returns {Array|Object} same structure as `list` input, but with values now resolved.
 *
 *	@example
 *	await parallel([
 *		async () => await fetch('foo'),
 *		async () => await fetch('baz')
 *	])
 */
export async function parallel(list) {
	return await Promise.all(resolve(list));
}


/** Invoke all async functions in an Array or Object **sequentially**, returning the result.
 *	@param {Array<Function>|Object<Function>} list		Array/Object with values that are async functions to invoke.
 *	@returns {Array|Object} same structure as `list` input, but with values now resolved.
 *
 *	@example
 *	await series([
 *		async () => await fetch('foo'),
 *		async () => await fetch('baz')
 *	])
 */
export async function series(list) {
	return reduce(list, pushReducer, []);
}
