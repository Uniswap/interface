// TODO(MOB-204): reduce file length
// consider splitting into multiple files
/* eslint-disable max-lines */
import React from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { SvgUri } from 'react-native-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerActivityNavigation } from 'src/app/navigation/hooks'
import { store } from 'src/app/store'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { closeAllModals, closeModal, openModal } from 'src/features/modals/modalSlice'
import { NotificationToast } from 'src/features/notifications/NotificationToast'
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
import { useCreateSwapFormState, useCreateWrapFormState } from 'src/features/transactions/hooks'
import { Flex, useSporeColors } from 'ui/src'
import CheckCircle from 'ui/src/assets/icons/check-circle.svg'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  DappLogoWithTxStatus,
  LogoWithTxStatus,
} from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { getCountryFlagSvgUrl } from 'wallet/src/features/fiatOnRamp/meld'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useNFT } from 'wallet/src/features/nfts/hooks'
import {
  AppErrorNotification,
  AppNotificationDefault,
  ApproveTxNotification,
  ChangeAssetVisibilityNotification as ChangeAssetVisibilityNotificationType,
  ChooseCountryNotification as ChooseCountryNotificationType,
  CopyNotification,
  CopyNotificationType,
  SwapNetworkNotification as SwapNetworkNotificationType,
  SwapPendingNotification as SwapPendingNotificationType,
  SwapTxNotification,
  TransactionNotificationBase,
  TransferCurrencyTxNotification,
  TransferNFTTxNotification,
  WalletConnectNotification,
  WrapTxNotification,
} from 'wallet/src/features/notifications/types'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  TransactionStatus,
  TransactionType,
  WrapType,
} from 'wallet/src/features/transactions/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export const NOTIFICATION_ICON_SIZE = iconSizes.icon36

// Helpers to preload profile data, and dismiss modals and navigate
const useNavigateToProfileTab = (
  address: string | undefined
): {
  onPressIn: () => Promise<void>
  onPress: () => void
} => {
  const { preload, navigate } = useEagerActivityNavigation()

  const onPressIn = async (): Promise<void> => {
    if (!address) return
    await preload(address)
  }

  const onPress = (): void => {
    if (!address) return
    navigate()
    store.dispatch(closeAllModals())
  }

  return {
    onPressIn,
    onPress,
  }
}

export function WCNotification({
  notification,
}: {
  notification: WalletConnectNotification
}): JSX.Element {
  const { imageUrl, chainId, address, event, hideDelay, dappName } = notification
  const dispatch = useAppDispatch()
  const validChainId = toSupportedChainId(chainId)
  const title = formWCNotificationTitle(notification)

  const smallToastEvents = [
    WalletConnectEvent.Connected,
    WalletConnectEvent.Disconnected,
    WalletConnectEvent.NetworkChanged,
  ]
  const smallToast = smallToastEvents.includes(event)

  const icon = (
    <DappLogoWithTxStatus
      chainId={validChainId}
      dappImageUrl={imageUrl}
      dappName={dappName}
      event={event}
      size={smallToast ? iconSizes.icon24 : NOTIFICATION_ICON_SIZE}
    />
  )

  const onPressNotification = (): void => {
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
      smallToast={smallToast}
      title={title}
      onPress={onPressNotification}
    />
  )
}

export function ApproveNotification({
  notification: { address, chainId, tokenAddress, spender, txStatus, txType, hideDelay },
}: {
  notification: ApproveTxNotification
}): JSX.Element {
  const { onPress, onPressIn } = useNavigateToProfileTab(address)

  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))
  const title = formApproveNotificationTitle(
    txStatus,
    currencyInfo?.currency,
    tokenAddress,
    spender
  )
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

  const swapFormState = useCreateSwapFormState(address, chainId, txId)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: (): void => {
            dispatch(closeModal({ name: ModalName.Swap }))
            dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState ?? undefined }))
          },
        }
      : undefined

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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

export function WrapNotification({
  notification: { txId, txStatus, currencyAmountRaw, address, hideDelay, unwrapped, chainId },
}: {
  notification: WrapTxNotification
}): JSX.Element {
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

  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('Retry'),
          onPress: (): void => {
            dispatch(closeModal({ name: ModalName.Swap }))
            dispatch(openModal({ name: ModalName.Swap, initialState: wrapFormState ?? undefined }))
          },
        }
      : undefined

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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

