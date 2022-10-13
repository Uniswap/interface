# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.3] - 2021-03-10

### Fixed

- Correctly type `ethErrors` getter function argument objects as optional ([#36](https://github.com/MetaMask/eth-rpc-errors/pull/36))

## [4.0.2] - 2020-11-17

### Changed

- Mark the `data` property of `EthereumRpcError` and `EthereumProviderError` as optional rather than `T | undefined` ([#34](https://github.com/MetaMask/eth-rpc-errors/pull/34))

### Fixed

- Correctly type `SerializedEthereumRpcError.stack` as `string`, if present ([#34](https://github.com/MetaMask/eth-rpc-errors/pull/34))

## [4.0.1] - 2020-11-03

### Changed

- Updated README.md ([#30](https://github.com/MetaMask/eth-rpc-errors/pull/30))

## [4.0.0] - 2020-11-02

### Changed

- **BREAKING:** `ERROR_CODES` export renamed to `errorCodes` ([#28](https://github.com/MetaMask/eth-rpc-errors/pull/28))
- **BREAKING:** `ethErrors` getters will now throw an error if passed a truthy, non-string `message` ([#28](https://github.com/MetaMask/eth-rpc-errors/pull/28))
- Updated TypeScript types for all exports ([#28](https://github.com/MetaMask/eth-rpc-errors/pull/28))

## [3.0.0] - 2020-07-29

### Changed

- **BREAKING:** Second argument of `serializeError` is now an options object ([#22](https://github.com/MetaMask/eth-rpc-errors/pull/22))
- Error stacks are no longer serialized by default by `serializeError` ([#22](https://github.com/MetaMask/eth-rpc-errors/pull/22))

## [2.1.1] - 2020-05-12

### Changed

- Prevent unnecessary files from being published ([#17](https://github.com/MetaMask/eth-rpc-errors/pull/17))

## [2.1.0] - 2020-05-11

### Added

- New/missing errors:
  - `ethErrors.provider` ([EIP-1193](https://eips.ethereum.org/EIPS/eip-1474#provider-errors))
    - `.disconnected`, `4900`
    - `.chainDisconnected`, `4901`
  - `ethErrors.rpc` ([EIP-1474](https://eips.ethereum.org/EIPS/eip-1474#error-codes))
    - `.limitExceeded`, `-32005`

### Changed

- Rename package to `eth-rpc-errors`

## [2.0.2] - 2020-02-12

### Changed

- Fix faulty null checks throughout codebase ([764832d](https://github.com/MetaMask/eth-rpc-errors/commit/764832d777f9274ca5bb9a6efa6958db2b640952))

## [2.0.1] - 2020-01-31

### Added

- Error codes in docstrings ([5452001](https://github.com/MetaMask/eth-rpc-errors/commit/545200100af05aeade62ba6b736f5080a6891bc4))

## [2.0.0] - 2019-09-26

- **Exports**
  - `errors` renamed `ethErrors`
  - `JsonRpcError` renamed `EthereumRpcError`
  - `EthJsonRpcError` renamed `EthereumProviderError`
    - It is still a subclass of `EthereumRpcError`
  - **TypeScript**
    - Renamed affected interfaces
- `ethErrors`
  - Added missing
  [EIP-1474 errors](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1474.md)
    - Added corresponding codes and messages
  - **Namespacing**
    - EIP-1474 (which includes JSON RPC 2.0) errors now namespaced under `ethErrors.rpc`
      - JSON RPC 2.0 errors were formerly under `errors.jsonRpc`
    - EIP-1193 errors now namespaced under `ethErrors.provider`
      - Formerly under `errors.eth`
  - Most error getters now take a single, *optional* `opts` argument, which
  is either a string or an object
    - If a string, it becomes the error message
    - If an object, it should have the form: `{ message?: string, data?: any }`
    - **Special Cases**
      - `ethErrors.rpc.server` must receive a single object of the form:
        - `{ code: number, message?: string, data?: any }
      - `ethErrors.provider.custom` must receive a single of the form:
        - `{ code: number, message: string, data?: any }
- **TypeScript**
  - Updated affected interfaces

## [1.1.0] - 2019-09-16

- `serializeError`
  - If the object passed to the function has a `.message` property,
  it will preferred over the `.message` property of the fallback error when
  creating the returned serialized error object

[Unreleased]:https://github.com/MetaMask/controllers/compare/v4.0.2...HEAD
[4.0.2]:https://github.com/MetaMask/controllers/compare/v4.0.1...v4.0.2
[4.0.1]:https://github.com/MetaMask/controllers/compare/v4.0.0...v4.0.1
[4.0.0]:https://github.com/MetaMask/controllers/compare/v3.0.0...v4.0.0
[3.0.0]:https://github.com/MetaMask/controllers/compare/v2.1.1...v3.0.0
[2.1.1]:https://github.com/MetaMask/controllers/compare/v2.1.0...v2.1.1
[2.1.0]:https://github.com/MetaMask/controllers/compare/v2.0.2...v2.1.0
[2.0.2]:https://github.com/MetaMask/controllers/compare/v2.0.1...v2.0.2
[2.0.1]:https://github.com/MetaMask/controllers/compare/v2.0.0...v2.0.1
