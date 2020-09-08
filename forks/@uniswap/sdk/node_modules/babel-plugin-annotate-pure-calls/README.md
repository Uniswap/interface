# babel-plugin-annotate-pure-calls

[![npm version](https://img.shields.io/npm/v/babel-plugin-annotate-pure-calls.svg)](https://www.npmjs.com/package/babel-plugin-annotate-pure-calls)
[![Build Status](https://travis-ci.org/Andarist/babel-plugin-annotate-pure-calls.svg?branch=master)](https://travis-ci.org/Andarist/babel-plugin-annotate-pure-calls)
[![npm](https://img.shields.io/npm/dm/babel-plugin-annotate-pure-calls.svg)](https://www.npmjs.com/package/babel-plugin-annotate-pure-calls)

This plugins helps with automatic **#\_\_PURE\_\_** annotation insertion. It add the comment to
[top level call](#top-level-calls) expressions and new expressions in assignment contexts (those are considered by the
plugin as **side effect free**). This helps [UglifyJS](https://github.com/mishoo/UglifyJS2) to perform dead code
elimination more efficiently and therefore reduces the bundle sizes for the consumers.

**NOTE:** It might break your code, so the caution is advised. Target audience for the plugin are libraries, which in
vast major of use cases do not introduce side effects in top level calls. That doesn't mean that application bundles
cannot benefit from the plugin.

## Pure calls

```js
// pure call
var inc = add(1)

// clearly impure - no assignment context
mutate({ prop: 'value' })
```

## Top level calls

Top level call (in terms of this plugin) is one that gets executed during script initialization. So it is every call
located at the root of a file, but also a call in an IIFE that gets executed at startup (including nested ones).

```js
var a = topLevelCall()

b = function() {
  noTopLevelCall()
}

topLevelIIFEs = (function() {
  var c = (function() {
    var d = (function() {
      var e = topLevelCall()
    })()
  })()
})()
```

## Installation

```sh
npm install --save-dev babel-plugin-annotate-pure-calls
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["annotate-pure-calls"]
}
```

### Via CLI

```sh
babel --plugins annotate-pure-calls script.js
```

### Via Node API

```javascript
require('babel-core').transform('var inc = add(1)', {
  plugins: ['annotate-pure-calls'],
})
```

### Usage with babel@6

The plugin works with babel@6, you might see unmet peer dependency warning though. If you want to get rid of it, please
install `@babel/core@6.0.0-bridge.1`.

## Similar projects

- [annotate-pure-call-in-variable-declarator](https://github.com/morlay/babel-plugin-annotate-pure-call-in-variable-declarator)
