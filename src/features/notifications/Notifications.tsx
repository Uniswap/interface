import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { store } from 'src/app/store'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import {
  DappLogoWithTxStatus,
  LogoWithTxStatus,
  SwapLogoOrLogoWithTxStatus,
} from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { WalletConnectModalState } from 'src/components/WalletConnect/constants'
import { CHAIN_INFO } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useENS } from 'src/features/ens/useENS'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { useNFT } from 'src/features/nfts/hooks'
import BalanceUpdateDisplay from 'src/features/notifications/BalanceUpdateDisplay'
import { NotificationToast } from 'src/features/notifications/NotificationToast'
import {
  AppErrorNotification,
  AppNotificationDefault,
  ApproveTxNotification,
  FavoriteNotification as FavoriteNotificationType,
  SwapNetworkNotification as SwapNetworkNotificationType,
  SwapTxNotification,
  TransactionNotificationBase,
  TransferCurrencyTxNotification,
  TransferNFTTxNotification,
  WalletConnectNotification,
} from 'src/features/notifications/types'
import {
  formApproveNotificationTitle,
  formSwapNotificationTitle,
  formTransferCurrencyNotificationTitle,
  formTransferNFTNotificationTitle,
  formUnknownTxTitle,
  formWCNotificationTitle,
} from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useCreateSwapFormState } from 'src/features/transactions/hooks'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { Tabs } from 'src/screens/Screens'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId } from 'src/utils/currencyId'

export const NOTIFICATION_ICON_SIZE = 24

// TODO: once profile tab has screens for transaction details, navigate there instead
const navigateToProfileTab = () => {
  store.dispatch(closeModal({ name: ModalName.Swap }))
  navigate(Tabs.Profile)
}

export function WCNotification({ notification }: { notification: WalletConnectNotification }) {
  const { imageUrl, chainId, address, event } = notification
  const dispatch = useAppDispatch()
  const validChainId = toSupportedChainId(chainId)
  const title = formWCNotificationTitle(notification)

  const useSmallDisplayEvents = [
    WalletConnectEvent.Connected,
    WalletConnectEvent.Disconnected,
    WalletConnectEvent.NetworkChanged,
  ]
  const useSmallDisplay = useSmallDisplayEvents.includes(event)

  const icon = (
    <DappLogoWithTxStatus
      chainId={validChainId}
      dappImageUrl={imageUrl}
      event={event}
      size={NOTIFICATION_ICON_SIZE}
    />
  )

  const onPressNotification = () => {
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: WalletConnectModalState.ConnectedDapps,
      })
    )
  }

  return (
    <NotificationToast
      address={address}
      icon={icon}
      title={title}
      useSmallDisplay={useSmallDisplay}
      onPress={onPressNotification}
    />
  )
}

export function ApproveNotification({
  notification: { address, chainId, tokenAddress, spender, txStatus, txType },
}: {
  notification: ApproveTxNotification
}) {
  const currency = useCurrency(buildCurrencyId(chainId, tokenAddress))
  const title = formApproveNotificationTitle(txStatus, currency, tokenAddress, spender)
  const icon = (
    <LogoWithTxStatus
      assetType={AssetType.Currency}
      currency={currency}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast address={address} icon={icon} title={title} onPress={navigateToProfileTab} />
  )
}

export function SwapNotification({
  notification: {
    chainId,
    txId,
    txType,
    txStatus,
    inputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyId,
    outputCurrencyAmountRaw,
    tradeType,
    address,
  },
}: {
  notification: SwapTxNotification
}) {
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const title = formSwapNotificationTitle(
    txStatus,
    tradeType,
    inputCurrency,
    outputCurrency,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw
  )

  const swapFormState = useCreateSwapFormState(address, chainId, txId)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: () => {
            dispatch(closeModal({ name: ModalName.Swap }))
            dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState ?? undefined }))
          },
        }
      : undefined

  const icon = (
    <SwapLogoOrLogoWithTxStatus
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
    />
  )

  return (
    <NotificationToast
      actionButton={retryButton}
      address={address}
      balanceUpdate={
        <BalanceUpdateDisplay
          amountRaw={outputCurrencyAmountRaw}
          currency={outputCurrency}
          transactionStatus={txStatus}
          transactionType={txType}
        />
      }
      icon={icon}
      title={title}
      onPress={navigateToProfileTab}
    />
  )
}

