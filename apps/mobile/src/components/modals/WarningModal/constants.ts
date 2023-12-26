import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import WifiIcon from 'ui/src/assets/icons/wifi-slash.svg'
import { AppTFunction } from 'ui/src/i18n/types'

export const getNetworkWarning = (t: AppTFunction): Warning => ({
  type: WarningLabel.NetworkError,
  severity: WarningSeverity.Low,
  action: WarningAction.DisableReview,
  title: t('You’re offline'),
  icon: WifiIcon,
  message: t(
    'You may have lost internet connection or the network may be down. Please check your internet connection and try again.'
  ),
})
