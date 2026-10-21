import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { areEvmAddressesEqual, type UniverseChainId } from '@universe/chains'
import { useTranslation } from 'react-i18next'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'

/** v4 pools are keyed by a bytes32 id rather than an address, so they're middle-ellipsed instead. */
export function shortenPoolId({
  poolId,
  protocolVersion,
}: {
  poolId: string
  protocolVersion: ProtocolVersion
}): string {
  return protocolVersion !== ProtocolVersion.V4
    ? shortenAddress({ address: poolId })
    : ellipseMiddle({ str: poolId, charsStart: 6 })
}

interface PoolIdentityLabels {
  versionLabel?: string
  feeLabel: string
  /** Registry name, else the shortened address; absent for hookless pools. */
  hookLabel?: string
  /** Whether the hook name came from the registry rather than falling back to its address. */
  isNamedHook: boolean
  hookMark?: JSX.Element
}

export function usePoolIdentityLabels({
  chainId,
  protocolVersion,
  hookAddress,
  feeTier,
}: {
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
}): PoolIdentityLabels {
  const { t } = useTranslation()
  const getUniswapHookProvenance = useUniswapHookProvenance()
  const versionLabel = getProtocolVersionLabel(protocolVersion)
  // v4 dynamic-fee pools arrive with the DYNAMIC_FEE_AMOUNT sentinel in fee_tier, which would otherwise
  // format as ~838%. The search payload carries no isDynamic flag.
  const feeLabel = feeTier === DYNAMIC_FEE_AMOUNT ? t('common.dynamic') : `${feeTier / BIPS_BASE}%`

  // A zero hook address means "no hook" (the search/stats payloads don't all filter it out upstream).
  const poolHookAddress = hookAddress && !areEvmAddressesEqual(hookAddress, ZERO_ADDRESS) ? hookAddress : undefined
  const hookRegistry = useHookRegistryMap({ chainId, enabled: !!poolHookAddress })
  const hookName = poolHookAddress
    ? hookRegistry?.get(getHookRegistryKey({ chainId, hookAddress: poolHookAddress }))?.name
    : undefined
  // Registry membership isn't Uniswap authorship; only hooks the provenance config attributes to Uniswap
  // get the mark, matching the pool detail page.
  const isUniswapBuiltHook =
    !!poolHookAddress && getUniswapHookProvenance({ chainId, address: poolHookAddress }) !== undefined

  return {
    versionLabel,
    feeLabel,
    hookLabel: poolHookAddress ? hookName || shortenAddress({ address: poolHookAddress, chars: 4 }) : undefined,
    isNamedHook: !!hookName,
    hookMark: hookName && isUniswapBuiltHook ? <UniswapBuiltHookMark /> : undefined,
  }
}
