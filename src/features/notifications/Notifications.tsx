import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { store } from 'src/app/store'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import {
  DappLogoWithTxStatus,
  LogoWithTxStatus,
  SwapLogoOrLogoWithTxStatus,
} from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { CHAIN_INFO } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
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
  CopyNotification,
  SwapNetworkNotification as SwapNetworkNotificationType,
  SwapTxNotification,
  TransactionNotificationBase,
  TransferCurrencyTxNotification,
  TransferNFTTxNotification,
  WalletConnectNotification,
  WrapTxNotification,
} from 'src/features/notifications/types'
import {
  formApproveNotificationTitle,
  formSwapNotificationTitle,
  formTransferCurrencyNotificationTitle,
  formTransferNFTNotificationTitle,
  formUnknownTxTitle,
  formWCNotificationTitle,
  formWrapNotificationTitle,
} from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useCreateSwapFormState, useCreateWrapFormState } from 'src/features/transactions/hooks'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { iconSizes } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId } from 'src/utils/currencyId'

export const NOTIFICATION_ICON_SIZE = iconSizes.xxl

// Helpers to preload profile data, and dismiss swap and navigate
const useNavigateToProfileTab = (address: string | undefined) => {
  const { preload, navigate } = useEagerActivityNavigation()

  const onPressIn = () => {
    if (!address) return
    preload(address)
  }

  const onPress = () => {
    if (!address) return
    store.dispatch(closeModal({ name: ModalName.Swap }))
    navigate()
  }

  return {
    onPressIn,
    onPress,
  }
}

export function WCNotification({ notification }: { notification: WalletConnectNotification }) {
  const { imageUrl, chainId, address, event, hideDelay } = notification
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
      size={useSmallDisplay ? iconSizes.lg : NOTIFICATION_ICON_SIZE}
    />
  )

  const onPressNotification = () => {
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: ScannerModalState.ConnectedDapps,
      })
    )
  }

  return (
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      useSmallDisplay={useSmallDisplay}
      onPress={onPressNotification}
    />
  )
}

export function ApproveNotification({
  notification: { address, chainId, tokenAddress, spender, txStatus, txType, hideDelay },
}: {
  notification: ApproveTxNotification
}) {
  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
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
    hideDelay,
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

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}

export function WrapNotification({
  notification: {
    txId,
    txType,
    txStatus,
    currencyAmountRaw,
    address,
    hideDelay,
    unwrapped,
    chainId,
  },
}: {
  notification: WrapTxNotification
}) {
  const nativeCurrency = nativeOnChain(chainId)
  const wrappedNativeCurrency = nativeCurrency?.wrapped
  const inputCurrency = unwrapped ? wrappedNativeCurrency : nativeCurrency
  const outputCurrency = unwrapped ? nativeCurrency : wrappedNativeCurrency

  const title = formWrapNotificationTitle(
    txStatus,
    inputCurrency,
    outputCurrency,
    currencyAmountRaw,
    unwrapped
  )

  const wrapFormState = useCreateWrapFormState(
    address,
    chainId,
    txId,
    inputCurrency,
    outputCurrency
  )

  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: () => {
            dispatch(closeModal({ name: ModalName.Swap }))
            dispatch(openModal({ name: ModalName.Swap, initialState: wrapFormState ?? undefined }))
          },
        }
      : undefined

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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
          amountRaw={currencyAmountRaw}
          currency={outputCurrency}
          transactionStatus={txStatus}
          transactionType={txType}
        />
      }
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}

export function TransferCurrencyNotification({
  notification,
}: {
  notification: TransferCurrencyTxNotification
}) {
  const {
    address,
    assetType,
    chainId,
    tokenAddress,
    currencyAmountRaw,
    txType,
    txStatus,
    hideDelay,
  } = notification
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

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}

export function TransferNFTNotification({
  notification,
}: {
  notification: TransferNFTTxNotification
}) {
  const { address, assetType, chainId, tokenAddress, tokenId, txType, txStatus, hideDelay } =
    notification
  const userAddress = useAppSelector(selectActiveAccountAddress) || ''
  const senderOrRecipient =
    txType === TransactionType.Send ? notification.recipient : notification.sender
  const nftOwner = txType === TransactionType.Send ? notification.recipient : userAddress
  const { data: nft } = useNFT(nftOwner, tokenAddress, tokenId)
  const { name: ensName } = useENS(chainId, senderOrRecipient)
  const title = formTransferNFTNotificationTitle(
    txType,
    txStatus,
    nft,
    tokenAddress,
    tokenId,
    ensName ?? senderOrRecipient
  )

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

  const icon = (
    <LogoWithTxStatus
      assetType={assetType}
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
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}

export function UnknownTxNotification({
  notification: { address, chainId, tokenAddress, txStatus, txType, hideDelay },
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

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

  return (
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      title={title}
      onPress={onPress}
      onPressIn={onPressIn}
    />
  )
}

export function ErrorNotification({
  notification: { address, errorMessage, hideDelay },
}: {
  notification: AppErrorNotification
}) {
  return <NotificationToast address={address} hideDelay={hideDelay} title={errorMessage} />
}

export function DefaultNotification({
  notification: { address, title, hideDelay },
}: {
  notification: AppNotificationDefault
}) {
  return <NotificationToast address={address} hideDelay={hideDelay} title={title} />
}

export function CopiedNotification({
  notification: { hideDelay = 2000 },
}: {
  notification: CopyNotification
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <NotificationToast
      useSmallDisplay
      hideDelay={hideDelay}
      icon={
        <CheckCircle
          color={theme.colors.accentSuccess}
          height={iconSizes.lg}
          width={iconSizes.lg}
        />
      }
      title={t('Copied to clipboard')}
    />
  )
}

export function SwapNetworkNotification({
  notification: { chainId, hideDelay },
}: {
  notification: SwapNetworkNotificationType
}) {
  const { t } = useTranslation()
  const network = CHAIN_INFO[chainId].label

  return (
    <NotificationToast
      useSmallDisplay
      hideDelay={hideDelay}
      icon={<NetworkLogo chainId={chainId} size={iconSizes.lg} />}
      title={t('Swapping on {{ network }}', { network })}
    />
  )
}
