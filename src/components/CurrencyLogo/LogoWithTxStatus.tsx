import React from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Approve from 'src/assets/icons/approve.svg'
import IncomingArrow from 'src/assets/icons/arrow-down-in-circle.svg'
import OutgoingArrow from 'src/assets/icons/arrow-up-in-circle.svg'
import UnknownStatus from 'src/assets/icons/question-in-circle.svg'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import MoonpayLogo from 'src/assets/logos/moonpay.svg'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { ImageUri } from 'src/components/images/ImageUri'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box } from 'src/components/layout/Box'
import { DappIconPlaceholder } from 'src/components/WalletConnect/DappHeaderIcon'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { NFTTradeType, TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { logger } from 'src/utils/logger'

interface LogoWithTxStatusProps {
  assetType: AssetType
  txType: TransactionType
  txStatus: TransactionStatus
  size: number
}

interface DappLogoWithTxStatusProps {
  event: WalletConnectEvent
  size: number
  chainId: ChainId | null
  dappImageUrl: string | null
  dappName: string
}

interface SwapLogoOrLogoWithTxStatusProps {
  inputCurrencyInfo: NullUndefined<CurrencyInfo>
  outputCurrencyInfo: NullUndefined<CurrencyInfo>
  txStatus: TransactionStatus
  size: number
  showCancelIcon?: boolean
}

interface CurrencyStatusProps extends LogoWithTxStatusProps {
  assetType: AssetType.Currency
  currencyInfo?: CurrencyInfo | null
}

interface NFTStatusProps extends LogoWithTxStatusProps {
  assetType: AssetType.ERC721 | AssetType.ERC1155
  nftImageUrl?: string
  nftTradeType?: NFTTradeType
}

export function LogoWithTxStatus(props: CurrencyStatusProps | NFTStatusProps): JSX.Element {
  const { assetType, txType, txStatus, size } = props
  const theme = useAppTheme()

  const statusSize = size * (1 / 2)

  const logo =
    txType === TransactionType.FiatPurchase ? (
      <MoonpayLogo width={size} />
    ) : assetType === AssetType.Currency ? (
      <CurrencyLogo hideNetworkLogo currencyInfo={props.currencyInfo} size={size} />
    ) : (
      <Box
        alignItems="center"
        backgroundColor="background2"
        borderRadius="rounded4"
        height={size}
        justifyContent="center"
        overflow="hidden"
        width={size}>
        {props.nftImageUrl && <NFTViewer uri={props.nftImageUrl} />}
      </Box>
    )

  const fill = theme.colors.background0
  const gray = theme.colors.textSecondary
  const green = theme.colors.accentSuccess
  const yellow = theme.colors.accentWarning

  const getTxStatusIcon = (): JSX.Element | null => {
    if (txStatus === TransactionStatus.Failed) {
      return <AlertTriangle color={yellow} fill={fill} height={statusSize} width={statusSize} />
    }
    if (txStatus === TransactionStatus.Cancelled) {
      return (
        <SlashCircleIcon
          color={theme.colors.textSecondary}
          fill={theme.colors.background0}
          fillOpacity={1}
          height={statusSize}
          width={statusSize}
        />
      )
    }
    switch (txType) {
      case TransactionType.Approve:
        return <Approve color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.NFTApprove:
        return <Approve color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.Send:
        return <OutgoingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      // Fiat purchases use the same icon as receive
      case TransactionType.FiatPurchase:
      case TransactionType.Receive:
        return <IncomingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.NFTMint:
        return <IncomingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.NFTTrade:
        if (assetType === AssetType.ERC721 && props.nftTradeType === NFTTradeType.SELL) {
          return <OutgoingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
        }
        return <IncomingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.Unknown:
        return <UnknownStatus color={gray} fill={fill} height={statusSize} width={statusSize} />
    }
    logger.debug(
      'statusIcon',
      'GenerateStatusIcon',
      'Could not find icon for transaction type:',
      txType
    )
    return null
  }
  const statusIcon = getTxStatusIcon()
  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {logo}
      <Box bottom={-4} position="absolute" right={-4}>
        {statusIcon}
      </Box>
    </Box>
  )
}

