import dayjs from 'dayjs'
import { default as React, memo, useState } from 'react'
import { i18n } from 'src/app/i18n'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { createBalanceUpdate, getCurrencySymbol } from 'src/features/notifications/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { openUri } from 'src/utils/linking'

export const TXN_HISTORY_ICON_SIZE = 36
export const TXN_HISTORY_SIZING = {
  primaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3),
  secondaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3) * (2 / 3),
}

// Key values needed for rendering transaction history item.
export interface TransactionSummaryInfo {
  type: TransactionType
  hash: string
  chainId: ChainId
  assetType: AssetType
  msTimestampAdded: number
  status: TransactionStatus
  amountRaw?: string
  tokenAddress?: string
  otherTokenAddress?: string // for swaps
  nftMetaData?: {
    name: string
    imageURL: string
  }
  fullDetails?: TransactionDetails // for resubmission or canceling
}

function TransactionSummaryItem({
  transactionSummaryInfo,
}: {
  transactionSummaryInfo: TransactionSummaryInfo
}) {
  const {
    type,
    hash,
    chainId,
    tokenAddress,
    amountRaw,
    assetType,
    msTimestampAdded,
    status,
    otherTokenAddress,
    nftMetaData,
  } = transactionSummaryInfo
  const [showActionsModal, setShowActionsModal] = useState(false)

  const currencyId = buildCurrencyId(chainId, tokenAddress ?? '')
  const otherCurrencyId = buildCurrencyId(chainId, otherTokenAddress ?? '')
  const currency = useCurrency(currencyId)
  const otherCurrency = useCurrency(otherCurrencyId)
  const { spotPrices } = useSpotPrices([currency])

  const failed = status === TransactionStatus.Failed
  const explorerUrl = CHAIN_INFO[chainId].explorer
  const dateAdded = dayjs(msTimestampAdded).format('MMM D')

  // Only need a balance update on these 3 types of transactions.
  let balanceUpdate
  if (
    amountRaw &&
    (type === TransactionType.Send ||
      type === TransactionType.Receive ||
      type === TransactionType.Swap)
  ) {
    balanceUpdate = createBalanceUpdate(type, status, currency, amountRaw, spotPrices)
  }

  const icon =
    type === TransactionType.Swap && !failed ? (
      <>
        <Box left={2} position="absolute" testID="swap-success-toast" top={2}>
          <CurrencyLogoOrPlaceholder currency={currency} size={TXN_HISTORY_SIZING.primaryImage} />
        </Box>
        <Box bottom={0} position="absolute" right={0}>
          <CurrencyLogoOrPlaceholder
            currency={otherCurrency}
            size={TXN_HISTORY_SIZING.primaryImage}
          />
        </Box>
      </>
    ) : (
      <LogoWithTxStatus
        assetType={assetType}
        currency={currency}
        nftImageUrl={nftMetaData?.imageURL}
        size={TXN_HISTORY_SIZING}
        txStatus={status}
        txType={type}
      />
    )

  // Generate copy for transaction.
  let title = ''
  const tokenAddressOrName = AssetType.Currency ? tokenAddress : nftMetaData?.name ?? 'NFT'
  const assetName = getCurrencySymbol(currency, tokenAddressOrName)

  switch (type) {
    case TransactionType.Swap:
      let tokensText = ''
      if (currency && otherCurrency) {
        tokensText = otherCurrency.symbol + i18n.t(' for ') + assetName
      }
      title = failed
        ? i18n.t('Failed swap')
        : i18n.t('Swapped ' + '{{tokensText}}', {
            tokensText,
          })
      break
    case TransactionType.Approve:
      title = failed ? i18n.t('Failed approve') : i18n.t('Approved {{assetName}}', { assetName })
      break
    case TransactionType.Send:
      title = failed ? i18n.t('Failed send') : i18n.t('Sent {{assetName}}', { assetName })
      break
    case TransactionType.Receive:
      title = i18n.t('Received {{assetName}}', { assetName })
      break
    default:
      title = i18n.t('Unknown transaction')
  }

  return (
    <>
      <Button onPress={() => setShowActionsModal(true)}>
        <Flex
          row
          alignItems="flex-start"
          bg="translucentBackground"
          gap="xs"
          justifyContent="space-between"
          padding="md">
          <Flex
            row
            shrink
            alignItems="center"
            flexBasis={balanceUpdate ? '75%' : '100%'}
            gap="xs"
            justifyContent="flex-start">
            {icon && (
              <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
                {icon}
              </Flex>
            )}
            <Flex shrink gap="xxxs">
              <Text adjustsFontSizeToFit fontWeight="500" numberOfLines={2} variant="mediumLabel">
                {title}
              </Text>
              <Text color="textSecondary" variant="badge">
                {dateAdded.toLocaleString()}
              </Text>
            </Flex>
          </Flex>
          {balanceUpdate && (
            <Flex alignItems="flex-end" flexBasis="25%" gap="xs">
              <>
                <Text adjustsFontSizeToFit numberOfLines={1} variant="body">
                  {balanceUpdate.assetIncrease}
                </Text>
                {balanceUpdate.usdIncrease && (
                  <Text
                    adjustsFontSizeToFit
                    color="textSecondary"
                    numberOfLines={1}
                    variant="badge">
                    {balanceUpdate.usdIncrease}
                  </Text>
                )}
              </>
            </Flex>
          )}
        </Flex>
      </Button>
      <TransactionActionsModal
        isVisible={showActionsModal}
        showCancelButton={true}
        onClose={() => {
          setShowActionsModal(false)
        }}
        onExplore={() => openUri(`${explorerUrl}/tx/${hash}`)}
      />
    </>
  )
}

export default memo(TransactionSummaryItem)
