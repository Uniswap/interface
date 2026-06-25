import type { TFunction } from 'i18next'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import type { GeoRestrictionMode } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'

export function getGeoRestrictionWarning({
  t,
  mode,
  tokenSymbol,
}: {
  t: TFunction
  mode: GeoRestrictionMode
  tokenSymbol?: string
}): Warning | undefined {
  if (mode !== 'restricted') {
    return undefined
  }

  return {
    type: WarningLabel.GeoRestricted,
    severity: WarningSeverity.Blocked,
    action: WarningAction.DisableReview,
    buttonText: tokenSymbol ? t('swap.geoRestriction.button', { tokenSymbol }) : t('common.notAvailableInRegion.error'),
  }
}