export function SwapLogoOrLogoWithTxStatus({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
  txStatus,
  showCancelIcon,
}: SwapLogoOrLogoWithTxStatusProps): JSX.Element {
  if (
    txStatus === TransactionStatus.Failed ||
    (showCancelIcon && txStatus === TransactionStatus.Cancelled)
  ) {
    return (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        currencyInfo={inputCurrencyInfo}
        size={size}
        txStatus={txStatus}
        txType={TransactionType.Swap}
      />
    )
  }

  return (
    <Box height={size} width={size}>
      <Box left={0} position="absolute" testID="swap-success-toast" top={0}>
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size * (2 / 3)} />
      </Box>
      <Box bottom={0} position="absolute" right={0}>
        <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrencyInfo} size={size * (2 / 3)} />
      </Box>
    </Box>
  )
}

export function DappLogoWithTxStatus({
  dappName,
  dappImageUrl,
  event,
  size,
  chainId,
}: DappLogoWithTxStatusProps): JSX.Element | null {
  const theme = useAppTheme()
  const green = theme.colors.accentSuccess
  const yellow = theme.colors.accentWarning
  const fill = theme.colors.background0

  const dappImageSize = size
  const statusSize = dappImageSize * (1 / 2)
  const totalSize = dappImageSize + statusSize * (1 / 4)

  const getStatusIcon = (): JSX.Element | undefined => {
    switch (event) {
      case WalletConnectEvent.NetworkChanged:
        return chainId ? <NetworkLogo chainId={chainId} size={statusSize} /> : undefined
      case WalletConnectEvent.TransactionConfirmed:
        return <Approve color={green} fill={fill} height={statusSize} width={statusSize} />
      case WalletConnectEvent.TransactionFailed:
        return <AlertTriangle color={yellow} fill={fill} height={statusSize} width={statusSize} />
    }
  }

  const statusIcon = getStatusIcon()

  const fallback = (
    <Box height={dappImageSize}>
      <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
    </Box>
  )

  const style = StyleSheet.create({
    icon: {
      borderRadius: theme.borderRadii.rounded4,
      height: dappImageSize,
      width: dappImageSize,
    },
    loaderContainer: {
      borderRadius: theme.borderRadii.roundedFull,
      overflow: 'hidden',
    },
  })

  const dappImage = dappImageUrl ? (
    <ImageUri
      fallback={fallback}
      imageStyle={style.icon}
      loadingContainerStyle={{ ...style.icon, ...style.loaderContainer }}
      uri={dappImageUrl}
    />
  ) : (
    fallback
  )

  return statusIcon ? (
    <Box height={totalSize} width={totalSize}>
      <Box left={0} position="absolute" top={0}>
        {dappImage}
      </Box>
      <Box bottom={0} position="absolute" right={0}>
        {statusIcon}
      </Box>
    </Box>
  ) : (
    dappImage
  )
}

/** For displaying Dapp logo with generic WC bade icon */
export function DappLogoWithWCBadge({
  dappImageUrl,
  dappName,
  size,
}: {
  dappImageUrl: string | null
  dappName: string
  size: number
}): JSX.Element {
  const theme = useAppTheme()
  const dappImageSize = size
  const statusSize = dappImageSize * (1 / 2)
  const totalSize = dappImageSize + statusSize * (1 / 4)
  const dappImage = dappImageUrl ? (
    <RemoteImage
      borderRadius={theme.borderRadii.rounded4}
      height={dappImageSize}
      uri={dappImageUrl}
      width={dappImageSize}
    />
  ) : (
    <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
  )

  return (
    <Box height={totalSize} width={totalSize}>
      <Box left={4} position="absolute" top={0}>
        {dappImage}
      </Box>
      <Box
        backgroundColor="background1"
        borderRadius="rounded4"
        bottom={0}
        position="absolute"
        right={0}>
        <WalletConnectLogo fill="red" height={statusSize} width={statusSize} />
      </Box>
    </Box>
  )
}
