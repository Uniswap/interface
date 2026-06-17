import { type Currency } from '@uniswap/sdk-core'
import {
  type ComplianceTokenInput,
  hasUnrecognizedReason,
  isAckGated,
  isHardBlocked,
  type RestrictionReason,
  useTokenComplianceStatus,
} from '@universe/compliance'
import { useIsRWAGeoBlocked } from 'uniswap/src/features/rwa/useIsRWAGeoBlocked'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { NATIVE_ADDRESS_FOR_TRADING_API } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyField } from 'uniswap/src/types/currency'

export type GeoRestrictionMode = 'default' | 'unrestricted' | 'restricted'

/** Maps a swap currency to the compliance API token shape (native sentinel, lowercased EVM address). */
export function toComplianceTokenRef(currency: Currency | undefined): ComplianceTokenInput | undefined {
  if (!currency) {
    return undefined
  }
  return {
    chainId: currency.chainId,
    address: currency.isNative ? NATIVE_ADDRESS_FOR_TRADING_API : currency.address.toLowerCase(),
  }
}

function classifyReasons(reasons: RestrictionReason[]): GeoRestrictionMode {
  if (isHardBlocked(reasons)) {
    return 'restricted'
  }
  if (isAckGated(reasons)) {
    return 'unrestricted'
  }
  // A future `RestrictionReason` we don't model yet: fail safe to the most restrictive mode.
  // Recognized non-geo reasons (e.g. `UNSPECIFIED`, the generic unsupported-token block) fall
  // through to `default` so the standard blocked-token UX handles them.
  if (hasUnrecognizedReason(reasons)) {
    return 'restricted'
  }
  return 'default'
}

/** Whether the geo-restriction UX should take over for this token. Fails open while the API loads. */
export function useIsTokenGeoRestricted(currency: Currency | undefined): boolean {
  const { reasons } = useTokenComplianceStatus(toComplianceTokenRef(currency))
  // INTERIM: until the compliance v2 service returns data, the `rwa_geo_blocked` Statsig flag +
  // RWA whitelist stand in for the region hard block. Remove `useIsRWAGeoBlocked` once the API is
  // the source of truth.
  const isRWAGeoBlocked = useIsRWAGeoBlocked(currency)
  // The geo UX owns region hard blocks, the acknowledgement path, and unrecognized future
  // reasons. Generic non-geo blocks (e.g. `UNSPECIFIED`) are left to the standard blocked-token UX.
  return isRWAGeoBlocked || isHardBlocked(reasons) || isAckGated(reasons) || hasUnrecognizedReason(reasons)
}

/**
 * Resolves the geo-restriction mode for the current swap from the compliance API,
 * combining input and output with precedence `restricted > unrestricted > default`.
 * Fails open to `default` while the API loads or errors.
 */
export function useGeoRestrictionMode(): GeoRestrictionMode {
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)

  const { reasons: inputReasons } = useTokenComplianceStatus(toComplianceTokenRef(inputCurrency))
  const { reasons: outputReasons } = useTokenComplianceStatus(toComplianceTokenRef(outputCurrency))

  // INTERIM: an `rwa_geo_blocked` RWA is treated as a region hard block until compliance v2 is live.
  const inputRWAGeoBlocked = useIsRWAGeoBlocked(inputCurrency)
  const outputRWAGeoBlocked = useIsRWAGeoBlocked(outputCurrency)

  const inputMode = inputRWAGeoBlocked ? 'restricted' : classifyReasons(inputReasons)
  const outputMode = outputRWAGeoBlocked ? 'restricted' : classifyReasons(outputReasons)

  if (inputMode === 'restricted' || outputMode === 'restricted') {
    return 'restricted'
  }
  if (inputMode === 'unrestricted' || outputMode === 'unrestricted') {
    return 'unrestricted'
  }
  return 'default'
}
