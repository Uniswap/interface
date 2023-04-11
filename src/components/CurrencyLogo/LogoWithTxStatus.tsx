import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Approve from 'src/assets/icons/approve.svg'
import IncomingArrow from 'src/assets/icons/arrow-down-in-circle.svg'
import OutgoingArrow from 'src/assets/icons/arrow-up-in-circle.svg'
import UnknownStatus from 'src/assets/icons/question-in-circle.svg'
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

  const statusSize = size / 2

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

  const fill =
    txStatus === TransactionStatus.Success ? theme.colors.accentSuccess : theme.colors.textSecondary
  const color = theme.colors.background1

  let Icon: React.FC<SvgProps> | undefined
  switch (txType) {
    case TransactionType.Approve:
    case TransactionType.NFTApprove:
      Icon = Approve
      break
    case TransactionType.Send:
      Icon = OutgoingArrow
      break
    case TransactionType.NFTTrade:
      if (
        (assetType === AssetType.ERC721 || assetType === AssetType.ERC1155) &&
        props.nftTradeType === NFTTradeType.SELL
      ) {
        Icon = OutgoingArrow
      }
      break
    // Fiat purchases use the same icon as receive
    case TransactionType.FiatPurchase:
    case TransactionType.Receive:
    case TransactionType.NFTMint:
      Icon = IncomingArrow
      break
    case TransactionType.Unknown:
      Icon = UnknownStatus
      break
  }

  useEffect(() => {
    if (!Icon) {
      logger.warn(
        'statusIcon',
        'GenerateStatusIcon',
        'Could not find icon for transaction type:',
        txType
      )
    }
  }, [Icon, txType])

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {logo}
      {Icon && (
        <Box bottom={-4} position="absolute" right={-4}>
          <Icon color={color} fill={fill} height={statusSize} width={statusSize} />
        </Box>
      )}
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
