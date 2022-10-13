# eth-rpc-errors

Ethereum RPC errors, including for
[Ethereum JSON RPC](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1474.md)
and
[Ethereum Provider](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md),
and [making unknown errors compliant with either spec](#parsing-unknown-errors).

## Basic Usage

In TypeScript or JavaScript:

```js
import { ethErrors } from 'eth-rpc-errors'

throw ethErrors.provider.unauthorized()
// or
throw ethErrors.provider.unauthorized('my custom message')
```

## Supported Errors

- Ethereum JSON RPC
  - Per [EIP-1474](https://eips.ethereum.org/EIPS/eip-1474#error-codes)
    - This includes all
    [JSON RPC 2.0 errors](https://www.jsonrpc.org/specification#error_object)
- Ethereum Provider errors
  - Per [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193#provider-errors)
    - Does **not** yet support [`CloseEvent` errors or status codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes).

## Usage

Installation: `npm install eth-rpc-errors` or `yarn add eth-rpc-errors`

`import` or `require` as normal (no default export).

The package is implemented in TypeScript, and all exports are typed.

### Errors API

```js
import { ethErrors } from 'eth-rpc-errors'

// Ethereum RPC errors are namespaced under "ethErrors.rpc"
response.error = ethErrors.rpc.methodNotFound({
  message: optionalCustomMessage, data: optionalData
})

// Provider errors namespaced under ethErrors.provider
response.error = ethErrors.provider.unauthorized({
  message: optionalCustomMessage, data: optionalData
})

// each error getter takes a single "opts" argument
// for most errors, this can be replaced with a single string, which becomes
// the error message
response.error = ethErrors.provider.unauthorized(customMessage)

// if an error getter accepts a single string, all arguments can be omitted
response.error = ethErrors.provider.unauthorized()
response.error = ethErrors.provider.unauthorized({})

// omitting the message will produce an error with a default message per
// the relevant spec

// omitting the data argument will produce an error without a
// "data" property

// the JSON RPC 2.0 server error requires a valid code
response.error = ethErrors.rpc.server({
  code: -32031
})

// custom Ethereum Provider errors require a valid code and message
// valid codes are integers i such that: 1000 <= i <= 4999
response.error = ethErrors.provider.custom({
  code: 1001, message: 'foo'
})
```

### Parsing Unknown Errors

```js
// this is useful for ensuring your errors are standardized
import { serializeError } from 'eth-rpc-errors'

// if the argument is not a valid error per any supported spec,
// it will be added as error.data.originalError
response.error = serializeError(maybeAnError)

// you can add a custom fallback error code and message if desired
const fallbackError = { code: 4999, message: 'My custom error.' }
response.error = serializeError(maybeAnError, fallbackError)

// Note: if the original error has a "message" property, it will take
// precedence over the fallback error's message

// the default fallback is:
{
  code: -32603,
  message: 'Internal JSON-RPC error.'
}
```

### Other Exports

```js
/**
 * Classes
 */
import { EthereumRpcError, EthereumProviderError } from 'eth-rpc-errors'

/**
 * getMessageFromCode and errorCodes
 */
import { getMessageFromCode, errorCodes } from 'eth-rpc-errors'

// get the default message string for the given code, or a fallback message if
// no message exists for the given code
const message1 = getMessageFromCode(someCode)

// you can specify your own fallback message
const message2 = getMessageFromCode(someCode, myFallback)
// it can be anything, use at your own peril
const message3 = getMessageFromCode(someCode, null)

// {
//   rpc: { [errorName]: code, ... },
//   provider: { [errorName]: code, ... },
// }
const code1 = errorCodes.rpc.parse
const code2 = errorCodes.provider.userRejectedRequest

// all codes in errorCodes have default messages
const message4 = getMessageFromCode(code1)
const message5 = getMessageFromCode(code2)
```

## License

MIT
