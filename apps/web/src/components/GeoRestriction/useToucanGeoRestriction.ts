import type { Currency } from '@uniswap/sdk-core'
import { hasUnrecognizedReason, isAckGated, isHardBlocked, useTokenComplianceStatus } from '@universe/compliance'
import { useTranslation } from 'react-i18next'
import { toComplianceTokenRef } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'

interface ToucanGeoRestriction {
  isGeoRestricted: boolean
  isGeoRestrictionPending: boolean
  unavailableLabel: string
}

/**
 * Supply-side geo-restriction for a single auction token, read straight from the per-token
 * compliance-v2 status — the source of truth for the geochecked issuer RWAs. Blocks ANY restriction
 * (hard-block OR acknowledgement-gated) with no bypass, and treats an unrecognized future reason as
 * restricted (fail-safe). LP-946.
 *
 * Unlike swap (which fails open while the status loads), the supply side fails CLOSED:
 * `isGeoRestrictionPending` is true until the check resolves, so callers keep the CTA disabled until
 * the token is confirmed clean rather than briefly enabling it. `isGeoRestricted` stays false while
 * pending, so the restricted messaging never flashes before it's confirmed.
 */
export function useToucanGeoRestriction(currency: Currency | undefined): ToucanGeoRestriction {
  const { t } = useTranslation()
  const { reasons, isLoading } = useTokenComplianceStatus(toComplianceTokenRef(currency))
  const isGeoRestricted = isHardBlocked(reasons) || isAckGated(reasons) || hasUnrecognizedReason(reasons)
  const tokenSymbol = currency?.symbol

  const unavailableLabel = tokenSymbol
    ? t('toucan.geoRestriction.button', { tokenSymbol })
    : t('toucan.geoRestriction.buttonGeneric')

  return {
    isGeoRestricted,
    isGeoRestrictionPending: Boolean(currency) && isLoading,
    unavailableLabel,
  }
}
