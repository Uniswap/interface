import { Currency, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { FeeOnTransferFeeGroupProps } from 'wallet/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { TransactionDetails } from 'wallet/src/features/transactions/TransactionDetails/TransactionDetails'
import { Warning } from 'wallet/src/features/transactions/WarningModal/types'
import { SwapRateRatio } from 'wallet/src/features/transactions/swap/SwapRateRatio'
import { Trade } from 'wallet/src/features/transactions/swap/trade/types'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { ElementName } from 'wallet/src/telemetry/constants'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

const getFeeAmountUsd = (
  trade: Trade<Currency, Currency, TradeType>,
  outputCurrencyPricePerUnitExact?: string
): number | undefined => {
  if (!trade.swapFee || !outputCurrencyPricePerUnitExact) {
    return
  }

  const currencyAmount = getCurrencyAmount({
    value: trade.swapFee.amount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  if (!currencyAmount) {
    return
  }

  const feeUSD = parseFloat(outputCurrencyPricePerUnitExact) * parseFloat(currencyAmount.toExact())
  return feeUSD
}

interface SwapDetailsProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  gasFallbackUsed?: boolean
  gasFee: GasFeeResult
  newTradeRequiresAcceptance: boolean
  outputCurrencyPricePerUnitExact?: string
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  onShowSlippageModal: () => void
}

export function SwapDetails({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
  derivedSwapInfo,
  gasFee,
  newTradeRequiresAcceptance,
  outputCurrencyPricePerUnitExact,
  warning,
  onAcceptTrade,
  onShowWarning,
  onShowSlippageModal,
}: SwapDetailsProps): JSX.Element {
  const { t } = useTranslation()

  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted, formatPercent } = formatter

  const trade = derivedSwapInfo.trade.trade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade

  if (!trade) {
    throw new Error('Invalid render of `SwapDetails` with no `trade`')
  }

  if (!acceptedTrade) {
    throw new Error('Invalid render of `SwapDetails` with no `acceptedTrade`')
  }

  const swapFeeUsd = getFeeAmountUsd(trade, outputCurrencyPricePerUnitExact)
  const swapFeeFiatFormatted = convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice)

  const swapFeeInfo = trade.swapFee
    ? {
        noFeeCharged: trade.swapFee.percent.equalTo(0),
        formattedPercent: formatPercent(trade.swapFee.percent.toFixed()),
        formattedAmount:
          getFormattedCurrencyAmount(trade.outputAmount.currency, trade.swapFee.amount, formatter) +
          getSymbolDisplayText(trade.outputAmount.currency.symbol),
        formattedAmountFiat: swapFeeFiatFormatted,
      }
    : undefined

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning = autoSlippageTolerance
    ? acceptedTrade.slippageTolerance > autoSlippageTolerance
    : false

  const feeOnTransferProps: FeeOnTransferFeeGroupProps = useMemo(
    () => ({
      inputTokenInfo: {
        fee: acceptedTrade.inputTax,
        tokenSymbol: acceptedTrade.inputAmount.currency.symbol ?? 'Token sell',
      },
      outputTokenInfo: {
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? 'Token buy',
      },
    }),
    [
      acceptedTrade.inputAmount.currency.symbol,
      acceptedTrade.inputTax,
      acceptedTrade.outputAmount.currency.symbol,
      acceptedTrade.outputTax,
    ]
  )

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
      showExpandedChildren={!!customSlippageTolerance}
      showWarning={warning && !newTradeRequiresAcceptance}
      swapFeeInfo={swapFeeInfo}
      warning={warning}
      onShowWarning={onShowWarning}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text color="$neutral2" variant="body3">
          {t('swap.details.rate')}
        </Text>
        <Flex row shrink justifyContent="flex-end">
          <SwapRateRatio trade={trade} />
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
        <TouchableArea flexShrink={1} onPress={onShowSlippageModal}>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" numberOfLines={3} variant="body3">
              {t('swap.details.slippage')}
              &nbsp;
              <Icons.InfoCircleFilled color="$neutral3" size="$icon.16" />
            </Text>
          </Flex>
        </TouchableArea>
        <Flex centered row gap="$spacing8">
          {!customSlippageTolerance ? (
            <Flex
              centered
              backgroundColor="$surface3"
              borderRadius="$roundedFull"
              px="$spacing4"
              py="$spacing2">
              <Text color="$neutral2" variant="buttonLabel4">
                {t('swap.settings.slippage.control.auto')}
              </Text>
            </Flex>
          ) : null}
          <Text color={showSlippageWarning ? '$DEP_accentWarning' : '$neutral1'} variant="body3">
            {formatPercent(acceptedTrade.slippageTolerance)}
          </Text>
        </Flex>
      </Flex>
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
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
      ? CurrencyField.OUTPUT
      : CurrencyField.INPUT

  const derivedAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]
  const derivedSymbol = getSymbolDisplayText(
    derivedSwapInfo.currencies[derivedCurrencyField]?.currency.symbol
  )
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
      py="$spacing8">
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
            ? t('swap.details.newQuote.output')
            : t('swap.details.newQuote.input')}
        </Text>
        <Flex row alignItems="center">
          <Text
            adjustsFontSizeToFit
            color="$neutral1"
            numberOfLines={1}
            textAlign="center"
            variant="body3">
            {formattedDerivedAmount} {derivedSymbol}{' '}
            <Text color="$neutral2">({percentageDifference}%)</Text>
          </Text>
        </Flex>
      </Flex>
      <Flex>
        <Trace logPress element={ElementName.AcceptNewRate}>
          <TouchableArea
            backgroundColor="$accentSoft"
            borderRadius="$rounded12"
            px="$spacing8"
            py="$spacing4"
            onPress={onAcceptTrade}>
            <Text color="$accent1" variant="buttonLabel3">
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
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
      ? CurrencyField.OUTPUT
      : CurrencyField.INPUT

  // It's important to convert these to fractions before doing math on them in order to preserve full precision on each step.
  const newAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction
  const acceptedAmount = acceptedDerivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction

  if (!newAmount || !acceptedAmount) {
    return null
  }

  const percentage = newAmount.subtract(acceptedAmount).divide(acceptedAmount).multiply(100)

  return `${percentage.greaterThan(0) ? '+' : ''}${percentage.toFixed(2)}`
}
