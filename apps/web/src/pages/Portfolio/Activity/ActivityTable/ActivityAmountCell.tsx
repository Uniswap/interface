/* eslint-disable max-lines */
import { NftAmountDisplay } from 'pages/Portfolio/Activity/ActivityTable/NftAmountDisplay'
import { buildActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/registry'
import { TokenAmountDisplay } from 'pages/Portfolio/Activity/ActivityTable/TokenAmountDisplay'
import { getTransactionTypeFilterOptions } from 'pages/Portfolio/Activity/Filters/utils'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { EM_DASH, Flex, Text } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { iconSizes } from 'ui/src/theme'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  INFINITE_APPROVAL_AMOUNT,
  REVOKE_APPROVAL_AMOUNT,
  TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

const COMPACT_TOKEN_LOGO_SIZE = iconSizes.icon24

interface ActivityAmountCellProps {
  transaction: TransactionDetails
  variant?: 'full' | 'compact'
}

function EmptyCell() {
  return (
    <Text variant="body3" color="$neutral3">
      {EM_DASH}
    </Text>
  )
}

interface DualTokenLayoutProps {
  inputCurrency: CurrencyInfo | null | undefined
  outputCurrency: CurrencyInfo | null | undefined
  inputFormattedAmount: string | null
  outputFormattedAmount: string | null
  inputUsdValue: string | null
  outputUsdValue: string | null
  separator?: React.ReactNode
}

function Separator({ children }: { children: React.ReactNode }) {
  return (
    <Flex justifyContent="center" alignItems="center" pt="$spacing2">
      {typeof children === 'string' ? (
        <Text variant="body3" color="$neutral2">
          {children}
        </Text>
      ) : (
        children
      )}
    </Flex>
  )
}

function DualTokenLayout({
  inputCurrency,
  outputCurrency,
  inputFormattedAmount,
  outputFormattedAmount,
  inputUsdValue,
  outputUsdValue,
  separator = <ArrowRight size={16} color="$neutral2" />,
}: DualTokenLayoutProps) {
  return (
    <Flex row alignItems="center" gap="$gap12" width="100%">
      <TokenAmountDisplay
        currencyInfo={inputCurrency}
        formattedAmount={inputFormattedAmount}
        usdValue={inputUsdValue}
      />
      <Separator>{separator}</Separator>
      <TokenAmountDisplay
        currencyInfo={outputCurrency}
        formattedAmount={outputFormattedAmount}
        usdValue={outputUsdValue}
      />
    </Flex>
  )
}

function formatAmountWithSymbol(amount: string | undefined, symbol: string | undefined): string | null {
  return amount ? `${amount} ${getSymbolDisplayText(symbol)}` : null
}

function getUsdValue(value: string | undefined): string | null {
  return value !== '-' ? (value ?? null) : null
}

// Helper to get transaction type display label
function getTransactionTypeLabel(transaction: TransactionDetails, t: ReturnType<typeof useTranslation>['t']): string {
  const fragments = buildActivityRowFragments(transaction)
  const { typeLabel } = fragments

  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const typeOption = typeLabel?.baseGroup ? transactionTypeOptions[typeLabel.baseGroup] : null

  return typeLabel?.overrideLabelKey ? t(typeLabel.overrideLabelKey) : (typeOption?.label ?? 'Transaction')
}

// Compact layout components
interface CompactLayoutProps {
  typeLabel: string
  logo: React.ReactNode
  amountText: string | null
}

function CompactLayout({ typeLabel, logo, amountText }: CompactLayoutProps) {
  return (
    <Flex row alignItems="center" gap="$gap8">
      {logo}
      <Flex>
        <Text variant="body4" color="$neutral2">
          {typeLabel}
        </Text>
        {amountText && (
          <Text variant="body3" color="$neutral1">
            {amountText}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

// Helper to create TokenLogo for compact variant
function createTokenLogo(currencyInfo: CurrencyInfo | null | undefined): React.ReactNode {
  if (!currencyInfo) {
    return null
  }

  return (
    <TokenLogo
      chainId={currencyInfo.currency.chainId}
      name={currencyInfo.currency.name}
      symbol={currencyInfo.currency.symbol}
      size={COMPACT_TOKEN_LOGO_SIZE}
      url={currencyInfo.logoUrl}
    />
  )
}

// Helper to create SplitLogo for compact variant
function createSplitLogo({
  chainId,
  inputCurrencyInfo,
  outputCurrencyInfo,
}: {
  chainId: number
  inputCurrencyInfo: CurrencyInfo | null | undefined
  outputCurrencyInfo: CurrencyInfo | null | undefined
}): React.ReactNode {
  if (!inputCurrencyInfo || !outputCurrencyInfo) {
    return null
  }

  return (
    <SplitLogo
      chainId={chainId}
      inputCurrencyInfo={inputCurrencyInfo}
      outputCurrencyInfo={outputCurrencyInfo}
      size={COMPACT_TOKEN_LOGO_SIZE}
    />
  )
}

// Helper to format compact amount text with separator
function formatCompactAmountText({
  inputAmount,
  inputSymbol,
  outputAmount,
  outputSymbol,
  separator = '→',
}: {
  inputAmount: string | undefined
  inputSymbol: string | undefined
  outputAmount: string | undefined
  outputSymbol: string | undefined
  separator?: string
}): string | null {
  if (!inputAmount || !outputAmount || !inputSymbol || !outputSymbol) {
    return null
  }

  return `${inputAmount} ${inputSymbol} ${separator} ${outputAmount} ${outputSymbol}`
}

// Helper to format single token compact amount text
function formatSingleCompactAmountText(amount: string | undefined, symbol: string | undefined): string | null {
  if (!amount || !symbol) {
    return null
  }

  return `${amount} ${symbol}`
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
  const inputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: inputCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'pair' ? (amount.inputAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
  })

  const outputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: outputCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'pair' ? (amount.outputAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
  })

  const singleFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: singleCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'single' ? (amount.amountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
  })

  const wrapAmountRaw = amount?.kind === 'wrap' ? (amount.amountRaw ?? '') : ''
  const wrapInputCurrency = amount?.kind === 'wrap' && amount.unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo
  const wrapOutputCurrency = amount?.kind === 'wrap' && amount.unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

  const wrapInputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: wrapInputCurrency?.currency,
    currencyAmountRaw: wrapAmountRaw,
    formatter,
    isApproximateAmount: false,
  })

  const wrapOutputFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: wrapOutputCurrency?.currency,
    currencyAmountRaw: wrapAmountRaw,
    formatter,
    isApproximateAmount: false,
  })

  const currency0FormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: currency0Info?.currency,
    currencyAmountRaw: amount?.kind === 'liquidity-pair' ? amount.currency0AmountRaw : '',
    formatter,
    isApproximateAmount: false,
  })

  const currency1FormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: currency1Info?.currency,
    currencyAmountRaw: amount?.kind === 'liquidity-pair' ? (amount.currency1AmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
  })

  const nftPurchaseFormattedData = useFormattedCurrencyAmountAndUSDValue({
    currency: nftPurchaseCurrencyInfo?.currency,
    currencyAmountRaw: amount?.kind === 'nft' ? (amount.purchaseAmountRaw ?? '') : '',
    formatter,
    isApproximateAmount: false,
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
      let formattedAmount: string | null = null
      let compactAmountText: string | null = null

      if (singleCurrencyInfo && amount.approvalAmount !== undefined) {
        const amountText =
          amount.approvalAmount === INFINITE_APPROVAL_AMOUNT
            ? t('transaction.amount.unlimited')
            : amount.approvalAmount && amount.approvalAmount !== REVOKE_APPROVAL_AMOUNT
              ? formatter.formatNumberOrString({ value: amount.approvalAmount, type: NumberType.TokenNonTx })
              : ''

        formattedAmount = `${amountText ? amountText + ' ' : ''}${getSymbolDisplayText(singleCurrencyInfo.currency.symbol) ?? ''}`

        // For compact variant, format as "amount symbol"
        if (variant === 'compact') {
          const symbol = getSymbolDisplayText(singleCurrencyInfo.currency.symbol) ?? ''
          if (amount.approvalAmount === INFINITE_APPROVAL_AMOUNT) {
            compactAmountText = `${t('transaction.amount.unlimited')} ${symbol}`
          } else if (amount.approvalAmount && amount.approvalAmount !== REVOKE_APPROVAL_AMOUNT) {
            compactAmountText = `${amountText} ${symbol}`
          } else {
            compactAmountText = symbol ? symbol : null
          }
        }
      }

      if (variant === 'compact') {
        return (
          <CompactLayout
            typeLabel={typeLabel}
            logo={createTokenLogo(singleCurrencyInfo)}
            amountText={compactAmountText}
          />
        )
      }

      // Full variant: Single token layout for approvals
      return <TokenAmountDisplay currencyInfo={singleCurrencyInfo} formattedAmount={formattedAmount} usdValue={null} />
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

      // Full variant: Single token layout for transfers
      return (
        <TokenAmountDisplay
          currencyInfo={singleCurrencyInfo}
          formattedAmount={formatAmountWithSymbol(singleFormattedData.amount, singleCurrencyInfo?.currency.symbol)}
          usdValue={getUsdValue(singleFormattedData.value)}
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

      // Full variant: Dual token layout for liquidity: Token0 and Token1
      return (
        <DualTokenLayout
          inputCurrency={currency0Info}
          outputCurrency={currency1Info}
          inputFormattedAmount={formatAmountWithSymbol(currency0FormattedData.amount, currency0Info?.currency.symbol)}
          outputFormattedAmount={formatAmountWithSymbol(currency1FormattedData.amount, currency1Info?.currency.symbol)}
          inputUsdValue={getUsdValue(currency0FormattedData.value)}
          outputUsdValue={getUsdValue(currency1FormattedData.value)}
          separator={t('common.and')}
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
        <NftAmountDisplay
          nftImageUrl={amount.nftImageUrl}
          nftName={amount.nftName}
          nftCollectionName={amount.nftCollectionName}
          purchaseAmountText={purchaseAmountText}
        />
      )
    }

    default:
      return <EmptyCell />
  }
}

export const ActivityAmountCell = memo(_ActivityAmountCell)
