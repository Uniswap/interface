import { Unitag } from 'ui/src/components/icons'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NOTIFICATION_ICON_SIZE } from 'uniswap/src/features/notifications/constants'
import { TransferCurrencyTxNotification } from 'uniswap/src/features/notifications/slice/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { formTransferCurrencyNotificationTitle } from 'wallet/src/features/notifications/utils'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export function TransferCurrencyNotification({
  notification,
}: {
  notification: TransferCurrencyTxNotification
}): JSX.Element {
  const formatter = useLocalizationContext()
  const { address, assetType, chainId, tokenAddress, currencyAmountRaw, txType, txStatus, hideDelay } = notification
  const senderOrRecipient = txType === TransactionType.Send ? notification.recipient : notification.sender
  const { name: displayName, type: displayNameType } =
    useDisplayName(senderOrRecipient, { includeUnitagSuffix: false }) ?? {}
  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))
  // Transfer canceled title doesn't end with the display name
  const showUnicon = txStatus !== TransactionStatus.Canceled && displayNameType === DisplayNameType.Unitag

  const title = formTransferCurrencyNotificationTitle({
    formatter,
    txType,
    txStatus,
    currency: currencyInfo?.currency,
    tokenAddress,
    currencyAmountRaw,
    senderOrRecipient: displayNameType !== DisplayNameType.Address && displayName ? displayName : senderOrRecipient,
  })

  const { navigateToAccountActivityList } = useWalletNavigation()

  const icon = (
    <LogoWithTxStatus
      assetType={assetType}
      chainId={chainId}
      currencyInfo={currencyInfo}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      postCaptionElement={showUnicon ? <Unitag size="$icon.24" /> : undefined}
      title={title}
      onPress={navigateToAccountActivityList}
    />
  )
}
