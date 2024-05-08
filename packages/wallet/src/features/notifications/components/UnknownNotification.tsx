import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { AssetType } from 'wallet/src/entities/assets'
import { useENS } from 'wallet/src/features/ens/useENS'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { TransactionNotificationBase } from 'wallet/src/features/notifications/types'
import { formUnknownTxTitle } from 'wallet/src/features/notifications/utils'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export function UnknownTxNotification({
  notification: { address, chainId, tokenAddress, txStatus, txType, hideDelay },
}: {
  notification: TransactionNotificationBase
}): JSX.Element {
  const { name: ensName } = useENS(chainId, tokenAddress)
  const currencyInfo = useCurrencyInfo(
    tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined
  )
  const title = formUnknownTxTitle(txStatus, tokenAddress, ensName)
  const icon = (
    <LogoWithTxStatus
      assetType={AssetType.Currency}
      chainId={chainId}
      currencyInfo={currencyInfo}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  const { navigateToAccountActivityList } = useWalletNavigation()

  return (
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={navigateToAccountActivityList}
    />
  )
}
