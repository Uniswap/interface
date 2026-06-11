import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { decodeFunctionResult as viemDecodeFunctionResult } from 'viem'

type ViemDecode = typeof viemDecodeFunctionResult

/**
 * ethers returns `BigNumber` for uint/int outputs; viem returns native
 * `bigint`. Walk the result and convert so consumers don't see the branch.
 */
function normalizeEthersValue(value: unknown): unknown {
  if (BigNumber.isBigNumber(value)) {
    return value.toBigInt()
  }
  // Value as an array, recursively
  if (Array.isArray(value)) {
    return value.map(normalizeEthersValue)
  }
  return value
}

export function createDecodeFunctionResult(ctx: { getViemEnabled: () => boolean }): ViemDecode {
  // `unknown` makes it easier transitioning from Ethers.js -> viem
  return ((args: Parameters<ViemDecode>[0]): unknown => {
    if (ctx.getViemEnabled()) {
      return viemDecodeFunctionResult(args)
    }
    // ethers' Interface accepts the same JsonFragment-shaped ABI as viem.
    const iface = new Interface(args.abi as readonly unknown[] as never[])
    const result = iface.decodeFunctionResult(args.functionName as string, args.data)
    // viem unwraps single-output functions; multi-output returns a positional
    // array (without ethers' named-tuple accessors). Match that shape.
    if (result.length === 1) {
      return normalizeEthersValue(result[0])
    }
    return [...result].map(normalizeEthersValue)
  }) as ViemDecode
}
