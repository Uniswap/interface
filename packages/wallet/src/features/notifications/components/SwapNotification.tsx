import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { SwapTxNotification } from 'wallet/src/features/notifications/types'
import { formSwapNotificationTitle } from 'wallet/src/features/notifications/utils'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { TransactionStatus } from 'wallet/src/features/transactions/types'

export function SwapNotification({
  notification: {
    chainId,
    txStatus,
    inputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyId,
    outputCurrencyAmountRaw,
    tradeType,
    address,
    hideDelay,
  },
  onPress,
  onPressIn,
  onRetry,
}: {
  notification: SwapTxNotification
  onPress: () => void
  onPressIn?: () => void
  onRetry: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()
  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)

  const title = formSwapNotificationTitle(
    formatter,
    txStatus,
    inputCurrencyInfo?.currency,
    outputCurrencyInfo?.currency,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
    tradeType
  )

  const { t } = useTranslation()

  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: onRetry,
        }
      : undefined

  const icon = (
    <SplitLogo
      chainId={chainId}
      inputCurrencyInfo={inputCurrencyInfo}
      outputCurrencyInfo={outputCurrencyInfo}
      size={NOTIFICATION_ICON_SIZE}
    />
  )

  return (
    <NotificationToast
      actionButton={retryButton}
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}
