import { isAddress as ethersIsAddress } from '@ethersproject/address'
import { isAddress as viemIsAddress } from 'viem'

export function createIsAddress(ctx: { getViemEnabled: () => boolean }): (value: string) => boolean {
  return (value) => (ctx.getViemEnabled() ? viemIsAddress(value) : ethersIsAddress(value))
}
