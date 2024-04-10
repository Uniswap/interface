import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import type { IconProps } from 'ui/src'
import { Flex, Icons, useSporeColors } from 'ui/src'
import WalletConnectLogo from 'ui/src/assets/icons/walletconnect.svg'
import MoonpayLogo from 'ui/src/assets/logos/svg/moonpay.svg'
import { borderRadii } from 'ui/src/theme'
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

interface LogoWithTxStatusBaseProps {
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

interface CurrencyStatusProps extends LogoWithTxStatusBaseProps {
  assetType: AssetType.Currency
  currencyInfo?: CurrencyInfo | null
}

interface NFTStatusProps extends LogoWithTxStatusBaseProps {
  assetType: AssetType.ERC721 | AssetType.ERC1155
  nftImageUrl?: string
  nftTradeType?: NFTTradeType
}

type LogoWithTxStatusProps = (CurrencyStatusProps | NFTStatusProps) & {
  serviceProviderLogoUrl?: string
  institutionLogoUrl?: string
}

function getLogo(props: LogoWithTxStatusProps): JSX.Element {
  const { assetType, txType, size, serviceProviderLogoUrl, institutionLogoUrl } = props

  if (txType === TransactionType.FiatPurchase) {
    if (institutionLogoUrl) {
      return <ImageUri imageStyle={{ height: size, width: size }} uri={institutionLogoUrl} />
    }
    if (serviceProviderLogoUrl) {
      return (
        <ImageUri
          imageStyle={{
            height: size,
            width: size,
          }}
          uri={serviceProviderLogoUrl}
        />
      )
    }
    return <MoonpayLogo height={size} width={size} />
  }

  return assetType === AssetType.Currency ? (
    <CurrencyLogo hideNetworkLogo currencyInfo={props.currencyInfo} size={size} />
  ) : (
    <Flex
      centered
      backgroundColor="$surface2"
      borderRadius="$rounded4"
      height={size}
      overflow="hidden"
      width={size}>
      {props.nftImageUrl && <NFTViewer uri={props.nftImageUrl} />}
    </Flex>
  )
}

export function LogoWithTxStatus(props: LogoWithTxStatusProps): JSX.Element {
  const { assetType, txType, txStatus, size, chainId } = props
  const colors = useSporeColors()

  const statusSize = size / 2

  const logo = getLogo(props)

  const fill = txStatus === TransactionStatus.Success ? colors.statusSuccess : colors.neutral2
  const color = colors.surface2

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
      icon = <Icon color={color.val} fill={fill.val} size={statusSize} />
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
    <Flex centered height={size} width={size}>
      {logo}
      {icon && (
        <Flex bottom={-4} position="absolute" right={-4}>
          {icon}
        </Flex>
      )}
    </Flex>
  )
}

export function DappLogoWithTxStatus({
  dappName,
  dappImageUrl,
  event,
  size,
  chainId,
}: DappLogoWithTxStatusProps): JSX.Element | null {
  const colors = useSporeColors()
  const green = colors.statusSuccess.val
  const yellow = colors.DEP_accentWarning.val
  const fill = colors.surface1.val

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
        return <Icons.Approve color={green} fill={fill} size={statusSize} />
      case WalletConnectEvent.TransactionFailed:
        return <Icons.AlertTriangle color={yellow} fill={fill} size={statusSize} />
    }
  }

  const statusIcon = getStatusIcon()

  const fallback = (
    <Flex height={dappImageSize}>
      <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
    </Flex>
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
    <Flex height={totalSize} width={totalSize}>
      <Flex left={0} position="absolute" top={0}>
        {dappImage}
      </Flex>
      <Flex bottom={0} position="absolute" right={0}>
        {statusIcon}
      </Flex>
    </Flex>
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
    <Flex height={totalSize} width={totalSize}>
      <Flex left={2} top={0}>
        {dappImage}
      </Flex>
      {chainId && chainId !== ChainId.Mainnet ? (
        <Flex bottom={-2} position="absolute" right={-2}>
          <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
        </Flex>
      ) : (
        <Flex
          backgroundColor="$surface2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          borderWidth={2}
          bottom={-2}
          position="absolute"
          right={-2}>
          <WalletConnectLogo height={statusSize} width={statusSize} />
        </Flex>
      )}
    </Flex>
  )
}
