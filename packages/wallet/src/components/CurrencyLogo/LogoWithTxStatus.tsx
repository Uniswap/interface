import type { IconProps } from '@tamagui/helpers-icon'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Icons, useTheme } from 'ui/src'
import WalletConnectLogo from 'ui/src/assets/icons/walletconnect.svg'
import MoonpayLogo from 'ui/src/assets/logos/svg/moonpay.svg'
import { Box } from 'ui/src/components/layout'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { logger } from 'utilities/src/logger/logger'
import { CurrencyLogo, STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import {
  NFTTradeType,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'

interface LogoWithTxStatusProps {
  assetType: AssetType
  txType: TransactionType
  txStatus: TransactionStatus
  size: number
  chainId: ChainId | null
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
  const { assetType, txType, txStatus, size, chainId } = props
  const theme = useTheme()

  const statusSize = size / 2

  const logo =
    txType === TransactionType.FiatPurchase ? (
      <MoonpayLogo height={size} width={size} />
    ) : assetType === AssetType.Currency ? (
      <CurrencyLogo hideNetworkLogo currencyInfo={props.currencyInfo} size={size} />
    ) : (
      <Box
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded4"
        height={size}
        justifyContent="center"
        overflow="hidden"
        width={size}>
        {props.nftImageUrl && <NFTViewer uri={props.nftImageUrl} />}
      </Box>
    )

  const fill = txStatus === TransactionStatus.Success ? theme.statusSuccess : theme.neutral2
  const color = theme.surface2

  let icon: JSX.Element | undefined
  if (chainId && chainId !== ChainId.Mainnet) {
    icon = <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
  } else {
    let Icon: React.NamedExoticComponent<IconProps> | undefined
    switch (txType) {
      case TransactionType.Approve:
      case TransactionType.NFTApprove:
        Icon = Icons.Approve
        break
      case TransactionType.Send:
        Icon = Icons.ArrowUpInCircle
        break
      case TransactionType.NFTTrade:
        if (assetType === AssetType.ERC721 || assetType === AssetType.ERC1155) {
          if (props.nftTradeType === NFTTradeType.SELL) {
            Icon = Icons.ArrowUpInCircle
          } else {
            Icon = Icons.ArrowDownInCircle
          }
        }
        break
      // Fiat purchases use the same icon as receive
      case TransactionType.FiatPurchase:
      case TransactionType.Receive:
      case TransactionType.NFTMint:
        Icon = Icons.ArrowDownInCircle
        break
      case TransactionType.Unknown:
        Icon = Icons.QuestionInCircle
        break
    }
    if (Icon) {
      icon = <Icon color={color.get()} fill={fill.get()} height={statusSize} width={statusSize} />
    }
  }

  useEffect(() => {
    if (!icon) {
      logger.warn(
        'statusIcon',
        'GenerateStatusIcon',
        'Could not find icon for transaction type:',
        txType
      )
    }
  }, [icon, txType])

  return (
    <Box alignItems="center" height={size} justifyContent="center" width={size}>
      {logo}
      {icon && (
        <Box bottom={-4} position="absolute" right={-4}>
          {icon}
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
  const theme = useTheme()
  const green = theme.statusSuccess.get()
  const yellow = theme.DEP_accentWarning.get()
  const fill = theme.surface1.get()

  const dappImageSize = size
  const statusSize = dappImageSize * (1 / 2)
  const totalSize = dappImageSize + statusSize * (1 / 4)

  const getStatusIcon = (): JSX.Element | undefined => {
    switch (event) {
      case WalletConnectEvent.NetworkChanged:
        return chainId ? (
          <TransactionSummaryNetworkLogo chainId={chainId} size={statusSize} />
        ) : undefined
      case WalletConnectEvent.TransactionConfirmed:
        return <Icons.Approve color={green} fill={fill} height={statusSize} width={statusSize} />
      case WalletConnectEvent.TransactionFailed:
        return (
          <Icons.AlertTriangle color={yellow} fill={fill} height={statusSize} width={statusSize} />
        )
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
      borderRadius: borderRadii.rounded4,
      height: dappImageSize,
      width: dappImageSize,
    },
    loaderContainer: {
      borderRadius: borderRadii.roundedFull,
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
  chainId,
}: {
  dappImageUrl: string | null
  dappName: string
  size: number
  chainId: ChainId | null
}): JSX.Element {
  const dappImageSize = size
  const statusSize = dappImageSize * STATUS_RATIO
  const totalSize = dappImageSize + statusSize * (1 / 4)
  const dappImage = dappImageUrl ? (
    <RemoteImage
      borderRadius={borderRadii.rounded4}
      height={dappImageSize}
      uri={dappImageUrl}
      width={dappImageSize}
    />
  ) : (
    <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
  )

  return (
    <Box height={totalSize} width={totalSize}>
      <Box left={2} top={0}>
        {dappImage}
      </Box>
      {chainId && chainId !== ChainId.Mainnet ? (
        <Box bottom={-2} position="absolute" right={-2}>
          <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
        </Box>
      ) : (
        <Box
          backgroundColor="$surface2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          borderWidth={2}
          bottom={-2}
          position="absolute"
          right={-2}>
          <WalletConnectLogo height={statusSize} width={statusSize} />
        </Box>
      )}
    </Box>
  )
}
