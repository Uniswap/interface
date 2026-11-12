import { getValidAddress, Platform } from '@universe/chains'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'

export function getValidHookAddress(address: string | undefined): string | null {
  return getValidAddress({
    address: normalizeHookForMatch(address),
    platform: Platform.EVM,
    withEVMChecksum: true,
  })
}
