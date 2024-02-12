// TODO(MOB-204): reduce file length
// consider splitting into multiple files
/* eslint-disable max-lines */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SvgUri } from 'react-native-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { useNavigateToProfileTab } from 'src/features/notifications/hooks/useNavigateToProfileTab'
import { Flex, Icons, useSporeColors } from 'ui/src'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import {
  DappLogoWithTxStatus,
  LogoWithTxStatus,
} from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'wallet/src/entities/assets'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useENS } from 'wallet/src/features/ens/useENS'
import { getCountryFlagSvgUrl } from 'wallet/src/features/fiatOnRamp/meld'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useNFT } from 'wallet/src/features/nfts/hooks'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { NOTIFICATION_ICON_SIZE } from 'wallet/src/features/notifications/constants'
import {
  AppErrorNotification,
  AppNotificationDefault,
  ApproveTxNotification,
  ChangeAssetVisibilityNotification as ChangeAssetVisibilityNotificationType,
  ChooseCountryNotification as ChooseCountryNotificationType,
  CopyNotification,
  CopyNotificationType,
  ScantasticCompleteNotification as ScantasticCompleteNotificationType,
  TransactionNotificationBase,
  TransferCurrencyTxNotification,
  TransferNFTTxNotification,
  WalletConnectNotification,
  WrapTxNotification,
} from 'wallet/src/features/notifications/types'
import {
  formApproveNotificationTitle,
  formTransferCurrencyNotificationTitle,
  formTransferNFTNotificationTitle,
  formUnknownTxTitle,
  formWCNotificationTitle,
  formWrapNotificationTitle,
} from 'wallet/src/features/notifications/utils'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'wallet/src/features/tokens/useCurrencyInfo'
import { useCreateWrapFormState } from 'wallet/src/features/transactions/hooks'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { ModalName } from 'wallet/src/telemetry/constants'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

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
        <CheckmarkCircle
          backgroundColor={colors.statusSuccess.val}
          checkmarkStrokeWidth={2}
          color={colors.sporeWhite.val}
          size={iconSizes.icon16}
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
    case CopyNotificationType.ContractAddress:
      title = t('Contract address copied')
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

export function ScantasticCompleteNotification({
  notification: { hideDelay },
}: {
  notification: ScantasticCompleteNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <NotificationToast
      hideDelay={hideDelay}
      icon={
        <Flex position="relative">
          <Flex backgroundColor="$accent2" borderRadius="$roundedFull" p="$spacing12">
            <Icons.Laptop color="$accent1" size="$icon.24" />
          </Flex>
          <Flex
            backgroundColor="$statusSuccess"
            borderRadius="$roundedFull"
            bottom={0}
            p="$spacing4"
            position="absolute"
            right={0}>
            <Icons.Check color="$white" size="$icon.8" />
          </Flex>
        </Flex>
      }
      subtitle={t('Continue on Uniswap Extension')}
      title={t('Success')}
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
