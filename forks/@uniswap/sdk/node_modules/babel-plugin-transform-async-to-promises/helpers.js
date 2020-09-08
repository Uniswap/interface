// A type of promise-like that resolves synchronously and supports only one observer
export const _Pact = /*#__PURE__*/(function() {
	function _Pact() {}
	_Pact.prototype.then = function(onFulfilled, onRejected) {
		const result = new _Pact();
		const state = this.s;
		if (state) {
			const callback = state & 1 ? onFulfilled : onRejected;
			if (callback) {
				try {
					_settle(result, 1, callback(this.v));
				} catch (e) {
					_settle(result, 2, e);
				}
				return result;
			} else {
				return this;
			}
		}
		this.o = function(_this) {
			try {
				const value = _this.v;
				if (_this.s & 1) {
					_settle(result, 1, onFulfilled ? onFulfilled(value) : value);
				} else if (onRejected) {
					_settle(result, 1, onRejected(value));
				} else {
					_settle(result, 2, value);
				}
			} catch (e) {
				_settle(result, 2, e);
			}
		};
		return result;
	}
	return _Pact;
})();

// Settles a pact synchronously
export function _settle(pact, state, value) {
	if (!pact.s) {
		if (value instanceof _Pact) {
			if (value.s) {
				if (state & 1) {
					state = value.s;
				}
				value = value.v;
			} else {
				value.o = _settle.bind(null, pact, state);
				return;
			}
		}
		if (value && value.then) {
			value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
			return;
		}
		pact.s = state;
		pact.v = value;
		const observer = pact.o;
		if (observer) {
			observer(pact);
		}
	}
}

export function _isSettledPact(thenable) {
	return thenable instanceof _Pact && thenable.s & 1;
}

// Converts argument to a function that always returns a Promise
export function _async(f) {
	return function() {
		for (var args = [], i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}
		try {
			return Promise.resolve(f.apply(this, args));
		} catch(e) {
			return Promise.reject(e);
		}
	}
}

// Awaits on a value that may or may not be a Promise (equivalent to the await keyword in ES2015, with continuations passed explicitly)
export function _await(value, then, direct) {
	if (direct) {
		return then ? then(value) : value;
	}
	if (!value || !value.then) {
		value = Promise.resolve(value);
	}
	return then ? value.then(then) : value;
}

// Awaits on a value that may or may not be a Promise, then ignores it
export function _awaitIgnored(value, direct) {
	if (!direct) {
		return value && value.then ? value.then(_empty) : Promise.resolve();
	}
}

// Proceeds after a value has resolved, or proceeds immediately if the value is not thenable
export function _continue(value, then) {
	return value && value.then ? value.then(then) : then(value);
}

// Proceeds after a value has resolved, or proceeds immediately if the value is not thenable
export function _continueIgnored(value) {
	if (value && value.then) {
		return value.then(_empty);
	}
}

// Asynchronously iterate through an object that has a length property, passing the index as the first argument to the callback (even as the length property changes)
export function _forTo(array, body, check) {
	var i = -1, pact, reject;
	function _cycle(result) {
		try {
			while (++i < array.length && (!check || !check())) {
				result = body(i);
				if (result && result.then) {
					if (_isSettledPact(result)) {
						result = result.v;
					} else {
						result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
						return;
					}
				}
			}
			if (pact) {
				_settle(pact, 1, result);
			} else {
				pact = result;
			}
		} catch (e) {
			_settle(pact || (pact = new _Pact()), 2, e);
		}
	}
	_cycle();
	return pact;
}

// Asynchronously iterate through an object's properties (including properties inherited from the prototype)
// Uses a snapshot of the object's properties
export function _forIn(target, body, check) {
	var keys = [];
	for (var key in target) {
		keys.push(key);
	}
	return _forTo(keys, function(i) { return body(keys[i]); }, check);
}

// Asynchronously iterate through an object's own properties (excluding properties inherited from the prototype)
// Uses a snapshot of the object's properties
export function _forOwn(target, body, check) {
	var keys = [];
	for (var key in target) {
		if (Object.prototype.hasOwnProperty.call(target, key)) {
			keys.push(key);
		}
	}
	return _forTo(keys, function(i) { return body(keys[i]); }, check);
}

export const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

