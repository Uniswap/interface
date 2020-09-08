# babel-plugin-dev-expression [![npm version](https://badge.fury.io/js/babel-plugin-dev-expression.svg)](https://badge.fury.io/js/babel-plugin-dev-expression)

A mirror of Facebook's dev-expression Babel plugin.

This plugin reduces or eliminates development checks from production code.

## `__DEV__`

Replaces

```js
__DEV__
```

with

```js
process.env.NODE_ENV !== 'production'
```

**Note:** The `dev-expression` transform does not run when `NODE_ENV` is `test`. As such, if you use `__DEV__`, you will need to define it as a global constant in your test environment.

## `invariant`

Replaces

```js
invariant(condition, argument, argument);
```

with

```js
if (!condition) {
  if ("production" !== process.env.NODE_ENV) {
    invariant(false, argument, argument);
  } else {
    invariant(false);
  }
}
```

Recommended for use with https://github.com/zertosh/invariant or smaller https://github.com/alexreardon/tiny-invariant.

## `warning`

Replaces

```js
warning(condition, argument, argument);
```

with

```js
if ("production" !== process.env.NODE_ENV) {
  warning(condition, argument, argument);
}
```

Recommended for use with https://github.com/r3dm/warning or smaller https://github.com/alexreardon/tiny-warning.
