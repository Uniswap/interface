import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  didUserReject,
  errorTextParts,
  someInErrorChain,
  UserRejectedRequestError,
} from 'utilities/src/errors/walletRejection'

describe('didUserReject', () => {
  it('detects top-level EIP-1193 rejection code', () => {
    expect(didUserReject({ code: 4001 })).toBe(true)
  })

  it.each([5750, 'ACTION_REJECTED', '4001', 4001n])('detects the %s rejection code', (code) => {
    expect(didUserReject({ code })).toBe(true)
  })

  it('detects stringified JSON-RPC rejection code', () => {
    expect(didUserReject({ code: '4001', message: 'rejected' })).toBe(true)
  })

  it('detects rejection nested on error.cause (common viem / structured errors)', () => {
    const err = new Error('An internal error was received', {
      cause: { code: 4001, message: 'User rejected the request.' },
    })
    expect(didUserReject(err)).toBe(true)
  })

  it('detects rejection on a wrapper’s originalError', () => {
    const original = Object.assign(new Error('User rejected'), { code: 4001 })
    const wrapped = Object.assign(new Error('swapTransaction failed during auctionLaunch'), { originalError: original })
    expect(didUserReject(wrapped)).toBe(true)
  })

  it('detects rejection on legacy error.error, data.originalError and details[]', () => {
    expect(didUserReject({ error: { code: 4001 } })).toBe(true)
    expect(didUserReject({ data: { originalError: { code: 4001 } } })).toBe(true)
    expect(didUserReject({ details: [{ message: 'fine' }, { code: 4001 }] })).toBe(true)
  })

  it.each([
    'Transaction cancelled by user', // SafePal
    'User canceled', // Trust
    'User denied transaction signature', // Coinbase
    'user rejected', // Fireblocks
    'User closed modal', // Binance
    'Connection rejected', // Solflare
    'Transaction cancelled', // Solflare
  ])('detects the wallet message %j', (message) => {
    expect(didUserReject(new Error(message))).toBe(true)
  })

  it('detects our own UserRejectedRequestError by class', () => {
    expect(didUserReject(new UserRejectedRequestError('permit failed'))).toBe(true)
  })

  it('returns false for unrelated failures', () => {
    expect(didUserReject(new Error('execution reverted'))).toBe(false)
    expect(didUserReject(undefined)).toBe(false)
    expect(didUserReject('')).toBe(false)
  })

  it('does not treat Rainbow-style rejection as matched when "request" and "reject" appear only in different fields', () => {
    expect(
      didUserReject({
        shortMessage: 'GET request',
        message: 'reject handler failed',
      }),
    ).toBe(false)
  })

  it('detects Rainbow-style rejection when both patterns appear in one message field', () => {
    expect(didUserReject({ message: 'User rejected the request.' })).toBe(true)
  })

  it('terminates on a cyclic chain', () => {
    const a: { cause?: unknown; message: string } = { message: 'a' }
    a.cause = { message: 'b', cause: a }
    expect(didUserReject(a)).toBe(false)
  })
})

// ESW, an ERC-20 traded on a Uniswap v2 pool on Ethereum (proxy 0x5a75A093747b72a0e14056352751eDF03518031d),
// reverts a blocked transfer with this reason. Shapes below are what the node, viem 2.49 and ethers 5.7 produce for it.
const DECLINED_REVERT_REASON = 'Transfer declined by blacklist'

const VIEM_REQUEST_ARGUMENTS = 'Request Arguments:\n  to:    0x00000000000000000000000000000000000000aa\n  data:  0x01'

/**
 * viem 2.49's `sendTransaction` error for a revert (`getTransactionError` over the node's error). Its message always
 * carries viem's "Request Arguments:" block, so "request" sits next to whatever the revert reason says.
 */
function viemSendTransactionRevert(reason: string): object {
  const shortMessage = `Execution reverted with reason: ${reason}.`
  const details = `Details: execution reverted: ${reason}\nVersion: viem@2.49.0`
  return {
    name: 'TransactionExecutionError',
    shortMessage,
    message: `${shortMessage}\n\n${VIEM_REQUEST_ARGUMENTS}\n\n${details}`,
    cause: {
      name: 'ExecutionRevertedError',
      shortMessage,
      message: `${shortMessage}\n\n${details}`,
      cause: {
        name: 'RpcRequestError',
        code: -32000,
        shortMessage: 'RPC Request failed.',
        message: `RPC Request failed.\n\nURL: https://rpc.example\nRequest body: {}\n\n${details}`,
        cause: { code: -32000, message: `execution reverted: ${reason}` },
      },
    },
  }
}