// Asynchronously iterate through an object's values
// Uses for...of if the runtime supports it, otherwise iterates until length on a copy
export function _forOf(target, body, check) {
	if (typeof target[_iteratorSymbol] === "function") {
		var iterator = target[_iteratorSymbol](), step, pact, reject;
		function _cycle(result) {
			try {
				while (!(step = iterator.next()).done && (!check || !check())) {
					result = body(step.value);
					if (result && result.then) {
						if (_isSettledPact(result)) {
							result = result.v;
						} else {
							result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
							return;
						}
					}
				}
				if (pact) {
					_settle(pact, 1, result);
				} else {
					pact = result;
				}
			} catch (e) {
				_settle(pact || (pact = new _Pact()), 2, e);
			}
		}
		_cycle();
		if (iterator.return) {
			var _fixup = function(value) {
				try {
					if (!step.done) {
						iterator.return();
					}
				} catch(e) {
				}
				return value;
			}
			if (pact && pact.then) {
				return pact.then(_fixup, function(e) {
					throw _fixup(e);
				});
			}
			_fixup();
		}
		return pact;
	}
	// No support for Symbol.iterator
	if (!("length" in target)) {
		throw new TypeError("Object is not iterable");
	}
	// Handle live collections properly
	var values = [];
	for (var i = 0; i < target.length; i++) {
		values.push(target[i]);
	}
	return _forTo(values, function(i) { return body(values[i]); }, check);
}

export const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

// Asynchronously iterate on a value using it's async iterator if present, or its synchronous iterator if missing
export function _forAwaitOf(target, body, check) {
	if (typeof target[_asyncIteratorSymbol] === "function") {
		var pact = new _Pact();
		var iterator = target[_asyncIteratorSymbol]();
		iterator.next().then(_resumeAfterNext).then(void 0, _reject);
		return pact;
		function _resumeAfterBody(result) {
			if (check && check()) {
				return _settle(pact, 1, iterator.return ? iterator.return().then(function() { return result; }) : result);
			}
			iterator.next().then(_resumeAfterNext).then(void 0, _reject);
		}
		function _resumeAfterNext(step) {
			if (step.done) {
				_settle(pact, 1);
			} else {
				Promise.resolve(body(step.value)).then(_resumeAfterBody).then(void 0, _reject);
			}
		}
		function _reject(error) {
			_settle(pact, 2, iterator.return ? iterator.return().then(function() { return error; }) : error);
		}
	}
	return Promise.resolve(_forOf(target, function(value) { return Promise.resolve(value).then(body); }, check));
}

