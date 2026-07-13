import { Interface } from '@ethersproject/abi'
import { ensure0xHex } from '@universe/encoding'
import type { Hex } from 'viem'
import { encodeFunctionData as viemEncodeFunctionData } from 'viem'

type ViemEncode = typeof viemEncodeFunctionData

export function createEncodeFunctionData(ctx: { getViemEnabled: () => boolean }): ViemEncode {
  return ((args: Parameters<ViemEncode>[0]): Hex => {
    if (ctx.getViemEnabled()) {
      return viemEncodeFunctionData(args)
    }
    // ethers' Interface accepts the same JsonFragment-shaped ABI as viem.
    // `encodeFunctionData` uses hexlify inside so behvaviour is the same.
    const iface = new Interface(args.abi as readonly unknown[] as never[])
    return ensure0xHex(iface.encodeFunctionData(args.functionName as string, args.args))
  }) as ViemEncode
}
