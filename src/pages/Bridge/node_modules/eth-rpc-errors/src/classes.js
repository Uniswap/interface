
const safeStringify = require('fast-safe-stringify')

/**
 * @class JsonRpcError
 * Error subclass implementing JSON RPC 2.0 errors and Ethereum RPC errors
 * per EIP 1474.
 * Permits any integer error code.
 */
class EthereumRpcError extends Error {

  /**
   * Create an Ethereum JSON RPC error.
   *
   * @param {number} code - The integer error code.
   * @param {string} message - The string message.
   * @param {any} [data] - The error data.
   */
  constructor (code, message, data) {

    if (!Number.isInteger(code)) {
      throw new Error(
        '"code" must be an integer.',
      )
    }
    if (!message || typeof message !== 'string') {
      throw new Error(
        '"message" must be a nonempty string.',
      )
    }

    super(message)
    this.code = code
    if (data !== undefined) {
      this.data = data
    }
  }

  /**
   * Returns a plain object with all public class properties.
   *
   * @returns {object} The serialized error.
   */
  serialize () {
    const serialized = {
      code: this.code,
      message: this.message,
    }
    if (this.data !== undefined) {
      serialized.data = this.data
    }
    if (this.stack) {
      serialized.stack = this.stack
    }
    return serialized
  }

  /**
   * Return a string representation of the serialized error, omitting
   * any circular references.
   *
   * @returns {string} The serialized error as a string.
   */
  toString () {
    return safeStringify(
      this.serialize(),
      stringifyReplacer,
      2,
    )
  }
}

/**
 * @class EthereumRpcError
 * Error subclass implementing Ethereum Provider errors per EIP 1193.
 * Permits integer error codes in the [ 1000 <= 4999 ] range.
 */
class EthereumProviderError extends EthereumRpcError {

  /**
   * Create an Ethereum JSON RPC error.
   *
   * @param {number} code - The integer error code, in the [ 1000 <= 4999 ] range.
   * @param {string} message - The string message.
   * @param {any} [data] - The error data.
   */
  constructor (code, message, data) {

    if (!isValidEthProviderCode(code)) {
      throw new Error(
        '"code" must be an integer such that: 1000 <= code <= 4999',
      )
    }

    super(code, message, data)
  }
}

// Internal

function isValidEthProviderCode (code) {
  return Number.isInteger(code) && code >= 1000 && code <= 4999
}

function stringifyReplacer (_, value) {
  if (value === '[Circular]') {
    return undefined
  }
  return value
}

// Exports

module.exports = {
  EthereumRpcError,
  EthereumProviderError,
}
