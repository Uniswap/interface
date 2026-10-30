import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isChainMismatchError,
  isConnectorDisconnectedError,
  isPreBroadcastError,
  matchesCauseChain,
} from 'utilities/src/errors/walletErrors'

/** viem's wrapper around a failed `sendTransaction`, with the classified error as its cause. */
function executionError(cause: unknown): Error {
  return Object.assign(new Error('Transaction failed'), { name: 'TransactionExecutionError', cause })
}

describe('isConnectorDisconnectedError', () => {
  it("recognizes wagmi's connector errors and EIP-1193 4900/4901", () => {
    expect(isConnectorDisconnectedError(Object.assign(new Error('Connector not connected.'), { name: 'X' }))).toBe(true)
    expect(isConnectorDisconnectedError({ name: 'ConnectorNotConnectedError' })).toBe(true)
    expect(isConnectorDisconnectedError({ name: 'ConnectorAccountNotFoundError' })).toBe(true)
    expect(isConnectorDisconnectedError({ code: 4900 })).toBe(true)
    expect(isConnectorDisconnectedError({ code: 4901 })).toBe(true)
  })

  it('finds it nested in a cause chain', () => {
    const inner = Object.assign(new Error('Connector not connected.'), { name: 'ConnectorNotConnectedError' })
    expect(isConnectorDisconnectedError(new Error('Failed to send', { cause: inner }))).toBe(true)
  })

  it('leaves other failures alone', () => {
    expect(isConnectorDisconnectedError(new Error('insufficient funds for gas'))).toBe(false)
    // An app error that says "connected" without saying the connector dropped.
    expect(
      isConnectorDisconnectedError(new Error('Launch calldata was prepared for 0xdd, but 0xee is connected')),
    ).toBe(false)
    expect(isConnectorDisconnectedError(new Error('Launch transaction reverted: 0x1'))).toBe(false)
    expect(isConnectorDisconnectedError({ code: 4001, message: 'User rejected the request' })).toBe(false)
  })
})

describe('isChainMismatchError', () => {
  it("recognizes viem's ChainMismatchError, wagmi's switch failures, and EIP-1193 4902", () => {
    expect(isChainMismatchError({ name: 'ChainMismatchError' })).toBe(true)
    expect(isChainMismatchError({ name: 'ChainNotConfiguredError' })).toBe(true)
    expect(isChainMismatchError({ name: 'SwitchChainNotSupportedError' })).toBe(true)
    expect(isChainMismatchError({ code: 4902 })).toBe(true)
    expect(
      isChainMismatchError(
        new Error('The current chain of the wallet (id: 1) does not match the target chain for the transaction'),
      ),
    ).toBe(true)
  })

  it('leaves other failures alone', () => {
    expect(isChainMismatchError(new Error('insufficient funds for gas'))).toBe(false)
    expect(isChainMismatchError(new Error('Launch transaction reverted: 0x1'))).toBe(false)
    expect(isChainMismatchError({ code: 4001, message: 'User rejected the request' })).toBe(false)
  })
})

describe('isPreBroadcastError', () => {
  it.each(['NonceTooLowError', 'InsufficientFundsError', 'ExecutionRevertedError', 'ConnectorNotConnectedError'])(
    'recognizes %s nested under a TransactionExecutionError',
    (name) => {
      expect(isPreBroadcastError(executionError({ name }))).toBe(true)
    },
  )

  it("leaves viem's catch-all and transport failures ambiguous", () => {
    expect(isPreBroadcastError(executionError({ name: 'UnknownNodeError' }))).toBe(false)
    expect(isPreBroadcastError(executionError({ name: 'HttpRequestError' }))).toBe(false)
    expect(isPreBroadcastError({ name: 'TimeoutError' })).toBe(false)
    expect(isPreBroadcastError(undefined)).toBe(false)
  })

  it('reads names, not messages', () => {
    expect(isPreBroadcastError(new Error('nonce too low'))).toBe(false)
  })
})

describe('matchesCauseChain', () => {
  it('follows cause only', () => {
    const match = { name: 'Target' }
    expect(matchesCauseChain({ cause: { cause: match } }, (level) => level.name === 'Target')).toBe(true)
    expect(matchesCauseChain({ originalError: match }, (level) => level.name === 'Target')).toBe(false)
  })

  it('stops at depth 10, so a cyclic chain terminates', () => {
    const cyclic: { name: string; cause?: unknown } = { name: 'a' }
    cyclic.cause = cyclic
    let visits = 0
    expect(
      matchesCauseChain(cyclic, () => {
        visits += 1
        return false
      }),
    ).toBe(false)
    expect(visits).toBe(10)
  })
})

// Same guarantee as walletRejection.ts: any app can import this without barrels or SDKs.
describe('import graph', () => {
  it('imports nothing', () => {
    const source = readFileSync(join(__dirname, 'walletErrors.ts'), 'utf8')
    expect(
      source.match(/^\s*import\b(?!\s+type\b)|^\s*export\s*(?:\*|\{[^}]*\})[^;\n]*\bfrom\b|\b(?:require|import)\s*\(/m),
    ).toBeNull()
  })
})
