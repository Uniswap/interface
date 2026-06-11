import { parseUnits as ethersParseUnits } from '@ethersproject/units'
import { parseUnits as viemParseUnits } from 'viem'

export function createParseUnits(ctx: { getViemEnabled: () => boolean }): (value: string, decimals: number) => bigint {
  return (value, decimals) =>
    ctx.getViemEnabled() ? viemParseUnits(value, decimals) : ethersParseUnits(value, decimals).toBigInt()
}