export function TransferCurrencyNotification({
  notification,
}: {
  notification: TransferCurrencyTxNotification
}) {
  const { address, assetType, chainId, tokenAddress, currencyAmountRaw, txType, txStatus } =
    notification
  const senderOrRecipient =
    txType === TransactionType.Send ? notification.recipient : notification.sender
  const { name: ensName } = useENS(chainId, senderOrRecipient)
  const currency = useCurrency(buildCurrencyId(chainId, tokenAddress))

  const title = formTransferCurrencyNotificationTitle(
    txType,
    txStatus,
    currency,
    tokenAddress,
    currencyAmountRaw,
    ensName ?? senderOrRecipient
  )

  const icon = (
    <LogoWithTxStatus
      assetType={assetType}
      currency={currency}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast
      address={address}
      balanceUpdate={
        <BalanceUpdateDisplay
          amountRaw={currencyAmountRaw}
          currency={currency}
          transactionStatus={txStatus}
          transactionType={txType}
        />
      }
      icon={icon}
      title={title}
      onPress={navigateToProfileTab}
    />
  )
}

export function TransferNFTNotification({
  notification,
}: {
  notification: TransferNFTTxNotification
}) {
  const { address, assetType, chainId, tokenAddress, tokenId, txType, txStatus } = notification
  const userAddress = useAppSelector(selectActiveAccountAddress) || ''
  const senderOrRecipient =
    txType === TransactionType.Send ? notification.recipient : notification.sender
  const nftOwner = txType === TransactionType.Send ? notification.recipient : userAddress
  const { asset: nft } = useNFT(nftOwner, tokenAddress, tokenId)
  const { name: ensName } = useENS(chainId, senderOrRecipient)
  const title = formTransferNFTNotificationTitle(
    txType,
    txStatus,
    nft,
    tokenAddress,
    tokenId,
    ensName ?? senderOrRecipient
  )

  const icon = (
    <LogoWithTxStatus
      assetType={assetType}
      nftImageUrl={nft?.image_preview_url}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast address={address} icon={icon} title={title} onPress={navigateToProfileTab} />
  )
}

export function UnknownTxNotification({
  notification: { address, chainId, tokenAddress, txStatus, txType },
}: {
  notification: TransactionNotificationBase
}) {
  const { name: ensName } = useENS(chainId, tokenAddress)
  const currency = useCurrency(buildCurrencyId(chainId, tokenAddress ?? ''))
  const title = formUnknownTxTitle(txStatus, tokenAddress, ensName)
  const icon = (
    <LogoWithTxStatus
      assetType={AssetType.Currency}
      currency={currency}
      size={NOTIFICATION_ICON_SIZE}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast address={address} icon={icon} title={title} onPress={navigateToProfileTab} />
  )
}

export function ErrorNotification({
  notification: { address, errorMessage },
}: {
  notification: AppErrorNotification
}) {
  return <NotificationToast address={address} title={errorMessage} />
}

export function DefaultNotification({
  notification: { address, title },
}: {
  notification: AppNotificationDefault
}) {
  return <NotificationToast address={address} title={title} />
}

export function FavoriteNotification({
  notification: { currencyId, isAddition },
}: {
  notification: FavoriteNotificationType
}) {
  const { t } = useTranslation()
  const currency = useCurrency(currencyId)
  const title = isAddition ? t('Added to favorites') : t('Removed from favorites')
  const icon = <CurrencyLogoOrPlaceholder currency={currency} size={NOTIFICATION_ICON_SIZE} />
  return (
    <NotificationToast
      useSmallDisplay
      icon={icon}
      title={title}
      // TODO: re-enable when press on toasts are supported
      // onPress={() => navigate(Screens.TokenDetails, { currencyId })}
    />
  )
}

export function CopiedNotification() {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <NotificationToast
      useSmallDisplay
      icon={<CheckCircle color={theme.colors.accentSuccess} height={20} width={20} />}
      title={t('Copied to clipboard')}
    />
  )
}

export function SwapNetworkNotification({
  notification: { chainId },
}: {
  notification: SwapNetworkNotificationType
}) {
  const { t } = useTranslation()
  const network = CHAIN_INFO[chainId].label

  return (
    <NotificationToast
      useSmallDisplay
      icon={<NetworkLogo chainId={chainId} size={NOTIFICATION_ICON_SIZE} />}
      title={t('Swapping on {{ network }}', { network })}
    />
  )
}
