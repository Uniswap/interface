import { AlertTriangleFilled, CheckmarkCircle } from 'ui/src/components/icons'
import { AssetType } from 'uniswap/src/entities/assets'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { TransactionNotificationBase } from 'uniswap/src/features/notifications/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { formUnknownTxTitle } from 'wallet/src/features/notifications/utils'

export function UnknownTxNotification({
  notification: { address, chainId, tokenAddress, txStatus, txType, hideDelay },
}: {
  notification: TransactionNotificationBase
}): JSX.Element {
  const { name: ensName } = useENS({ nameOrAddress: tokenAddress, chainId })
  const currencyInfo = useCurrencyInfo(tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined)
  const title = formUnknownTxTitle(txStatus, tokenAddress, ensName)
  const icon = currencyInfo ? (
    <LogoWithTxStatus
      assetType={AssetType.Currency}
      chainId={chainId}
      currencyInfo={currencyInfo}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  ) : txStatus === TransactionStatus.Success ? (
    <CheckmarkCircle size="$icon.24" />
  ) : (
    <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
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
