import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/review/SwapRateRatio'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface SwapDetailsProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  gasFallbackUsed?: boolean
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  newTradeRequiresAcceptance: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
}

export function SwapDetails({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
  derivedSwapInfo,
  gasFee,
  uniswapXGasBreakdown,
  newTradeRequiresAcceptance,
  warning,
  onAcceptTrade,
  onShowWarning,
}: SwapDetailsProps): JSX.Element {
  const { t } = useTranslation()

  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted, formatPercent } = formatter

  const isBridgeTrade = derivedSwapInfo.trade.trade && isBridge(derivedSwapInfo.trade.trade)

  const trade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade

  if (!trade) {
    throw new Error('Invalid render of `SwapDetails` with no `trade`')
  }

  if (!acceptedTrade) {
    throw new Error('Invalid render of `SwapDetails` with no `acceptedTrade`')
  }

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)

  const formattedAmountFiat =
    swapFeeUsd && !isNaN(swapFeeUsd) ? convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) : undefined

  const swapFeeInfo = trade.swapFee
    ? {
        noFeeCharged: trade.swapFee.percent.equalTo(0),
        formattedPercent: formatPercent(trade.swapFee.percent.toFixed()),
        formattedAmount:
          getFormattedCurrencyAmount(trade.outputAmount.currency, trade.swapFee.amount, formatter) +
          getSymbolDisplayText(trade.outputAmount.currency.symbol),
        formattedAmountFiat,
      }
    : undefined

  const feeOnTransferProps: FeeOnTransferFeeGroupProps | undefined = useMemo(() => {
    if (acceptedTrade.indicative || isBridge(acceptedTrade)) {
      return undefined
    }

    return {
      inputTokenInfo: {
        fee: acceptedTrade.inputTax,
        tokenSymbol: acceptedTrade.inputAmount.currency.symbol ?? 'Token sell',
      },
      outputTokenInfo: {
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? 'Token buy',
      },
    }
  }, [acceptedTrade])

  return (
    <TransactionDetails
      isSwap
      banner={
        newTradeRequiresAcceptance && (
          <AcceptNewQuoteRow
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            derivedSwapInfo={derivedSwapInfo}
            onAcceptTrade={onAcceptTrade}
          />
        )
      }
      chainId={acceptedTrade.inputAmount.currency.chainId}
      feeOnTransferProps={feeOnTransferProps}
      gasFee={gasFee}
      indicative={acceptedTrade.indicative}
      showExpandedChildren={!!customSlippageTolerance}
      showWarning={warning && !newTradeRequiresAcceptance}
      swapFeeInfo={swapFeeInfo}
      transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
      uniswapXGasBreakdown={uniswapXGasBreakdown}
      warning={warning}
      onShowWarning={onShowWarning}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <Text color="$neutral2" variant="body3">
          {t('swap.details.rate')}
        </Text>
        <Flex row shrink justifyContent="flex-end">
          <SwapRateRatio trade={trade} />
        </Flex>
      </Flex>
      {!isBridgeTrade && (
        <MaxSlippageRow
          acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
          autoSlippageTolerance={autoSlippageTolerance}
          customSlippageTolerance={customSlippageTolerance}
        />
      )}
    </TransactionDetails>
  )
}

function AcceptNewQuoteRow({
  acceptedDerivedSwapInfo,
  derivedSwapInfo,
  onAcceptTrade,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  onAcceptTrade: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]
  const derivedSymbol = getSymbolDisplayText(derivedSwapInfo.currencies[derivedCurrencyField]?.currency.symbol)
  const formattedDerivedAmount = formatCurrencyAmount({
    value: derivedAmount,
    type: NumberType.TokenTx,
  })

  const percentageDifference = calculatePercentageDifference({
    derivedSwapInfo,
    acceptedDerivedSwapInfo,
  })

  return (
    <Flex
      row
      shrink
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={1}
      gap="$spacing12"
      justifyContent="space-between"
      pl="$spacing12"
      pr="$spacing8"
      py="$spacing8"
    >
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
            ? t('swap.details.newQuote.output')
            : t('swap.details.newQuote.input')}
        </Text>
        <Flex row alignItems="center">
          <Text adjustsFontSizeToFit color="$neutral1" numberOfLines={1} textAlign="center" variant="body3">
            {formattedDerivedAmount} {derivedSymbol} <Text color="$neutral2">({percentageDifference}%)</Text>
          </Text>
        </Flex>
      </Flex>
      <Flex>
        <Trace logPress element={ElementName.AcceptNewRate}>
          <TouchableArea
            backgroundColor="$DEP_accentSoft"
            borderRadius="$rounded12"
            px="$spacing8"
            py="$spacing4"
            onPress={onAcceptTrade}
          >
            <Text color="$accent1" variant="buttonLabel2">
              {t('common.button.accept')}
            </Text>
          </TouchableArea>
        </Trace>
      </Flex>
    </Flex>
  )
}

function calculatePercentageDifference({
  derivedSwapInfo,
  acceptedDerivedSwapInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
}): string | null {
  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  // It's important to convert these to fractions before doing math on them in order to preserve full precision on each step.
  const newAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction
  const acceptedAmount = acceptedDerivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction

  if (!newAmount || !acceptedAmount) {
    return null
  }

  const percentage = newAmount.subtract(acceptedAmount).divide(acceptedAmount).multiply(100)

  return `${percentage.greaterThan(0) ? '+' : ''}${percentage.toFixed(2)}`
}
