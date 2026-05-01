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

// --------------------------------------------------------------------------
// WRAP_ETH + V3_SWAP_EXACT_IN (ETH → token, the failing Arbitrum case)
// --------------------------------------------------------------------------

const CMD_WRAP_ETH = 0x0b
const CMD_UNWRAP_WETH = 0x0c
const CMD_V3_SWAP_EXACT_IN = 0x00
const CMD_V3_SWAP_EXACT_OUT = 0x01
const CMD_V2_SWAP_EXACT_IN = 0x08
const CMD_V2_SWAP_EXACT_OUT = 0x09
const ADDRESS_THIS = '0x0000000000000000000000000000000000000002'
const MSG_SENDER = '0x0000000000000000000000000000000000000001'
const WETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
// V3 path: WETH -0.05%- USDC (43 bytes)
const V3_PATH = ('0x' + WETH.slice(2) + '000064' + USDC.slice(2)).toLowerCase()

function buildWrapEthV3Calldata(
  wrapRecipient: string,
  swapRecipient: string,
  payerIsUser: boolean,
): string {
  const wrapInput = abiCoder.encode(['address', 'uint256'], [wrapRecipient, '10000000000000000'])
  const swapInput = abiCoder.encode(
    ['address', 'uint256', 'uint256', 'bytes', 'bool'],
    [swapRecipient, '10000000000000000', '22826256', V3_PATH, payerIsUser],
  )
  const commands = Buffer.from([CMD_WRAP_ETH, CMD_V3_SWAP_EXACT_IN])
  return abiCoder.encode(
    ['bytes', 'bytes[]', 'uint256'],
    ['0x' + commands.toString('hex'), [wrapInput, swapInput], DEADLINE],
  )
}

describe('WRAP_ETH + V3_SWAP_EXACT_IN (ETH → token via smart pool)', () => {
  it('leaves ADDRESS_THIS in WRAP_ETH untouched and replaces user address in V3', () => {
    // Reproduces the failing Arbitrum tx: [WRAP_ETH(ADDRESS_THIS), V3_SWAP_EXACT_IN(user)]
    // ADDRESS_THIS and MSG_SENDER are whitelisted by AUniswapRouter._processRecipients —
    // only the user EOA recipient in V3 needs to be replaced.
    const calldata = buildWrapEthV3Calldata(ADDRESS_THIS, FEE_RECIPIENT, false)
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    expect(result).not.toBe(calldata)

    const { inputs } = decodeOutputCalldata(result)

    // WRAP_ETH: ADDRESS_THIS unchanged (it is whitelisted, WETH stays in the UR)
    const [wrapRecipient] = abiCoder.decode(['address', 'uint256'], inputs[0]!)
    expect(wrapRecipient.toLowerCase()).toBe(ADDRESS_THIS.toLowerCase())

    // V3_SWAP_EXACT_IN: user address replaced with smart pool, payerIsUser untouched
    const [swapRecipient, , , , payerIsUser] = abiCoder.decode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      inputs[1]!,
    )
    expect(swapRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
    expect(payerIsUser).toBe(false) // untouched — UR draws from its own WETH balance
  })

  it('leaves MSG_SENDER in WRAP_ETH untouched', () => {
    const calldata = buildWrapEthV3Calldata(MSG_SENDER, FEE_RECIPIENT, false)
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)

    const { inputs } = decodeOutputCalldata(result)
    const [wrapRecipient] = abiCoder.decode(['address', 'uint256'], inputs[0]!)
    expect(wrapRecipient.toLowerCase()).toBe(MSG_SENDER.toLowerCase())

    // V3 recipient still replaced
    const [swapRecipient] = abiCoder.decode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      inputs[1]!,
    )
    expect(swapRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })

  it('replaces user address in WRAP_ETH when present', () => {
    // Unusual but possible: WRAP_ETH with a user address recipient
    const calldata = buildWrapEthV3Calldata(FEE_RECIPIENT, FEE_RECIPIENT, false)
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)

    const { inputs } = decodeOutputCalldata(result)
    const [wrapRecipient] = abiCoder.decode(['address', 'uint256'], inputs[0]!)
    expect(wrapRecipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })
})

// --------------------------------------------------------------------------
// V3_SWAP_EXACT_IN standalone (ERC20 → ERC20, user address recipient)
// --------------------------------------------------------------------------

