import { Wifi } from 'ui/src/components/icons/Wifi'
import { AppTFunction } from 'ui/src/i18n/types'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/features/transactions/WarningModal/types'

export const getNetworkWarning = (t: AppTFunction): Warning => ({
  type: WarningLabel.NetworkError,
  severity: WarningSeverity.Low,
  action: WarningAction.DisableReview,
  title: t('swap.warning.offline.title'),
  icon: Wifi,
  message: t('swap.warning.offline.message'),
})
