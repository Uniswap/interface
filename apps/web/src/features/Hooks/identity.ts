import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import type { HookDeployment } from '~/features/Hooks/types'

export function getHookDeploymentKey({ chainId, address }: Pick<HookDeployment, 'chainId' | 'address'>): string {
  return `${chainId}-${normalizeAddress(address, AddressStringFormat.Lowercase)}`
}
