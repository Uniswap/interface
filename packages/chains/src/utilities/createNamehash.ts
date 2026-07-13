import { namehash as ethersNamehash } from '@ethersproject/hash'
import { namehash as viemNamehash } from 'viem'

export function createNamehash(ctx: { getViemEnabled: () => boolean }): (name: string) => string {
  return (name) => (ctx.getViemEnabled() ? viemNamehash(name) : ethersNamehash(name))
}
