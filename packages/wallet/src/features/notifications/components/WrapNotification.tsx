import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { WrapTxNotification } from 'wallet/src/features/notifications/types'
import { formWrapNotificationTitle } from 'wallet/src/features/notifications/utils'
import {
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'wallet/src/features/tokens/useCurrencyInfo'
import { useCreateWrapFormState } from 'wallet/src/features/transactions/hooks'
import { TransactionStatus } from 'wallet/src/features/transactions/types'

export function WrapNotification({
  notification: { txId, txStatus, currencyAmountRaw, address, hideDelay, unwrapped, chainId },
}: {
  notification: WrapTxNotification
}): JSX.Element {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(chainId)
  const inputCurrencyInfo = unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo
  const outputCurrencyInfo = unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

  const title = formWrapNotificationTitle(
    formatter,
    txStatus,
    inputCurrencyInfo?.currency,
    outputCurrencyInfo?.currency,
    currencyAmountRaw,
    unwrapped
  )

  const wrapFormState = useCreateWrapFormState(
    address,
    chainId,
    txId,
    inputCurrencyInfo?.currency,
    outputCurrencyInfo?.currency
  )

  const { navigateToAccountActivityList, navigateToSwapFlow } = useWalletNavigation()

  const onRetry = (): void => {
    navigateToSwapFlow(wrapFormState ? { initialState: wrapFormState } : undefined)
  }

  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('common.button.retry'),
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
      onPress={navigateToAccountActivityList}
    />
  )
}
