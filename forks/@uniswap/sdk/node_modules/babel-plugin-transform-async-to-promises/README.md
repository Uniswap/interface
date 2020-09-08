babel-plugin-transform-async-to-promises
========================================

Babel plugin to transform `async` functions containing `await` expressions to the equivalent chain of `Promise` calls with use of minimal helper functions.

[![Build Status](https://travis-ci.org/rpetrich/babel-plugin-transform-async-to-promises.svg?branch=master)](https://travis-ci.org/rpetrich/babel-plugin-transform-async-to-promises)

### Input:

```javascript
async function fetchAsObjectURL(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}
```

### Output:

```javascript
const fetchAsObjectURL = _async(function(url) {
	return _await(fetch(url), function(response) {
		return _await(response.blob(), URL.createObjectURL);
	});
});
```

### Output with `hoist` enabled:

```javascript
function _response$blob(response) {
	return _await(response.blob(), URL.createObjectURL);
}
const fetchAsObjectURL = _async(function(url) {
	return _await(fetch(url), _response$blob);
});
```

### Output with `inlineHelpers` enabled:

```javascript
const fetchAsObjectURL = function(url) {
	try {
		return Promise.resolve(fetch(url)).then(function(response) {
			return Promise.resolve(response.blob()).then(URL.createObjectURL);
		});
	} catch(e) {
		return Promise.reject(e);
	}
}
```

## JavaScript Language Features

### Full Support
- `async`/`await`
- `for`/`while`/`do` loops (including loops that would exhaust stack if dispatched recursively)
- `switch` statements (including fallthrough and `default` cases)
- conditional expressions
- logical expressions
- `try`/`catch`
- `break`/`continue` statements (on both loops and labeled statements)
- `throw` expressions
- Function hoisting
- Variable hoisting
- Arrow functions
- Methods
- `arguments`
- `this`
- Proper member dereference order of operations
- Standards-compliant event loop scheduling

### Partial Support
- `Function.length`: `async` functions will often return a length of 0 (when the `_async` wrapper is used)

### No support
- `eval`: impossible to support without deep hooks into the runtime
- Async generator functions: not implemented or planned
- `Function.name`: rewrite pass removes function name instrumentation
- `new AsyncFunction(...)`: impossible to support without shipping babel and the plugin in the output
