import { AbiCoder } from '@ethersproject/abi'
import { describe, expect, it, vi } from 'vitest'
import { modifyV4ExecuteCalldata, stripBalanceCheckERC20 } from './universalRouterCalldata'

const abiCoder = new AbiCoder()

const SMART_POOL = '0xEfa4bDf566aE50537A507863612638680420645C'
const FEE_RECIPIENT = '0x27213E28D7fDA5c57Fe9e5dD923818DBCcf71c47'

// UR command constants
const CMD_V4_SWAP = 0x10
const CMD_PAY_PORTION = 0x06
const CMD_PAY_PORTION_FULL_PRECISION = 0x07
const CMD_BALANCE_CHECK_ERC20 = 0x0e

// V4 action codes (new layout, post Nov-22-2024 / v4-periphery PR #384)
const V4_SWAP_EXACT_IN_SINGLE = 0x06
const V4_SWAP_EXACT_IN = 0x07
const V4_SETTLE = 0x0b
const V4_TAKE = 0x0e
const V4_TAKE_PORTION = 0x10

const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'
const SOME_TOKEN = '0xBC0BEA8E634ec838a2a45F8A43E7E16Cd2a8BA99'
const DEADLINE = 9999999999

/** Build calldata for a V4_SWAP with given inner actions and params. */
function buildV4SwapCalldata(
  innerActionsHex: number[],
  innerParams: string[],
  extraCommands: number[] = [],
  extraInputs: string[] = [],
): string {
  const innerActionsBytes = Buffer.from(innerActionsHex)
  const v4Input = abiCoder.encode(['bytes', 'bytes[]'], ['0x' + innerActionsBytes.toString('hex'), innerParams])

  const commands = Buffer.from([CMD_V4_SWAP, ...extraCommands])
  const inputs = [v4Input, ...extraInputs]

  return abiCoder.encode(['bytes', 'bytes[]', 'uint256'], ['0x' + commands.toString('hex'), inputs, DEADLINE])
}

function decodeCurrencyAddressUint256(params: string): { currency: string; recipient: string; amount: bigint } {
  const [currency, recipient, amount] = abiCoder.decode(['address', 'address', 'uint256'], params)
  return { currency, recipient, amount: BigInt(amount.toString()) }
}

function decodeV4SwapInput(encodedInput: string): { actionsHex: string; params: string[] } {
  const [actions, params] = abiCoder.decode(['bytes', 'bytes[]'], encodedInput)
  return { actionsHex: actions as string, params: params as string[] }
}

function decodeOutputCalldata(outputCalldata: string): { commands: string; inputs: string[] } {
  const [commands, inputs] = abiCoder.decode(['bytes', 'bytes[]', 'uint256'], outputCalldata)
  return { commands: commands as string, inputs: inputs as string[] }
}

// --------------------------------------------------------------------------
// PAY_PORTION_FULL_PRECISION downgrade tests
// --------------------------------------------------------------------------

describe('PAY_PORTION_FULL_PRECISION downgrade', () => {
  it('downgrades 0x07 → 0x06 and converts portion to bips', () => {
    // 5 bips = 5 * 1e18 / 10000 in full-precision
    const portion = BigInt(5) * BigInt('100000000000000') // 5e14 = 0.05% in 1e18 precision
    const input = abiCoder.encode(
      ['address', 'address', 'uint256'],
      [SOME_TOKEN, FEE_RECIPIENT, portion.toString()],
    )
    const commands = Buffer.from([CMD_PAY_PORTION_FULL_PRECISION])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    expect(result).not.toBe(calldata)

    const { commands: outCommands, inputs: outInputs } = decodeOutputCalldata(result)
    // Command byte should be downgraded from 0x07 to 0x06
    expect(outCommands).toBe('0x06')
    const [outToken, outRecipient, outBips] = abiCoder.decode(['address', 'address', 'uint256'], outInputs[0]!)
    expect(outToken.toLowerCase()).toBe(SOME_TOKEN.toLowerCase())
    // Fee recipient is replaced with the smart pool (shouldReplaceRecipient replaces all non-special addresses)
    expect(outRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
    // bips = portion * 10000 / 1e18 = 5e14 * 10000 / 1e18 = 5
    expect(BigInt(outBips.toString())).toBe(BigInt(5))
  })

  it('replaces fee recipient in PAY_PORTION_FULL_PRECISION', () => {
    const portion = BigInt(25) * BigInt('100000000000000') // 25 bips in 1e18 precision
    const input = abiCoder.encode(
      ['address', 'address', 'uint256'],
      [NATIVE_TOKEN, FEE_RECIPIENT, portion.toString()],
    )
    const commands = Buffer.from([CMD_PAY_PORTION_FULL_PRECISION])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { commands: outCommands, inputs: outInputs } = decodeOutputCalldata(result)
    expect(outCommands).toBe('0x06')
    const [, outRecipient] = abiCoder.decode(['address', 'address', 'uint256'], outInputs[0]!)
    expect(outRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })
})

// --------------------------------------------------------------------------
// BALANCE_CHECK_ERC20 stripping tests
// --------------------------------------------------------------------------

describe('stripBalanceCheckERC20', () => {
  it('strips BALANCE_CHECK_ERC20 (0x0e) from commands', () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const balanceCheckInput = abiCoder.encode(['address', 'uint256'], [SOME_TOKEN, 100])
    const v4Input = abiCoder.encode(
      ['bytes', 'bytes[]'],
      ['0x' + Buffer.from([V4_TAKE]).toString('hex'), [abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, SMART_POOL, 100])]],
    )
    const commands = Buffer.from([CMD_BALANCE_CHECK_ERC20, CMD_V4_SWAP])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [balanceCheckInput, v4Input], DEADLINE],
    )

    const stripped = stripBalanceCheckERC20(calldata)
    expect(stripped).not.toBe(calldata)
    const { commands: outCommands } = decodeOutputCalldata(stripped)
    expect(outCommands.toLowerCase()).not.toContain('0e')
    expect(outCommands.toLowerCase()).toContain('10') // V4_SWAP remains
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Stripped BALANCE_CHECK_ERC20'))
    consoleInfoSpy.mockRestore()
  })
})