/** The same wrapper over a wallet's own error, which viem passes through without a revert. */
function viemSendTransactionWalletError(walletError: { code: number; message: string }): object {
  const details = `Details: ${walletError.message}\nVersion: viem@2.49.0`
  const rpcMessage = 'RPC Request failed.\n\nURL: https://rpc.example\nRequest body: {}'
  return {
    name: 'TransactionExecutionError',
    shortMessage: 'RPC Request failed.',
    message: `${rpcMessage}\n \n${VIEM_REQUEST_ARGUMENTS}\n\n${details}`,
    cause: {
      name: 'RpcRequestError',
      code: walletError.code,
      shortMessage: 'RPC Request failed.',
      message: `${rpcMessage}\n\n${details}`,
      cause: walletError,
    },
  }
}

describe('"declined" in an error message', () => {
  it.each([
    ['User declined transaction', 'Frame'],
    ['Transaction declined', 'Ledger Live over WalletConnect, Temple'],
    ['Personal message signed declined', 'Ledger Live'],
    ['Request declined', 'generic'],
  ])('reads %j as a rejection (%s)', (message) => {
    expect(didUserReject(new Error(message))).toBe(true)
  })

  it.each([
    ['the node', { code: 3, message: `execution reverted: ${DECLINED_REVERT_REASON}` }],
    [
      "viem's contract call (simulate / write)",
      {
        name: 'ContractFunctionExecutionError',
        shortMessage: `The contract function "transfer" reverted with the following reason:\n${DECLINED_REVERT_REASON}`,
        cause: {
          name: 'ContractFunctionRevertedError',
          shortMessage: `The contract function "transfer" reverted with the following reason:\n${DECLINED_REVERT_REASON}`,
          reason: DECLINED_REVERT_REASON,
          cause: { name: 'RawContractError', code: 3, message: 'An error occurred.' },
        },
      },
    ],
    [
      "viem's gas estimate",
      {
        name: 'EstimateGasExecutionError',
        shortMessage: `Execution reverted with reason: ${DECLINED_REVERT_REASON}.`,
        cause: {
          name: 'ExecutionRevertedError',
          shortMessage: `Execution reverted with reason: ${DECLINED_REVERT_REASON}.`,
          message: `Execution reverted with reason: ${DECLINED_REVERT_REASON}.\n\nDetails: execution reverted: ${DECLINED_REVERT_REASON}`,
          cause: { code: 3, message: `execution reverted: ${DECLINED_REVERT_REASON}` },
        },
      },
    ],
    [
      'ethers v5',
      {
        code: 'CALL_EXCEPTION',
        reason: DECLINED_REVERT_REASON,
        message: `call revert exception; VM Exception while processing transaction: reverted with reason string "${DECLINED_REVERT_REASON}"`,
      },
    ],
    ["viem's sendTransaction", viemSendTransactionRevert(DECLINED_REVERT_REASON)],
  ])('does not read a contract revert reason as a rejection (%s)', (_, error) => {
    expect(didUserReject(error)).toBe(false)
  })

  it('still finds a rejection under a revert-mentioning wrapper', () => {
    expect(didUserReject({ message: 'execution reverted', cause: { code: 4001 } })).toBe(true)
  })
})

describe('any wallet phrase in a revert reason', () => {
  it.each(['Bid rejected', 'Order cancelled by user'])(
    "does not read the reason %j as a rejection under viem's sendTransaction wrapper",
    (reason) => {
      expect(didUserReject(viemSendTransactionRevert(reason))).toBe(false)
      expect(didUserReject({ code: 3, message: `execution reverted: ${reason}` })).toBe(false)
    },
  )

  it.each([
    [{ code: 5000, message: 'Transaction declined' }, 'Ledger Live over WalletConnect: no 4001, only the message'],
    [{ code: 4001, message: 'User declined transaction' }, 'Frame'],
  ])("still reads %j under viem's sendTransaction wrapper as a rejection (%s)", (walletError) => {
    expect(didUserReject(viemSendTransactionWalletError(walletError))).toBe(true)
  })
})

describe('errorTextParts', () => {
  it('keeps shortMessage, message and reason as separate non-empty strings', () => {
    expect(errorTextParts({ shortMessage: 'short', message: '', reason: 'why', code: 1 })).toEqual(['short', 'why'])
    expect(errorTextParts('plain')).toEqual(['plain'])
    expect(errorTextParts(42)).toEqual([])
  })
})

describe('someInErrorChain', () => {
  it('visits every link once', () => {
    const seen: unknown[] = []
    const leaf = { message: 'leaf' }
    someInErrorChain({ cause: leaf, originalError: leaf }, (level) => {
      seen.push(level)
      return false
    })
    expect(seen.filter((level) => level === leaf)).toHaveLength(1)
  })
})

// The point of this module is that any app can import it without @universe/environment or other
// barrels. Fail if it gains a runtime import: static (side-effect ones included), re-export, dynamic
// or require. Type-only imports are erased.
describe('import graph', () => {
  it('imports nothing', () => {
    const source = readFileSync(join(__dirname, 'walletRejection.ts'), 'utf8')
    expect(
      source.match(/^\s*import\b(?!\s+type\b)|^\s*export\s*(?:\*|\{[^}]*\})[^;\n]*\bfrom\b|\b(?:require|import)\s*\(/m),
    ).toBeNull()
  })
})
