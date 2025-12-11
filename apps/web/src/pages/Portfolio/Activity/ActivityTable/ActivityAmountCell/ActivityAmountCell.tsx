import { ApproveAmountCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ApproveAmountCell'
import { CompactLayout } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { DualTokenLayout } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/DualTokenLayout'
import { EmptyCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/EmptyCell'
import {
  createSplitLogo,
  createTokenLogo,
  formatAmountWithSymbol,
  formatCompactAmountText,
  formatSingleCompactAmountText,
  getTransactionTypeLabel,
  getUsdValue,
} from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { NftAmountDisplay } from 'pages/Portfolio/Activity/ActivityTable/NftAmountDisplay'
import { buildActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/registry'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

interface ActivityAmountCellProps {
  transaction: TransactionDetails
  variant?: 'full' | 'compact'
}

function _ActivityAmountCell({ transaction, variant = 'full' }: ActivityAmountCellProps) {
  const formatter = useLocalizationContext()
  const { t } = useTranslation()
  const { chainId } = transaction
  const fragments = buildActivityRowFragments(transaction)
  const { amount } = fragments

  // Hook up currency info based on amount model
  const inputCurrencyInfo = useCurrencyInfo(amount?.kind === 'pair' ? amount.inputCurrencyId : undefined)
  const outputCurrencyInfo = useCurrencyInfo(amount?.kind === 'pair' ? amount.outputCurrencyId : undefined)
  const singleCurrencyInfo = useCurrencyInfo(
    amount?.kind === 'single' || amount?.kind === 'approve' ? amount.currencyId : undefined,
  )
  const currency0Info = useCurrencyInfo(amount?.kind === 'liquidity-pair' ? amount.currency0Id : undefined)
  const currency1Info = useCurrencyInfo(amount?.kind === 'liquidity-pair' ? amount.currency1Id : undefined)
  const nftPurchaseCurrencyInfo = useCurrencyInfo(amount?.kind === 'nft' ? amount.purchaseCurrencyId : undefined)

  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(chainId)

  // Format amounts based on kind
  // Use slow polling (5 minutes) for historical activity data to reduce unnecessary network requests
  const inputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: inputCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'pair' ? (amount.inputAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const outputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: outputCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'pair' ? (amount.outputAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const singleFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: singleCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'single' ? (amount.amountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const wrapAmountRaw = amount?.kind === 'wrap' ? (amount.amountRaw ?? '') : ''
  const wrapInputCurrency = amount?.kind === 'wrap' && amount.unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo
  const wrapOutputCurrency = amount?.kind === 'wrap' && amount.unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

  const wrapInputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: wrapInputCurrency?.currency,
    currencyAmountRaw: wrapAmountRaw,
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const wrapOutputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: wrapOutputCurrency?.currency,
    currencyAmountRaw: wrapAmountRaw,
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const currency0FormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: currency0Info?.currency,
    currencyAmountRaw: amount?.kind === 'liquidity-pair' ? amount.currency0AmountRaw : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const currency1FormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: currency1Info?.currency,
    currencyAmountRaw: amount?.kind === 'liquidity-pair' ? (amount.currency1AmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  const nftPurchaseFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: nftPurchaseCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'nft' ? (amount.purchaseAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
    pollInterval: PollingInterval.Slow,
  })

  if (transaction.status === TransactionStatus.Failed) {
    return (
      <Text variant="body3" color="$neutral2">
        {t('notification.transaction.unknown.fail.short')}
      </Text>
    )
  }

  if (!amount) {
    return <EmptyCell />
  }

  // Guard against missing currency data before formatting
  if (amount.kind === 'pair' && (!inputCurrencyInfo || !outputCurrencyInfo)) {
    return <EmptyCell />
  }

  if (amount.kind === 'liquidity-pair' && (!currency0Info || !currency1Info)) {
    return <EmptyCell />
  }

  // Get transaction type label for compact variant
  const typeLabel = variant === 'compact' ? getTransactionTypeLabel(transaction, t) : ''

  switch (amount.kind) {
    case 'pair': {
      if (variant === 'compact') {
        return (
          <CompactLayout
            typeLabel={typeLabel}
            logo={createSplitLogo({ chainId, inputCurrencyInfo, outputCurrencyInfo })}
            amountText={formatCompactAmountText({
              inputAmount: inputFormattedData.amount,
              inputSymbol: inputCurrencyInfo?.currency.symbol,
              outputAmount: outputFormattedData.amount,
              outputSymbol: outputCurrencyInfo?.currency.symbol,
            })}
          />
        )
      }

      // Full variant: Dual token layout for swaps and bridges: Token1 → Token2
      return (
        <DualTokenLayout
          inputCurrency={inputCurrencyInfo}
          outputCurrency={outputCurrencyInfo}
          inputFormattedAmount={formatAmountWithSymbol(inputFormattedData.amount, inputCurrencyInfo?.currency.symbol)}
          outputFormattedAmount={formatAmountWithSymbol(
            outputFormattedData.amount,
            outputCurrencyInfo?.currency.symbol,
          )}
          inputUsdValue={getUsdValue(inputFormattedData.value)}
          outputUsdValue={getUsdValue(outputFormattedData.value)}
        />
      )
    }

    case 'approve': {
      return (
        <ApproveAmountCell
          singleCurrencyInfo={singleCurrencyInfo}
          approvalAmount={amount.approvalAmount}
          variant={variant}
          typeLabel={typeLabel}
          formatter={formatter}
          t={t}
        />
      )
    }

    case 'wrap': {
      if (variant === 'compact') {
        return (
          <CompactLayout
            typeLabel={typeLabel}
            logo={createSplitLogo({
              chainId,
              inputCurrencyInfo: wrapInputCurrency,
              outputCurrencyInfo: wrapOutputCurrency,
            })}
            amountText={formatCompactAmountText({
              inputAmount: wrapInputFormattedData.amount,
              inputSymbol: wrapInputCurrency?.currency.symbol,
              outputAmount: wrapOutputFormattedData.amount,
              outputSymbol: wrapOutputCurrency?.currency.symbol,
            })}
          />
        )
      }

      // Full variant: Dual token layout for wraps: ETH ↔ WETH
      return (
        <DualTokenLayout
          inputCurrency={wrapInputCurrency}
          outputCurrency={wrapOutputCurrency}
          inputFormattedAmount={formatAmountWithSymbol(
            wrapInputFormattedData.amount,
            wrapInputCurrency?.currency.symbol,
          )}
          outputFormattedAmount={formatAmountWithSymbol(
            wrapOutputFormattedData.amount,
            wrapOutputCurrency?.currency.symbol,
          )}
          inputUsdValue={getUsdValue(wrapInputFormattedData.value)}
          outputUsdValue={getUsdValue(wrapOutputFormattedData.value)}
        />
      )
    }

    case 'single': {
      if (variant === 'compact') {
        return (
          <CompactLayout
            typeLabel={typeLabel}
            logo={createTokenLogo(singleCurrencyInfo)}
            amountText={formatSingleCompactAmountText(singleFormattedData.amount, singleCurrencyInfo?.currency.symbol)}
          />
        )
      }

      // Full variant: Single token layout
      const transactionType = transaction.typeInfo.type
      const showOnRight =
        transactionType === TransactionType.Send ||
        transactionType === TransactionType.OffRampSale ||
        transactionType === TransactionType.LocalOffRamp

      const showOnLeft = !showOnRight

      const formattedAmountWithSymbol = formatAmountWithSymbol(
        singleFormattedData.amount,
        singleCurrencyInfo?.currency.symbol,
      )
      const usdValue = getUsdValue(singleFormattedData.value)

      if (showOnLeft) {
        return (
          <DualTokenLayout
            inputCurrency={singleCurrencyInfo}
            outputCurrency={null}
            inputFormattedAmount={formattedAmountWithSymbol}
            outputFormattedAmount={null}
            inputUsdValue={usdValue}
            outputUsdValue={null}
            separator={null}
          />
        )
      }

      return (
        <DualTokenLayout
          inputCurrency={null}
          outputCurrency={singleCurrencyInfo}
          inputFormattedAmount={null}
          outputFormattedAmount={formattedAmountWithSymbol}
          inputUsdValue={null}
          outputUsdValue={usdValue}
          separator={null}
        />
      )
    }

    case 'liquidity-pair': {
      if (variant === 'compact') {
        return (
          <CompactLayout
            typeLabel={typeLabel}
            logo={createSplitLogo({ chainId, inputCurrencyInfo: currency0Info, outputCurrencyInfo: currency1Info })}
            amountText={formatCompactAmountText({
              inputAmount: currency0FormattedData.amount,
              inputSymbol: currency0Info?.currency.symbol,
              outputAmount: currency1FormattedData.amount,
              outputSymbol: currency1Info?.currency.symbol,
              separator: '&',
            })}
          />
        )
      }

      const token0Amount = formatAmountWithSymbol(currency0FormattedData.amount, currency0Info?.currency.symbol)
      const token1Amount = formatAmountWithSymbol(currency1FormattedData.amount, currency1Info?.currency.symbol)

      return (
        <DualTokenLayout
          inputCurrency={currency0Info}
          outputCurrency={currency1Info}
          inputFormattedAmount={token0Amount}
          outputFormattedAmount={token1Amount}
          inputUsdValue={getUsdValue(currency0FormattedData.value)}
          outputUsdValue={getUsdValue(currency1FormattedData.value)}
          separator={<Plus size={16} color="$neutral2" />}
        />
      )
    }

    case 'nft': {
      // NFT layout with image preview
      const purchaseAmountText =
        nftPurchaseFormattedData.amount && nftPurchaseCurrencyInfo
          ? formatAmountWithSymbol(nftPurchaseFormattedData.amount, nftPurchaseCurrencyInfo.currency.symbol)
          : null

      return (
        <Flex row alignItems="center" gap="$gap8" justifyContent="flex-start" minWidth={180}>
          <NftAmountDisplay
            nftImageUrl={amount.nftImageUrl}
            nftName={amount.nftName}
            nftCollectionName={amount.nftCollectionName}
            purchaseAmountText={purchaseAmountText}
          />
        </Flex>
      )
    }

    default:
      return <EmptyCell />
  }
}

export const ActivityAmountCell = memo(_ActivityAmountCell)
