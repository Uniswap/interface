import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Approve from 'src/assets/icons/approve.svg'
import IncomingArrow from 'src/assets/icons/arrow-down-in-circle.svg'
import OutgoingArrow from 'src/assets/icons/arrow-up-in-circle.svg'
import UnknownStatus from 'src/assets/icons/question-in-circle.svg'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box } from 'src/components/layout/Box'
import { AssetType } from 'src/entities/assets'
import { TXN_HISTORY_SIZING } from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { NFTTradeType, TransactionStatus, TransactionType } from 'src/features/transactions/types'
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
  nftTradeType?: NFTTradeType
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
    if (txStatus === TransactionStatus.Cancelled) {
      return (
        <SlashCircleIcon
          color={theme.colors.backgroundOutline}
          fill={theme.colors.black}
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
      case TransactionType.Receive:
        return <IncomingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
      case TransactionType.NFTTrade:
        if (assetType === AssetType.ERC721 && props.nftTradeType === NFTTradeType.SELL) {
          return <OutgoingArrow color={green} fill={fill} height={statusSize} width={statusSize} />
        }
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
      overflow="hidden"
      width={size}>
      {nftImageUrl && <NFTViewer uri={nftImageUrl} />}
    </Box>
  )
}

/**
 * Swap icons lockup, fall back to single icon plus warning if in failed state.
 */
export function DoubleCurrencyLogoWithTxStatus({
  currency,
  otherCurrency,
  status,
  showCancelIcon,
}: {
  currency: NullUndefined<Currency>
  otherCurrency: NullUndefined<Currency>
  status: TransactionStatus
  showCancelIcon: boolean
}) {
  if (
    status === TransactionStatus.Failed ||
    (showCancelIcon && status === TransactionStatus.Cancelled)
  ) {
    return (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        currency={currency}
        size={TXN_HISTORY_SIZING}
        txStatus={status}
        txType={TransactionType.Swap}
      />
    )
  }
  return (
    <>
      <Box left={2} position="absolute" top={2}>
        <CurrencyLogoOrPlaceholder
          currency={otherCurrency}
          size={TXN_HISTORY_SIZING.primaryImage}
        />
      </Box>
      <Box bottom={0} position="absolute" right={0}>
        <CurrencyLogoOrPlaceholder currency={currency} size={TXN_HISTORY_SIZING.primaryImage} />
      </Box>
    </>
  )
}
