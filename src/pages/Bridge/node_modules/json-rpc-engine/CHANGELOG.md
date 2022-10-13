# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.1.0] - 2020-11-20

### Added

- Add `PendingJsonRpcResponse` interface for use in middleware ([#75](https://github.com/MetaMask/json-rpc-engine/pull/75))

### Changed

- Use `async`/`await` and `try`/`catch` instead of Promise methods everywhere ([#74](https://github.com/MetaMask/json-rpc-engine/pull/74))
  - Consumers may notice improved stack traces on certain platforms.

## [6.0.0] - 2020-11-19

### Added

- Add docstrings for public `JsonRpcEngine` methods ([#70](https://github.com/MetaMask/json-rpc-engine/pull/70))

### Changed

- **(BREAKING)** Refactor exports ([#69](https://github.com/MetaMask/json-rpc-engine/pull/69))
  - All exports are now named, and available via the package entry point.
  - All default exports have been removed.
- **(BREAKING)** Convert `asMiddleware` to instance method ([#69](https://github.com/MetaMask/json-rpc-engine/pull/69))
  - The `asMiddleware` export has been removed.
- **(BREAKING)** Add runtime typechecks to `JsonRpcEngine.handle()`, and error responses if they fail ([#70](https://github.com/MetaMask/json-rpc-engine/pull/70))
  - Requests will now error if:
    - The request is not a plain object, or if the `method` property is not a `string`. Empty strings are allowed.
    - A `next` middleware callback is called with a truthy, non-function parameter.
- Migrate to TypeScript ([#69](https://github.com/MetaMask/json-rpc-engine/pull/69))
- Hopefully improve stack traces by removing uses of `Promise.then` and `.catch` internally ([#70](https://github.com/MetaMask/json-rpc-engine/pull/70))
- Make some internal `JsonRpcEngine` methods `static` ([#71](https://github.com/MetaMask/json-rpc-engine/pull/71))

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

[Unreleased]:https://github.com/MetaMask/json-rpc-engine/compare/v6.1.0...HEAD
[6.1.0]:https://github.com/MetaMask/json-rpc-engine/compare/v6.0.0...v6.1.0
[6.0.0]:https://github.com/MetaMask/json-rpc-engine/compare/v5.4.0...v6.0.0
[5.4.0]:https://github.com/MetaMask/json-rpc-engine/compare/v5.3.0...v5.4.0
[5.3.0]:https://github.com/MetaMask/json-rpc-engine/compare/v5.2.0...v5.3.0
[5.2.0]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.8...v5.2.0
[5.1.8]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.6...v5.1.8
[5.1.6]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.5...v5.1.6
[5.1.5]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.4...v5.1.5
[5.1.4]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.3...v5.1.4
[5.1.3]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.1...v5.1.3
[5.1.1]:https://github.com/MetaMask/json-rpc-engine/compare/v5.1.0...v5.1.1
[5.1.0]:https://github.com/MetaMask/json-rpc-engine/compare/v5.0.0...v5.1.0
[5.0.0]:https://github.com/MetaMask/json-rpc-engine/compare/v4.0.0...v5.0.0
