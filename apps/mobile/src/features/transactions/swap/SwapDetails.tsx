import { Currency, TradeType } from '@uniswap/sdk-core'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Warning } from 'src/components/modals/WarningModal/types'
import { OnShowSwapFeeInfo } from 'src/components/SwapFee/SwapFee'
import Trace from 'src/components/Trace/Trace'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { ElementName } from 'src/features/telemetry/constants'
import { FeeOnTransferInfo } from 'src/features/transactions/swap/FeeOnTransferInfo'
import { DerivedSwapInfo } from 'src/features/transactions/swap/types'
import { getRateToDisplay } from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons'
import {
  formatCurrencyAmount,
  formatPercent,
  formatPrice,
  formatUSDPrice,
  NumberType,
} from 'utilities/src/format/format'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useUSDCPrice } from 'wallet/src/features/routing/useUSDCPrice'
import { useShouldUseMEVBlocker } from 'wallet/src/features/transactions/swap/customRpc'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

const getFormattedFeeAmountUsd = (
  trade: Trade<Currency, Currency, TradeType>,
  outputCurrencyPricePerUnitExact?: string
): string | undefined => {
  if (!trade.swapFee || !outputCurrencyPricePerUnitExact) return

  const currencyAmount = getCurrencyAmount({
    value: trade.swapFee.amount,
    valueType: ValueType.Raw,
    currency: trade.outputAmount.currency,
  })

  if (!currencyAmount) return

  const feeUSD = parseFloat(outputCurrencyPricePerUnitExact) * parseFloat(currencyAmount.toExact())
  return formatUSDPrice(feeUSD, NumberType.PortfolioBalance)
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
  onShowNetworkFeeInfo: () => void
  onShowSwapFeeInfo: OnShowSwapFeeInfo
  onShowWarning?: () => void
  onShowSlippageModal: () => void
  onShowSwapProtectionModal: () => void
  onShowFOTInfo: () => void
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
  onShowNetworkFeeInfo,
  onShowSwapFeeInfo,
  onShowWarning,
  onShowSlippageModal,
  onShowSwapProtectionModal,
  onShowFOTInfo,
}: SwapDetailsProps): JSX.Element {
  const { t } = useTranslation()
  const [showInverseRate, setShowInverseRate] = useState(false)

  const shouldShowSwapRewrite = useFeatureFlag(FEATURE_FLAGS.SwapRewrite)

  const trade = derivedSwapInfo.trade.trade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade

  if (!trade) {
    throw new Error('Invalid render of `SwapDetails` with no `trade`')
  }

  if (!acceptedTrade) {
    throw new Error('Invalid render of `SwapDetails` with no `acceptedTrade`')
  }

  const acceptedPrice = acceptedTrade.executionPrice
  const acceptedFiatRate = useUSDCPrice(
    showInverseRate ? acceptedPrice.quoteCurrency : acceptedPrice.baseCurrency
  )
  const acceptedRate = getRateToDisplay(acceptedTrade, showInverseRate)

  const latestPrice = trade.executionPrice
  const latestFiatRate = useUSDCPrice(
    showInverseRate ? latestPrice.quoteCurrency : latestPrice.baseCurrency
  )
  const latestRate = getRateToDisplay(trade, showInverseRate)

  const swapFeeInfo = trade.swapFee
    ? {
        noFeeCharged: trade.swapFee.percent.equalTo(0),
        formattedPercent: formatPercent(trade.swapFee.percent.toFixed()),
        formattedAmount:
          getFormattedCurrencyAmount(trade.outputAmount.currency, trade.swapFee.amount) +
          getSymbolDisplayText(trade.outputAmount.currency.symbol),
        formattedAmountUsd: getFormattedFeeAmountUsd(trade, outputCurrencyPricePerUnitExact),
      }
    : undefined

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning = autoSlippageTolerance
    ? acceptedTrade.slippageTolerance > autoSlippageTolerance
    : false

  const shouldUseMevBlocker = useShouldUseMEVBlocker(trade?.inputAmount.currency.chainId)

  const feeOnTransferInfo: FeeOnTransferInfo = useMemo(
    () => ({
      inputTokenInfo: {
        fee: acceptedTrade.inputTax,
        tokenSymbol: acceptedTrade.inputAmount.currency.symbol ?? 'Token sell',
      },
      outputTokenInfo: {
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? 'Token buy',
      },
      onShowInfo: onShowFOTInfo,
    }),
    [
      acceptedTrade.inputAmount.currency.symbol,
      acceptedTrade.inputTax,
      acceptedTrade.outputAmount.currency.symbol,
      acceptedTrade.outputTax,
      onShowFOTInfo,
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
            rate={latestRate}
            setShowInverseRate={setShowInverseRate}
            onAcceptTrade={onAcceptTrade}
          />
        )
      }
      chainId={acceptedTrade.inputAmount.currency.chainId}
      feeOnTransferInfo={feeOnTransferInfo}
      gasFee={gasFee}
      showExpandedChildren={!!customSlippageTolerance}
      showWarning={warning && !newTradeRequiresAcceptance}
      swapFeeInfo={swapFeeInfo}
      warning={warning}
      onShowNetworkFeeInfo={onShowNetworkFeeInfo}
      onShowSwapFeeInfo={onShowSwapFeeInfo}
      onShowWarning={onShowWarning}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Text color="$neutral2" variant="body3">
          {t('Rate')}
        </Text>
        <Flex row shrink justifyContent="flex-end">
          <TouchableOpacity onPress={(): void => setShowInverseRate(!showInverseRate)}>
            <Text adjustsFontSizeToFit numberOfLines={1} variant="body3">
              {/* On the new design, we show the *new* rate on this row. */}
              {shouldShowSwapRewrite ? latestRate : acceptedRate}
              <Text color="$neutral2" variant="body3">
                {shouldShowSwapRewrite &&
                  latestFiatRate &&
                  ` (${formatPrice(latestFiatRate, NumberType.FiatTokenPrice)})`}

                {!shouldShowSwapRewrite &&
                  acceptedFiatRate &&
                  ` (${formatPrice(acceptedFiatRate, NumberType.FiatTokenPrice)})`}
              </Text>
            </Text>
          </TouchableOpacity>
        </Flex>
      </Flex>
      {shouldUseMevBlocker && (
        <Flex row alignItems="center" justifyContent="space-between">
          <TouchableArea onPress={onShowSwapProtectionModal}>
            <Flex centered row gap="$spacing4">
              <Text color="$neutral2" variant="body3">
                {t('Swap protection')}
              </Text>
              <InfoCircleFilled color="$neutral3" size="$icon.16" />
            </Flex>
          </TouchableArea>
          <Flex centered row gap="$spacing8">
            <Icons.ShieldCheck color="$neutral3" size="$icon.16" />
            <Text color="$neutral1" variant="body3">
              {t('On')}
            </Text>
          </Flex>
        </Flex>
      )}
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onShowSlippageModal}>
          <Flex centered row gap="$spacing4">
            <Text color="$neutral2" variant="body3">
              {t('Max slippage')}
            </Text>
            <InfoCircleFilled color="$neutral3" size="$icon.16" />
          </Flex>
        </TouchableArea>
        <Flex row gap="$spacing8">
          {!customSlippageTolerance ? (
            <Flex centered bg="$accent2" borderRadius="$roundedFull" px="$spacing8">
              <Text color="$accent1" variant="buttonLabel4">
                {t('Auto')}
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
  rate,
  setShowInverseRate,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  onAcceptTrade: () => void
  rate: string
  setShowInverseRate: React.Dispatch<React.SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation()

  const shouldShowSwapRewrite = useFeatureFlag(FEATURE_FLAGS.SwapRewrite)

  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
      ? CurrencyField.OUTPUT
      : CurrencyField.INPUT

  const derivedAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]
  const derivedSymbol = getSymbolDisplayText(
    derivedSwapInfo.currencies[derivedCurrencyField]?.currency.symbol
  )
  const formattedDerivedAmount = formatCurrencyAmount(derivedAmount, NumberType.TokenTx)

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
      <Flex centered row>
        <Text color="$neutral2" variant="body3">
          {!shouldShowSwapRewrite
            ? t('New rate')
            : derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT
            ? t('New output')
            : t('New input')}
        </Text>
      </Flex>

      {shouldShowSwapRewrite ? (
        <Flex fill row shrink flexBasis="100%" justifyContent="flex-end">
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
      ) : (
        <Flex fill row shrink flexBasis="100%" justifyContent="flex-end">
          <TouchableOpacity
            onPress={(): void => setShowInverseRate((showInverseRate) => !showInverseRate)}>
            <Text
              adjustsFontSizeToFit
              color="$neutral1"
              numberOfLines={1}
              textAlign="center"
              variant="body3">
              {rate}
            </Text>
          </TouchableOpacity>
        </Flex>
      )}

      <Flex centered row>
        <Trace logPress element={ElementName.AcceptNewRate}>
          <TouchableArea
            bg="$accentSoft"
            borderRadius="$rounded12"
            px="$spacing8"
            py="$spacing4"
            onPress={onAcceptTrade}>
            <Text color="$accent1" variant="buttonLabel3">
              {t('Accept')}
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
