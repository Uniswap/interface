import type { HookFlags } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'

export function getActiveHookFlags(flags: HookFlags | undefined): string[] {
  if (!flags) {
    return []
  }
  // HookFlags is all boolean fields, so the active flags are just the truthy keys
  return Object.keys(flags).filter((key) => flags[key as keyof HookFlags] === true)
}
