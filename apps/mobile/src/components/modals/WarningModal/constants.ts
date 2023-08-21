import {
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { AppTFunction } from 'ui/src/i18n/types'

export const getNetworkWarning = (
  t: AppTFunction
): {
  type: WarningLabel
  severity: WarningSeverity
  action: WarningAction
  title: string
  message: string
} => ({
  type: WarningLabel.NetworkError,
  severity: WarningSeverity.Medium,
  action: WarningAction.DisableReview,
  title: t('Network connection error'),
  message: t(
    'You may have lost internet connection or the network may be down. Please check your internet connection and try again.'
  ),
})