export function TransferCurrencyNotification({
  notification,
}: {
  notification: TransferCurrencyTxNotification
}): JSX.Element {
  const formatter = useLocalizationContext()
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
  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))

  const title = formTransferCurrencyNotificationTitle(
    formatter,
    txType,
    txStatus,
    currencyInfo?.currency,
    tokenAddress,
    currencyAmountRaw,
    ensName ?? senderOrRecipient
  )

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

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
}): JSX.Element {
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
}): JSX.Element {
  return <NotificationToast address={address} hideDelay={hideDelay} title={errorMessage} />
}

export function DefaultNotification({
  notification: { address, title, hideDelay },
}: {
  notification: AppNotificationDefault
}): JSX.Element {
  return <NotificationToast address={address} hideDelay={hideDelay} title={title} />
}

export function SuccessNotification({
  notification: { hideDelay = 2000, title },
}: {
  notification: Pick<AppNotificationDefault, 'title' | 'hideDelay'>
}): JSX.Element | null {
  const colors = useSporeColors()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        <CheckCircle
          color={colors.statusSuccess.val}
          height={iconSizes.icon24}
          strokeWidth={1.5}
          width={iconSizes.icon24}
        />
      }
      title={title}
    />
  )
}

export function CopiedNotification({
  notification: { hideDelay = 2000, copyType },
}: {
  notification: CopyNotification
}): JSX.Element | null {
  const { t } = useTranslation()

  let title
  switch (copyType) {
    case CopyNotificationType.Address:
      title = t('Address copied')
      break
    case CopyNotificationType.TransactionId:
      title = t('Transaction ID copied')
      break
    case CopyNotificationType.Image:
      title = t('Image copied')
      break
  }

  return <SuccessNotification notification={{ title, hideDelay }} />
}

export function SwapNetworkNotification({
  notification: { chainId, hideDelay },
}: {
  notification: SwapNetworkNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const network = CHAIN_INFO[chainId].label

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<NetworkLogo chainId={chainId} size={iconSizes.icon24} />}
      title={t('Swapping on {{ network }}', { network })}
    />
  )
}

export function ChooseCountryNotification({
  notification: { countryName, countryCode, hideDelay },
}: {
  notification: ChooseCountryNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const countryFlagUrl = getCountryFlagSvgUrl(countryCode)
  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        <Flex borderRadius="$roundedFull" overflow="hidden">
          <SvgUri height={iconSizes.icon20} uri={countryFlagUrl} width={iconSizes.icon20} />
        </Flex>
      }
      title={t('Switched to {{name}}', { name: countryName })}
    />
  )
}

export function ChangeAssetVisibilityNotification({
  notification: { visible, hideDelay, assetName },
}: {
  notification: ChangeAssetVisibilityNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        visible ? (
          <EyeOffIcon
            color={colors.neutral1.get()}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        ) : (
          <EyeIcon
            color={colors.neutral1.get()}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        )
      }
      title={
        visible
          ? t('{{assetName}} hidden', { assetName })
          : t('{{assetName}} unhidden', { assetName })
      }
    />
  )
}

// We roughly track the L1 block time, accuracy isnt crucial because we have other pending states,
// and when a txn confirms it ll replace this toast.
const SWAP_PENDING_NOTIFICATION_DELAY = 10 * ONE_SECOND_MS

export function SwapPendingNotification({
  notification,
}: {
  notification: SwapPendingNotificationType
}): JSX.Element {
  const { t } = useTranslation()

  const notificationText = getNotificationText(notification.wrapType, t)

  return (
    <NotificationToast
      smallToast
      hideDelay={SWAP_PENDING_NOTIFICATION_DELAY}
      icon={<SpinningLoader color="$accent1" />}
      title={notificationText}
    />
  )
}

function getNotificationText(wrapType: WrapType, t: TFunction): string {
  switch (wrapType) {
    case WrapType.NotApplicable:
      return t('Swap pending')
    case WrapType.Unwrap:
      return t('Unwrap pending')
    case WrapType.Wrap:
      return t('Wrap pending')
  }
}
