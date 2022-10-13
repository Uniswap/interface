# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0]

### Changed

- Second argument of `serializeError` is now an options object ([#22](https://github.com/MetaMask/eth-rpc-errors/pull/22))
- Error stacks are no longer serialized by default by `serializeError` ([#22](https://github.com/MetaMask/eth-rpc-errors/pull/22))

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

## [2.0.0]

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

## [1.1.0]

- `serializeError`
  - If the object passed to the function has a `.message` property,
  it will preferred over the `.message` property of the fallback error when
  creating the returned serialized error object
