import WifiIcon from 'ui/src/assets/icons/wifi-slash.svg'
import { AppTFunction } from 'ui/src/i18n/types'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'wallet/src/features/transactions/WarningModal/types'

export const getNetworkWarning = (t: AppTFunction): Warning => ({
  type: WarningLabel.NetworkError,
  severity: WarningSeverity.Low,
  action: WarningAction.DisableReview,
  title: t('swap.warning.offline.title'),
  icon: WifiIcon,
  message: t('swap.warning.offline.message'),
})