describe('V3_SWAP_EXACT_IN recipient replacement', () => {
  it('replaces user address recipient with smart pool', () => {
    const input = abiCoder.encode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      [FEE_RECIPIENT, '1000', '900', V3_PATH, true],
    )
    const commands = Buffer.from([CMD_V3_SWAP_EXACT_IN])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const [recipient, , , , payerIsUser] = abiCoder.decode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      inputs[0]!,
    )
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
    expect(payerIsUser).toBe(true) // unchanged
  })

  it('does not replace ADDRESS_THIS or MSG_SENDER recipient', () => {
    for (const specialAddr of [ADDRESS_THIS, MSG_SENDER]) {
      const input = abiCoder.encode(
        ['address', 'uint256', 'uint256', 'bytes', 'bool'],
        [specialAddr, '1000', '900', V3_PATH, false],
      )
      const commands = Buffer.from([CMD_V3_SWAP_EXACT_IN])
      const calldata = abiCoder.encode(
        ['bytes', 'bytes[]', 'uint256'],
        ['0x' + commands.toString('hex'), [input], DEADLINE],
      )
      const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
      // calldata should be unchanged since recipient is a special constant
      expect(result).toBe(calldata)
    }
  })
})

// --------------------------------------------------------------------------
// V3_SWAP_EXACT_OUT recipient replacement
// --------------------------------------------------------------------------

describe('V3_SWAP_EXACT_OUT recipient replacement', () => {
  it('replaces user address recipient with smart pool', () => {
    const input = abiCoder.encode(
      ['address', 'uint256', 'uint256', 'bytes', 'bool'],
      [FEE_RECIPIENT, '1000', '1100', V3_PATH, true],
    )
    const commands = Buffer.from([CMD_V3_SWAP_EXACT_OUT])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const [recipient] = abiCoder.decode(['address', 'uint256', 'uint256', 'bytes', 'bool'], inputs[0]!)
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })
})

// --------------------------------------------------------------------------
// V2_SWAP_EXACT_IN / V2_SWAP_EXACT_OUT recipient replacement
// --------------------------------------------------------------------------

describe('V2 swap recipient replacement', () => {
  const V2_PATH = [WETH, USDC]

  it('replaces V2_SWAP_EXACT_IN recipient', () => {
    const input = abiCoder.encode(
      ['address', 'uint256', 'uint256', 'address[]', 'bool'],
      [FEE_RECIPIENT, '1000', '900', V2_PATH, true],
    )
    const commands = Buffer.from([CMD_V2_SWAP_EXACT_IN])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const [recipient] = abiCoder.decode(['address', 'uint256', 'uint256', 'address[]', 'bool'], inputs[0]!)
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })

  it('replaces V2_SWAP_EXACT_OUT recipient', () => {
    const input = abiCoder.encode(
      ['address', 'uint256', 'uint256', 'address[]', 'bool'],
      [FEE_RECIPIENT, '1000', '1100', V2_PATH, true],
    )
    const commands = Buffer.from([CMD_V2_SWAP_EXACT_OUT])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const [recipient] = abiCoder.decode(['address', 'uint256', 'uint256', 'address[]', 'bool'], inputs[0]!)
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
  })
})

// --------------------------------------------------------------------------
// UNWRAP_WETH recipient replacement
// --------------------------------------------------------------------------

describe('UNWRAP_WETH recipient replacement', () => {
  it('replaces user address recipient with smart pool', () => {
    const input = abiCoder.encode(['address', 'uint256'], [FEE_RECIPIENT, '5000'])
    const commands = Buffer.from([CMD_UNWRAP_WETH])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    const { inputs } = decodeOutputCalldata(result)
    const [recipient, amount] = abiCoder.decode(['address', 'uint256'], inputs[0]!)
    expect(recipient.toLowerCase()).toBe(SMART_POOL.toLowerCase())
    expect(amount.toString()).toBe('5000')
  })

  it('does not modify when recipient is already smart pool', () => {
    const input = abiCoder.encode(['address', 'uint256'], [SMART_POOL, '5000'])
    const commands = Buffer.from([CMD_UNWRAP_WETH])
    const calldata = abiCoder.encode(
      ['bytes', 'bytes[]', 'uint256'],
      ['0x' + commands.toString('hex'), [input], DEADLINE],
    )
    const result = modifyV4ExecuteCalldata(calldata, SMART_POOL)
    expect(result).toBe(calldata)
  })
})
