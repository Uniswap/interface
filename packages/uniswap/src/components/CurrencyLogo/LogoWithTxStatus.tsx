import React, { useEffect } from 'react'
import type { IconProps } from 'ui/src'
import { Flex, UniversalImage, UniversalImageResizeMode, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Approve } from 'ui/src/components/icons/Approve'
import { ArrowDownInCircle } from 'ui/src/components/icons/ArrowDownInCircle'
import { ArrowUpInCircle } from 'ui/src/components/icons/ArrowUpInCircle'
import { QuestionInCircle } from 'ui/src/components/icons/QuestionInCircle'
import { Walletconnect } from 'ui/src/components/icons/Walletconnect'
import { borderRadii, zIndexes } from 'ui/src/theme'
import { CurrencyLogo, STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { ImageUri } from 'uniswap/src/components/nfts/images/ImageUri'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  NFTTradeType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'

interface LogoWithTxStatusBaseProps {
  assetType: AssetType
  txType: TransactionType
  txStatus: TransactionStatus
  size: number
  chainId: UniverseChainId | null
}

interface DappLogoWithTxStatusProps {
  event: WalletConnectEvent
  size: number
  chainId: UniverseChainId | null
  dappImageUrl: Maybe<string>
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

export type LogoWithTxStatusProps = (CurrencyStatusProps | NFTStatusProps) & {
  serviceProviderLogoUrl?: string
  institutionLogoUrl?: string
}

function getLogo(props: LogoWithTxStatusProps): JSX.Element {
  const { assetType, size } = props
  return assetType === AssetType.Currency ? (
    <CurrencyLogo hideNetworkLogo currencyInfo={props.currencyInfo} size={size} />
  ) : (
    <Flex
      centered
      backgroundColor="$surface2"
      borderRadius="$rounded4"
      height={size}
      overflow="hidden"
      testID="nft-viewer"
      width={size}
    >
      {props.nftImageUrl && <NFTViewer uri={props.nftImageUrl} />}
    </Flex>
  )
}

/* eslint-disable complexity */
export function LogoWithTxStatus(props: LogoWithTxStatusProps): JSX.Element {
  const { assetType, txType, txStatus, size, chainId } = props
  const colors = useSporeColors()

  const statusSize = size / 2

  const logo = getLogo(props)

  const fill = txStatus === TransactionStatus.Success ? colors.statusSuccess : colors.neutral2
  const color = colors.surface2

  let icon: JSX.Element | undefined
  if (chainId && chainId !== UniverseChainId.Mainnet) {
    icon = <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
  } else {
    let Icon: React.NamedExoticComponent<IconProps> | undefined
    switch (txType) {
      case TransactionType.Approve:
      case TransactionType.NFTApprove:
        Icon = Approve
        break
      case TransactionType.Send:
      case TransactionType.OffRampSale:
        Icon = ArrowUpInCircle
        break
      case TransactionType.NFTTrade:
        if (assetType === AssetType.ERC721 || assetType === AssetType.ERC1155) {
          if (props.nftTradeType === NFTTradeType.SELL) {
            Icon = ArrowUpInCircle
          } else {
            Icon = ArrowDownInCircle
          }
        }
        break
      // Fiat purchases use the same icon as receive
      case TransactionType.OnRampPurchase:
      case TransactionType.OnRampTransfer:
      case TransactionType.Receive:
      case TransactionType.NFTMint:
      case TransactionType.LPIncentivesClaimRewards:
      case TransactionType.ClaimUni:
        Icon = ArrowDownInCircle
        break
      case TransactionType.Unknown:
        Icon = QuestionInCircle
        break
    }
    if (Icon) {
      icon = <Icon color={color.val} fill={fill.val} size={statusSize} testID="status-icon" />
    }
  }

  useEffect(() => {
    if (!icon) {
      logger.warn('statusIcon', 'GenerateStatusIcon', 'Could not find icon for transaction type:', txType)
    }
  }, [icon, txType])

  return (
    <Flex centered height={size} width={size}>
      {logo}
      {icon && (
        <Flex bottom={-4} position="absolute" right={-4} zIndex={zIndexes.mask}>
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
  const yellow = colors.statusWarning.val
  const fill = colors.surface1.val

  const dappImageSize = size
  const statusSize = dappImageSize * (1 / 2)
  const totalSize = dappImageSize + statusSize * (1 / 4)

  const getStatusIcon = (): JSX.Element | undefined => {
    switch (event) {
      case WalletConnectEvent.NetworkChanged:
        return chainId ? <TransactionSummaryNetworkLogo chainId={chainId} size={statusSize} /> : undefined
      case WalletConnectEvent.TransactionConfirmed:
        return <Approve color={green} fill={fill} size={statusSize} testID="icon-approve" />
      case WalletConnectEvent.TransactionFailed:
        return <AlertTriangleFilled color={yellow} fill={fill} size={statusSize} testID="icon-alert" />
      default:
        return undefined
    }
  }

  const statusIcon = getStatusIcon()

  const fallback = (
    <Flex height={dappImageSize} testID="image-fallback">
      <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
    </Flex>
  )

  const iconStyle = {
    borderRadius: borderRadii.rounded4,
    height: dappImageSize,
    width: dappImageSize,
  }

  const dappImage = dappImageUrl ? (
    <ImageUri
      fallback={fallback}
      imageStyle={iconStyle}
      loadingContainerStyle={{ ...iconStyle, borderRadius: borderRadii.roundedFull, overflow: 'hidden' }}
      testID="dapp-image"
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
  hideWCBadge = false,
  circular = false,
}: {
  dappImageUrl: Maybe<string>
  dappName: string
  size: number
  chainId: UniverseChainId | null
  hideWCBadge?: boolean
  circular?: boolean
}): JSX.Element {
  const dappImageSize = size
  const statusSize = dappImageSize * STATUS_RATIO
  const totalSize = dappImageSize + statusSize * (1 / 4)
  const dappImage = dappImageUrl ? (
    <UniversalImage
      size={{
        height: dappImageSize,
        width: dappImageSize,
        resizeMode: UniversalImageResizeMode.Contain,
      }}
      style={{
        image: {
          borderRadius: circular ? borderRadii.roundedFull : borderRadii.rounded4,
        },
      }}
      testID="dapp-image"
      uri={dappImageUrl}
    />
  ) : (
    <DappIconPlaceholder iconSize={dappImageSize} name={dappName} />
  )

  return (
    <Flex centered height={totalSize} width={totalSize}>
      <Flex left={2} top={0}>
        {dappImage}
      </Flex>
      {chainId && chainId !== UniverseChainId.Mainnet ? (
        <Flex bottom={-2} position="absolute" right={-2}>
          <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
        </Flex>
      ) : !hideWCBadge ? (
        <Flex
          backgroundColor="$surface2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          borderWidth="$spacing2"
          bottom={-2}
          position="absolute"
          right={-2}
        >
          <Walletconnect size={statusSize} testID="wallet-connect-logo" />
        </Flex>
      ) : null}
    </Flex>
  )
}