// Asynchronously implement a generic for loop
export function _for(test, update, body) {
	var stage;
	for (;;) {
		var shouldContinue = test();
		if (_isSettledPact(shouldContinue)) {
			shouldContinue = shouldContinue.v;
		}
		if (!shouldContinue) {
			return result;
		}
		if (shouldContinue.then) {
			stage = 0;
			break;
		}
		var result = body();
		if (result && result.then) {
			if (_isSettledPact(result)) {
				result = result.s;
			} else {
				stage = 1;
				break;
			}
		}
		if (update) {
			var updateValue = update();
			if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
				stage = 2;
				break;
			}
		}
	}
	var pact = new _Pact();
	var reject = _settle.bind(null, pact, 2);
	(stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
	return pact;
	function _resumeAfterBody(value) {
		result = value;
		do {
			if (update) {
				updateValue = update();
				if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
					updateValue.then(_resumeAfterUpdate).then(void 0, reject);
					return;
				}
			}
			shouldContinue = test();
			if (!shouldContinue || (_isSettledPact(shouldContinue) && !shouldContinue.v)) {
				_settle(pact, 1, result);
				return;
			}
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
				return;
			}
			result = body();
			if (_isSettledPact(result)) {
				result = result.v;
			}
		} while (!result || !result.then);
		result.then(_resumeAfterBody).then(void 0, reject);
	}
	function _resumeAfterTest(shouldContinue) {
		if (shouldContinue) {
			result = body();
			if (result && result.then) {
				result.then(_resumeAfterBody).then(void 0, reject);
			} else {
				_resumeAfterBody(result);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
	function _resumeAfterUpdate() {
		if (shouldContinue = test()) {
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
			} else {
				_resumeAfterTest(shouldContinue);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
}

// Asynchronously implement a do ... while loop
export function _do(body, test) {
	var awaitBody;
	do {
		var result = body();
		if (result && result.then) {
			if (_isSettledPact(result)) {
				result = result.v;
			} else {
				awaitBody = true;
				break;
			}
		}
		var shouldContinue = test();
		if (_isSettledPact(shouldContinue)) {
			shouldContinue = shouldContinue.v;
		}
		if (!shouldContinue) {
			return result;
		}
	} while (!shouldContinue.then);
	const pact = new _Pact();
	const reject = _settle.bind(null, pact, 2);
	(awaitBody ? result.then(_resumeAfterBody) : shouldContinue.then(_resumeAfterTest)).then(void 0, reject);
	return pact;
	function _resumeAfterBody(value) {
		result = value;
		for (;;) {
			shouldContinue = test();
			if (_isSettledPact(shouldContinue)) {
				shouldContinue = shouldContinue.v;
			}
			if (!shouldContinue) {
				break;
			}
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
				return;
			}
			result = body();
			if (result && result.then) {
				if (_isSettledPact(result)) {
					result = result.v;
				} else {
					result.then(_resumeAfterBody).then(void 0, reject);
					return;
				}
			}
		}
		_settle(pact, 1, result);
	}
	function _resumeAfterTest(shouldContinue) {
		if (shouldContinue) {
			do {
				result = body();
				if (result && result.then) {
					if (_isSettledPact(result)) {
						result = result.v;
					} else {
						result.then(_resumeAfterBody).then(void 0, reject);
						return;
					}
				}
				shouldContinue = test();
				if (_isSettledPact(shouldContinue)) {
					shouldContinue = shouldContinue.v;
				}
				if (!shouldContinue) {
					_settle(pact, 1, result);
					return;
				}
			} while (!shouldContinue.then);
			shouldContinue.then(_resumeAfterTest).then(void 0, reject);
		} else {
			_settle(pact, 1, result);
		}
	}
}

// Asynchronously implement a switch statement
export function _switch(discriminant, cases) {
	var dispatchIndex = -1;
	var awaitBody;
	outer: {
		for (var i = 0; i < cases.length; i++) {
			var test = cases[i][0];
			if (test) {
				var testValue = test();
				if (testValue && testValue.then) {
					break outer;
				}
				if (testValue === discriminant) {
					dispatchIndex = i;
					break;
				}
			} else {
				// Found the default case, set it as the pending dispatch case
				dispatchIndex = i;
			}
		}
		if (dispatchIndex !== -1) {
			do {
				var body = cases[dispatchIndex][1];
				while (!body) {
					dispatchIndex++;
					body = cases[dispatchIndex][1];
				}
				var result = body();
				if (result && result.then) {
					awaitBody = true;
					break outer;
				}
				var fallthroughCheck = cases[dispatchIndex][2];
				dispatchIndex++;
			} while (fallthroughCheck && !fallthroughCheck());
			return result;
		}
	}
	const pact = new _Pact();
	const reject = _settle.bind(null, pact, 2);
	(awaitBody ? result.then(_resumeAfterBody) : testValue.then(_resumeAfterTest)).then(void 0, reject);
	return pact;
	function _resumeAfterTest(value) {
		for (;;) {
			if (value === discriminant) {
				dispatchIndex = i;
				break;
			}
			if (++i === cases.length) {
				if (dispatchIndex !== -1) {
					break;
				} else {
					_settle(pact, 1, result);
					return;
				}
			}
			test = cases[i][0];
			if (test) {
				value = test();
				if (value && value.then) {
					value.then(_resumeAfterTest).then(void 0, reject);
					return;
				}
			} else {
				dispatchIndex = i;
			}
		}
		do {
			var body = cases[dispatchIndex][1];
			while (!body) {
				dispatchIndex++;
				body = cases[dispatchIndex][1];
			}
			var result = body();
			if (result && result.then) {
				result.then(_resumeAfterBody).then(void 0, reject);
				return;
			}
			var fallthroughCheck = cases[dispatchIndex][2];
			dispatchIndex++;
		} while (fallthroughCheck && !fallthroughCheck());
		_settle(pact, 1, result);
	}
	function _resumeAfterBody(result) {
		for (;;) {
			var fallthroughCheck = cases[dispatchIndex][2];
			if (!fallthroughCheck || fallthroughCheck()) {
				break;
			}
			dispatchIndex++;
			var body = cases[dispatchIndex][1];
			while (!body) {
				dispatchIndex++;
				body = cases[dispatchIndex][1];
			}
			result = body();
			if (result && result.then) {
				result.then(_resumeAfterBody).then(void 0, reject);
				return;
			}
		}
		_settle(pact, 1, result);
	}
}

// Asynchronously call a function and pass the result to explicitly passed continuations
export function _call(body, then, direct) {
	if (direct) {
		return then ? then(body()) : body();
	}
	try {
		var result = Promise.resolve(body());
		return then ? result.then(then) : result;
	} catch (e) {
		return Promise.reject(e);
	}
}

// Asynchronously call a function and swallow the result
export function _callIgnored(body, direct) {
	return _call(body, _empty, direct);
}

// Asynchronously call a function and pass the result to explicitly passed continuations
export function _invoke(body, then) {
	var result = body();
	if (result && result.then) {
		return result.then(then);
	}
	return then(result);
}

// Asynchronously call a function and swallow the result
export function _invokeIgnored(body) {
	var result = body();
	if (result && result.then) {
		return result.then(_empty);
	}
}

// Asynchronously call a function and send errors to recovery continuation
export function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

// Asynchronously await a promise and pass the result to a finally continuation
export function _finallyRethrows(body, finalizer) {
	try {
		var result = body();
	} catch (e) {
		return finalizer(true, e);
	}
	if (result && result.then) {
		return result.then(finalizer.bind(null, false), finalizer.bind(null, true));
	}
	return finalizer(false, result);
}

// Asynchronously await a promise and invoke a finally continuation that always overrides the result
export function _finally(body, finalizer) {
	try {
		var result = body();
	} catch (e) {
		return finalizer();
	}
	if (result && result.then) {
		return result.then(finalizer, finalizer);
	}
	return finalizer();
}

// Rethrow or return a value from a finally continuation
export function _rethrow(thrown, value) {
	if (thrown)
		throw value;
	return value;
}

// Empty function to implement break and other control flow that ignores asynchronous results
export function _empty() {
}

// Sentinel value for early returns in generators 
export const _earlyReturn = /*#__PURE__*/ {};

// Asynchronously call a function and send errors to recovery continuation, skipping early returns
export function _catchInGenerator(body, recover) {
	return _catch(body, function(e) {
		if (e === _earlyReturn) {
			throw e;
		}
		return recover(e);
	});
}

// Asynchronous generator class; accepts the entrypoint of the generator, to which it passes itself when the generator should start
export const _AsyncGenerator = /*#__PURE__*/(function() {
	function _AsyncGenerator(entry) {
		this._entry = entry;
		this._pact = null;
		this._resolve = null;
		this._return = null;
		this._promise = null;
	}

	function _wrapReturnedValue(value) {
		return { value: value, done: true };
	}
	function _wrapYieldedValue(value) {
		return { value: value, done: false };
	}

	_AsyncGenerator.prototype._yield = function(value) {
		// Yield the value to the pending next call
		this._resolve(value && value.then ? value.then(_wrapYieldedValue) : _wrapYieldedValue(value));
		// Return a pact for an upcoming next/return/throw call
		return this._pact = new _Pact();
	};
	_AsyncGenerator.prototype.next = function(value) {
		// Advance the generator, starting it if it has yet to be started
		const _this = this;
		return _this._promise = new Promise(function (resolve) {
			const _pact = _this._pact;
			if (_pact === null) {
				const _entry = _this._entry;
				if (_entry === null) {
					// Generator is started, but not awaiting a yield expression
					// Abandon the next call!
					return resolve(_this._promise);
				}
				// Start the generator
				_this._entry = null;
				_this._resolve = resolve;
				function returnValue(value) {
					_this._resolve(value && value.then ? value.then(_wrapReturnedValue) : _wrapReturnedValue(value));
					_this._pact = null;
					_this._resolve = null;
				}
				var result = _entry(_this);
				if (result && result.then) {
					result.then(returnValue, function(error) {
						if (error === _earlyReturn) {
							returnValue(_this._return);
						} else {
							const pact = new _Pact();
							_this._resolve(pact);
							_this._pact = null;
							_this._resolve = null;
							_resolve(pact, 2, error);
						}
					});
				} else {
					returnValue(result);
				}
			} else {
				// Generator is started and a yield expression is pending, settle it
				_this._pact = null;
				_this._resolve = resolve;
				_settle(_pact, 1, value);
			}
		});
	};
	_AsyncGenerator.prototype.return = function(value) {
		// Early return from the generator if started, otherwise abandons the generator
		const _this = this;
		return _this._promise = new Promise(function (resolve) {
			const _pact = _this._pact;
			if (_pact === null) {
				if (_this._entry === null) {
					// Generator is started, but not awaiting a yield expression
					// Abandon the return call!
					return resolve(_this._promise);
				}
				// Generator is not started, abandon it and return the specified value
				_this._entry = null;
				return resolve(value && value.then ? value.then(_wrapReturnedValue) : _wrapReturnedValue(value));
			}
			// Settle the yield expression with a rejected "early return" value
			_this._return = value;
			_this._resolve = resolve;
			_this._pact = null;
			_settle(_pact, 2, _earlyReturn);
		});
	};
	_AsyncGenerator.prototype.throw = function(error) {
		// Inject an exception into the pending yield expression
		const _this = this;
		return _this._promise = new Promise(function (resolve, reject) {
			const _pact = _this._pact;
			if (_pact === null) {
				if (_this._entry === null) {
					// Generator is started, but not awaiting a yield expression
					// Abandon the throw call!
					return resolve(_this._promise);
				}
				// Generator is not started, abandon it and return a rejected Promise containing the error
				_this._entry = null;
				return reject(error);
			}
			// Settle the yield expression with the value as a rejection
			_this._resolve = resolve;
			_this._pact = null;
			_settle(_pact, 2, error);
		});
	};

	_AsyncGenerator.prototype[_asyncIteratorSymbol] = function() {
		return this;
	};
	
	return _AsyncGenerator;
})();
