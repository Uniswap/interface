import { buildActivityRowFragments } from 'components/ActivityTable/registry'
import { TokenAmountDisplay } from 'components/ActivityTable/TokenAmountDisplay'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface ActivityAmountCellProps {
  transaction: TransactionDetails
}

function EmptyCell() {
  return (
    <Text variant="body3" color="$neutral2">
      —
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
  return amount ? `${amount}${getSymbolDisplayText(symbol)}` : null
}

function getUsdValue(value: string | undefined): string | null {
  return value !== '-' ? (value ?? null) : null
}

export function ActivityAmountCell({ transaction }: ActivityAmountCellProps) {
  const formatter = useLocalizationContext()
  const { t } = useTranslation()
  const { chainId } = transaction
  const { amount } = buildActivityRowFragments(transaction)

  // Hook up currency info based on amount model
  const inputCurrencyInfo = useCurrencyInfo(amount?.kind === 'pair' ? amount.inputCurrencyId : undefined)
  const outputCurrencyInfo = useCurrencyInfo(amount?.kind === 'pair' ? amount.outputCurrencyId : undefined)
  const singleCurrencyInfo = useCurrencyInfo(
    amount?.kind === 'single' || amount?.kind === 'approve' ? amount.currencyId : undefined,
  )
  const currency0Info = useCurrencyInfo(amount?.kind === 'liquidity-pair' ? amount.currency0Id : undefined)
  const currency1Info = useCurrencyInfo(amount?.kind === 'liquidity-pair' ? amount.currency1Id : undefined)

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

  switch (amount.kind) {
    case 'pair': {
      // Dual token layout for swaps and bridges: Token1 → Token2
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
      // Single token layout for approvals
      let formattedAmount: string | null = null

      if (singleCurrencyInfo && amount.approvalAmount !== undefined) {
        const amountText =
          amount.approvalAmount === 'INF'
            ? t('transaction.amount.unlimited')
            : amount.approvalAmount && amount.approvalAmount !== '0.0'
              ? formatter.formatNumberOrString({ value: amount.approvalAmount, type: NumberType.TokenNonTx })
              : ''

        formattedAmount = `${amountText ? amountText + ' ' : ''}${getSymbolDisplayText(singleCurrencyInfo.currency.symbol) ?? ''}`
      }

      return <TokenAmountDisplay currencyInfo={singleCurrencyInfo} formattedAmount={formattedAmount} usdValue={null} />
    }

    case 'wrap': {
      // Dual token layout for wraps: ETH ↔ WETH
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
      // Single token layout for transfers
      return (
        <TokenAmountDisplay
          currencyInfo={singleCurrencyInfo}
          formattedAmount={formatAmountWithSymbol(singleFormattedData.amount, singleCurrencyInfo?.currency.symbol)}
          usdValue={getUsdValue(singleFormattedData.value)}
        />
      )
    }

    case 'liquidity-pair': {
      // Dual token layout for liquidity: Token0 and Token1
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
  }
}
