import { Unitag } from 'ui/src/components/icons'
import { TransferNFTTxNotification } from 'uniswap/src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useNFT } from 'wallet/src/features/nfts/hooks'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import { formTransferNFTNotificationTitle } from 'wallet/src/features/notifications/utils'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

export function TransferNFTNotification({ notification }: { notification: TransferNFTTxNotification }): JSX.Element {
  const { address, assetType, chainId, tokenAddress, tokenId, txType, txStatus, hideDelay } = notification
  const userAddress = useActiveAccountAddressWithThrow()
  const senderOrRecipient = txType === TransactionType.Send ? notification.recipient : notification.sender
  const nftOwner = txType === TransactionType.Send ? notification.recipient : userAddress
  const { data: nft } = useNFT(nftOwner, tokenAddress, tokenId)
  const { name: displayName, type: displayNameType } =
    useDisplayName(senderOrRecipient, { includeUnitagSuffix: true }) ?? {}
  const showUnicon = txStatus !== TransactionStatus.Canceled && displayNameType === DisplayNameType.Unitag

  const title = formTransferNFTNotificationTitle(
    txType,
    txStatus,
    nft,
    tokenAddress,
    tokenId,
    displayName ?? senderOrRecipient,
  )

  const { navigateToAccountActivityList } = useWalletNavigation()

  const icon = (
    <LogoWithTxStatus
      assetType={assetType}
      chainId={chainId}
      nftImageUrl={nft?.thumbnail?.url ?? undefined}
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