// --------------------------------------------------------------------------
// V4 swap action code preservation tests
// --------------------------------------------------------------------------

describe('V4 action codes are preserved during recipient replacement', () => {
  it('preserves action codes unchanged when replacing TAKE recipient', () => {
    const settleParams = abiCoder.encode(['address', 'uint256', 'bool'], [NATIVE_TOKEN, 100, false])
    const takeParams = abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, FEE_RECIPIENT, 100])

    // Single-hop ExactIn: [SWAP_EXACT_IN_SINGLE(0x06), SETTLE(0x0b), TAKE(0x0e)]
    const calldata = buildV4SwapCalldata(
      [V4_SWAP_EXACT_IN_SINGLE, V4_SETTLE, V4_TAKE],
      ['0x', settleParams, takeParams],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    expect(result).not.toBe(calldata)

    const { inputs } = decodeOutputCalldata(result)
    const { actionsHex, params: outParams } = decodeV4SwapInput(inputs[0]!)
    const actionsBytes = Buffer.from(actionsHex.slice(2), 'hex')

    // All action codes must be preserved exactly
    expect(actionsBytes[0]).toBe(V4_SWAP_EXACT_IN_SINGLE) // 0x06
    expect(actionsBytes[1]).toBe(V4_SETTLE)                // 0x0b
    expect(actionsBytes[2]).toBe(V4_TAKE)                  // 0x0e

    // TAKE recipient replaced to smart pool
    const { recipient } = decodeCurrencyAddressUint256(outParams[2]!)
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })

  it('preserves multi-hop action codes when replacing TAKE recipient', () => {
    const settleParams = abiCoder.encode(['address', 'uint256', 'bool'], [SOME_TOKEN, 100, false])
    const takeParams = abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, FEE_RECIPIENT, 100])

    // Multi-hop ExactIn: [SWAP_EXACT_IN(0x07), SETTLE(0x0b), TAKE(0x0e)]
    const calldata = buildV4SwapCalldata(
      [V4_SWAP_EXACT_IN, V4_SETTLE, V4_TAKE],
      ['0x', settleParams, takeParams],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const { actionsHex } = decodeV4SwapInput(inputs[0]!)
    const actionsBytes = Buffer.from(actionsHex.slice(2), 'hex')

    expect(actionsBytes[0]).toBe(V4_SWAP_EXACT_IN) // 0x07 unchanged
    expect(actionsBytes[1]).toBe(V4_SETTLE)         // 0x0b unchanged
    expect(actionsBytes[2]).toBe(V4_TAKE)           // 0x0e unchanged
  })

  it('returns calldata unchanged when TAKE recipient is already smart pool', () => {
    const settleParams = abiCoder.encode(['address', 'uint256', 'bool'], [NATIVE_TOKEN, 100, false])
    const takeParams = abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, SMART_POOL, 100])

    const calldata = buildV4SwapCalldata(
      [V4_SWAP_EXACT_IN_SINGLE, V4_SETTLE, V4_TAKE],
      ['0x', settleParams, takeParams],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    expect(result).toBe(calldata)
  })

  it('replaces both TAKE and TAKE_PORTION recipients', () => {
    const settleParams = abiCoder.encode(['address', 'uint256', 'bool'], [SOME_TOKEN, 100, false])
    const takePortionParams = abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, FEE_RECIPIENT, 50])
    const takeParams = abiCoder.encode(['address', 'address', 'uint256'], [NATIVE_TOKEN, FEE_RECIPIENT, 950])

    const calldata = buildV4SwapCalldata(
      [V4_SWAP_EXACT_IN_SINGLE, V4_SETTLE, V4_TAKE_PORTION, V4_TAKE],
      ['0x', settleParams, takePortionParams, takeParams],
    )

    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const { actionsHex, params: outParams } = decodeV4SwapInput(inputs[0]!)
    const actionsBytes = Buffer.from(actionsHex.slice(2), 'hex')

    // Action codes unchanged
    expect(actionsBytes[0]).toBe(V4_SWAP_EXACT_IN_SINGLE)
    expect(actionsBytes[1]).toBe(V4_SETTLE)
    expect(actionsBytes[2]).toBe(V4_TAKE_PORTION)
    expect(actionsBytes[3]).toBe(V4_TAKE)

    const { recipient: tpRecipient } = decodeCurrencyAddressUint256(outParams[2]!)
    expect(tpRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
    const { recipient: takeRecipient } = decodeCurrencyAddressUint256(outParams[3]!)
    expect(takeRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })
})
