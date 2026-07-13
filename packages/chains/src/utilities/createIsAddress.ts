import { isAddress as ethersIsAddress } from '@ethersproject/address'
import { type Address, isAddress as viemIsAddress } from 'viem'

export function createIsAddress(ctx: { getViemEnabled: () => boolean }): (value: string) => value is Address {
  return (value): value is Address => (ctx.getViemEnabled() ? viemIsAddress(value) : ethersIsAddress(value))
}
