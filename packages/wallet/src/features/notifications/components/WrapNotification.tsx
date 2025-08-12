import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WrapTxNotification } from 'uniswap/src/features/notifications/types'
import { useNativeCurrencyInfo, useWrappedNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { formWrapNotificationTitle } from 'wallet/src/features/notifications/utils'
import { useCreateWrapFormState } from 'wallet/src/features/transactions/hooks/useCreateWrapFormState'

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

  const title = formWrapNotificationTitle({
    formatter,
    txStatus,
    inputCurrency: inputCurrencyInfo?.currency,
    outputCurrency: outputCurrencyInfo?.currency,
    currencyAmountRaw,
    unwrapped,
  })

  const wrapFormState = useCreateWrapFormState({
    address,
    chainId,
    txId,
    inputCurrency: inputCurrencyInfo?.currency,
    outputCurrency: outputCurrencyInfo?.currency,
  })

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
