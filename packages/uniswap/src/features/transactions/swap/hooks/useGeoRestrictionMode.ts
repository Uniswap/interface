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
  // Fail safe: a future `RestrictionReason` we don't model yet maps to the most restrictive mode.
  if (hasUnrecognizedReason(reasons)) {
    return 'restricted'
  }
  return 'default'
}

/** Geo-restriction mode for a single currency, the shared basis for both the symbol and the swap-wide mode. */
function useCurrencyGeoRestrictionMode(currency: Currency | undefined): GeoRestrictionMode {
  const { reasons } = useTokenComplianceStatus(toComplianceTokenRef(currency))
  // INTERIM: the `rwa_geo_blocked` Statsig flag stands in for the region hard block until
  // compliance v2 is the source of truth. Remove `useIsRWAGeoBlocked` once it is.
  const isRWAGeoBlocked = useIsRWAGeoBlocked(currency)
  return isRWAGeoBlocked ? 'restricted' : classifyReasons(reasons)
}

export function useIsTokenGeoRestricted(currency: Currency | undefined): boolean {
  return useCurrencyGeoRestrictionMode(currency) !== 'default'
}

/**
 * Symbol of the geo-restricted token in the current swap. Tracks the same `restricted > unrestricted`
 * precedence as {@link useGeoRestrictionMode} so the label always names the side that drives the mode.
 */
export function useGeoRestrictedTokenSymbol(): string | undefined {
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)
  const inputMode = useCurrencyGeoRestrictionMode(inputCurrency)
  const outputMode = useCurrencyGeoRestrictionMode(outputCurrency)

  for (const mode of ['restricted', 'unrestricted'] as const) {
    if (inputMode === mode) {
      return inputCurrency?.symbol
    }
    if (outputMode === mode) {
      return outputCurrency?.symbol
    }
  }
  return undefined
}

/**
 * Resolves the geo-restriction mode for the current swap, combining input and output with
 * precedence `restricted > unrestricted > default`. Fails open to `default` while the API loads.
 */
export function useGeoRestrictionMode(): GeoRestrictionMode {
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)

  const inputMode = useCurrencyGeoRestrictionMode(inputCurrency)
  const outputMode = useCurrencyGeoRestrictionMode(outputCurrency)

  if (inputMode === 'restricted' || outputMode === 'restricted') {
    return 'restricted'
  }
  if (inputMode === 'unrestricted' || outputMode === 'unrestricted') {
    return 'unrestricted'
  }
  return 'default'
}
