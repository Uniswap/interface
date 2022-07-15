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
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'

interface LogoWithTxStatusProps {
  assetType: AssetType
  txType: TransactionType
  txStatus: TransactionStatus
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
  nftImageUrl?: string
}

export function LogoWithTxStatus(props: CurrencyStatusProps | NFTStatusProps) {
  const { assetType, txType, txStatus, size } = props
  const theme = useAppTheme()

  const logo =
    assetType === AssetType.Currency ? (
      <CurrencyLogoOrPlaceholder currency={props.currency} size={size.primaryImage} />
    ) : (
      <NFTLogoOrPlaceholder nftImageUrl={props.nftImageUrl} size={size.primaryImage} />
    )

  const fill = theme.colors.backgroundBackdrop
  const gray = theme.colors.textSecondary
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
    logger.info(
      'statusIcon',
      'GenerateStatusIcon',
      'Could not find icon for transaction type:',
      txType
    )
    return null
  }
  const statusIcon = getTxStatusIcon()
  return (
    <>
      {logo}
      <Box bottom={1} position="absolute" right={1}>
        {statusIcon}
      </Box>
    </>
  )
}

function NFTLogoOrPlaceholder(props: { nftImageUrl?: string; size: number }) {
  const { nftImageUrl, size } = props
  return (
    <Box
      alignItems="center"
      backgroundColor="backgroundContainer"
      borderRadius="xs"
      height={size}
      justifyContent="center"
      width={size}>
      {nftImageUrl && <NFTViewer uri={nftImageUrl} />}
    </Box>
  )
}
