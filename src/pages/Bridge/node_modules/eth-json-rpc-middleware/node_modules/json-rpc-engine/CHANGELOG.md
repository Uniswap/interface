# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.4.0] - 2020-11-07

### Changed

- Make the TypeScript types not terrible ([#66](https://github.com/MetaMask/json-rpc-engine/pull/66), [#67](https://github.com/MetaMask/json-rpc-engine/pull/67))

## [5.3.0] - 2020-07-30

### Changed

- Response object errors no longer include a `stack` property

## [5.2.0] - 2020-07-24

### Added

- Promise signatures for `engine.handle` ([#55](https://github.com/MetaMask/json-rpc-engine/pull/55))
  - So, in addition to `engine.handle(request, callback)`, you can do e.g. `await engine.handle(request)`.

### Changed

- Remove `async` and `promise-to-callback` dependencies
  - These dependencies were used internally for middleware flow control.
  They have been replaced with Promises and native `async`/`await`, which means that some operations are _no longer_ eagerly executed.
  This change may affect consumers that depend on the eager execution of middleware _during_ request processing, _outside of_ middleware functions and request handlers.
    - In general, it is a bad practice to work with state that depends on middleware execution, while the middleware are executing.
