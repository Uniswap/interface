import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Approve from 'src/assets/icons/approve.svg'
import IncomingArrow from 'src/assets/icons/arrow-down-in-circle.svg'
import OutgoingArrow from 'src/assets/icons/arrow-up-in-circle.svg'
import UnknownStatus from 'src/assets/icons/question-in-circle.svg'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box } from 'src/components/layout/Box'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'

interface LogoWithTxStatusProps {
  assetType: AssetType
  txType: TransactionType
  txStatus: TransactionStatus.Success | TransactionStatus.Failed
  size: {
    primaryImage: number
    secondaryImage: number
  }
}

interface CurrencyStatusProps extends LogoWithTxStatusProps {
  assetType: AssetType.Currency
  currency?: Currency | null
}

interface NFTStatusProps extends LogoWithTxStatusProps {
  assetType: AssetType.ERC721 | AssetType.ERC1155
  nft?: NFTAsset.Asset
}

export function LogoWithTxStatus(props: CurrencyStatusProps | NFTStatusProps) {
  const { assetType, txType, txStatus, size } = props
  const theme = useAppTheme()

  const logo =
    assetType === AssetType.Currency ? (
      <CurrencyLogoOrPlaceholder currency={props.currency} size={size.primaryImage} />
    ) : (
      <NFTLogoOrPlaceholder nft={props.nft} size={size.primaryImage} />
    )

  const fill = theme.colors.mainBackground
  const gray = theme.colors.backgroundAction
  const green = theme.colors.accentSuccess
  const yellow = theme.colors.accentWarning
  const statusSize = size.secondaryImage

  const getTxStatusIcon = () => {
    if (txStatus === TransactionStatus.Failed) {
      return <AlertTriangle color={yellow} fill={fill} height={statusSize} width={statusSize} />
    }

    switch (txType) {
      case TransactionType.Approve:
        return <Approve color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.Send:
        return <OutgoingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.Receive:
        return <IncomingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.Unknown:
        return <UnknownStatus color={gray} fill={fill} height={statusSize} width={statusSize} />
    }

    logger.error(
      'LogoWithTxStatus',
      'getTxStatusIcon',
      `No icon found for txType "${txType}" and txStatus "${txStatus}"`
    )
  }

  return (
    <>
      {logo}
      <Box bottom={2} position="absolute" right={2}>
        {getTxStatusIcon()}
      </Box>
    </>
  )
}

function NFTLogoOrPlaceholder(props: { nft?: NFTAsset.Asset; size: number }) {
  const { nft, size } = props
  return (
    <Box
      alignItems="center"
      backgroundColor="backgroundContainer"
      borderRadius="xs"
      height={size}
      justifyContent="center"
      width={size}>
      {nft && <NFTViewer uri={nft.image_url} />}
    </Box>
  )
}
