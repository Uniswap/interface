import { utils } from 'ethers'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import Approve from 'src/assets/icons/approve.svg'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box } from 'src/components/layout/Box'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { AssetType } from 'src/entities/assets'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { useENS } from 'src/features/ens/useENS'
import { openModal } from 'src/features/modals/modalSlice'
import { useNFT } from 'src/features/nfts/hooks'
import {
  NotificationToast,
  NOTIFICATION_SIZING,
} from 'src/features/notifications/NotificationToast'
import {
  AppErrorNotification,
  AppNotificationDefault,
  ApproveTxNotification,
  FavoriteNotification as FavoriteNotificationType,
  SwapTxNotification,
  TransactionNotificationBase,
  TransferCurrencyTxNotification,
  TransferNFTTxNotification,
  WalletConnectNotification,
} from 'src/features/notifications/types'
import {
  createBalanceUpdate,
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
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId } from 'src/utils/currencyId'

export function WCNotification({ notification }: { notification: WalletConnectNotification }) {
  const theme = useAppTheme()
  const { imageUrl, chainId, address, event } = notification
  const dispatch = useAppDispatch()
  const validChainId = toSupportedChainId(chainId)
  const title = formWCNotificationTitle(notification)
  const icon = (
    <>
      <RemoteImage
        borderRadius={NOTIFICATION_SIZING.primaryImage / 2}
        height={NOTIFICATION_SIZING.primaryImage}
        uri={imageUrl}
        width={NOTIFICATION_SIZING.primaryImage}
      />
      {(validChainId || event === WalletConnectEvent.Confirmed) && (
        <Box bottom={0} position="absolute" right={0}>
          {event === WalletConnectEvent.Confirmed ? (
            <Approve
              color={theme.colors.accentSuccess}
              fill={theme.colors.mainBackground}
              height={NOTIFICATION_SIZING.secondaryImage}
              width={NOTIFICATION_SIZING.secondaryImage}
            />
          ) : (
            <NetworkLogo chainId={validChainId!} size={NOTIFICATION_SIZING.secondaryImage} />
          )}
        </Box>
      )}
    </>
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
    <NotificationToast address={address} icon={icon} title={title} onPress={onPressNotification} />
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
      size={NOTIFICATION_SIZING}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return <NotificationToast address={address} icon={icon} title={title} />
}

export function SwapNotification({
  notification: {
    chainId,
    txHash,
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

  const swapFormState = useCreateSwapFormState(address, chainId, txHash)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: () =>
            dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState ?? undefined })),
        }
      : undefined

  const { spotPrices } = useSpotPrices([outputCurrency])
  const balanceUpdate = createBalanceUpdate(
    txType,
    txStatus,
    outputCurrency,
    outputCurrencyAmountRaw,
    spotPrices
  )

  const icon =
    txStatus === TransactionStatus.Success ? (
      <>
        <Box left={0} position="absolute" testID="swap-success-toast" top={0}>
          <CurrencyLogoOrPlaceholder
            currency={inputCurrency}
            size={NOTIFICATION_SIZING.primaryImage}
          />
        </Box>
        <Box bottom={0} position="absolute" right={0}>
          <CurrencyLogoOrPlaceholder
            currency={outputCurrency}
            size={NOTIFICATION_SIZING.primaryImage}
          />
        </Box>
      </>
    ) : (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        currency={inputCurrency}
        size={NOTIFICATION_SIZING}
        txStatus={txStatus}
        txType={txType}
      />
    )

  return (
    <NotificationToast
      actionButton={retryButton}
      address={address}
      balanceUpdate={balanceUpdate}
      icon={icon}
      title={title}
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
  const { spotPrices } = useSpotPrices([currency])
  const balanceUpdate = createBalanceUpdate(
    txType,
    txStatus,
    currency,
    currencyAmountRaw,
    spotPrices
  )
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
      size={NOTIFICATION_SIZING}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return (
    <NotificationToast address={address} balanceUpdate={balanceUpdate} icon={icon} title={title} />
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
  const { asset: nft } = useNFT(nftOwner, utils.getAddress(tokenAddress), tokenId)
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
      nft={nft}
      size={NOTIFICATION_SIZING}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return <NotificationToast address={address} icon={icon} title={title} />
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
      size={NOTIFICATION_SIZING}
      txStatus={txStatus}
      txType={txType}
    />
  )

  return <NotificationToast address={address} icon={icon} title={title} />
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
  const title = isAddition ? t('Added to favorite tokens') : t('Removed from favorite tokens')
  const icon = (
    <CurrencyLogoOrPlaceholder currency={currency} size={NOTIFICATION_SIZING.primaryImage} />
  )
  return (
    <NotificationToast
      icon={icon}
      title={title}
      // TODO: re-enable when press on toasts are supported
      // onPress={() => navigate(Screens.TokenDetails, { currencyId })}
    />
  )
}
