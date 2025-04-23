import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { AcrossRoutingInfo } from 'uniswap/src/features/transactions/swap/modals/AcrossRoutingInfo'
import { EstimatedTime } from 'uniswap/src/features/transactions/swap/review/EstimatedTime'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/MaxSlippageRow'
import { AcceptNewQuoteRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/AcceptNewQuoteRow'
import { HeightAnimatorWrapper } from 'uniswap/src/features/transactions/swap/review/SwapDetails/HeightAnimatorWrapper'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/PriceImpactRow'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/review/SwapRateRatio'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/review/modals/RoutingInfo'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

interface SwapDetailsProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  tokenWarningProps: TokenWarningProps
  tokenWarningChecked?: boolean
  gasFallbackUsed?: boolean
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  newTradeRequiresAcceptance: boolean
  warning?: Warning
  onAcceptTrade: () => void
  onShowWarning?: () => void
  setTokenWarningChecked?: (checked: boolean) => void
  txSimulationErrors?: TransactionFailureReason[]
}

export function SwapDetails({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
  derivedSwapInfo,
  feeOnTransferProps,
  tokenWarningProps,
  tokenWarningChecked,
  gasFee,
  uniswapXGasBreakdown,
  newTradeRequiresAcceptance,
  warning,
  onAcceptTrade,
  onShowWarning,
  setTokenWarningChecked,
  txSimulationErrors,
}: SwapDetailsProps): JSX.Element {
  const v4SwapEnabled = useV4SwapEnabled(derivedSwapInfo.chainId)
  const { t } = useTranslation()

  const isBridgeTrade = derivedSwapInfo.trade.trade && isBridge(derivedSwapInfo.trade.trade)

  const trade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)

  if (!trade) {
    throw new Error('Invalid render of `SwapDetails` with no `trade`')
  }

  if (!acceptedTrade) {
    throw new Error('Invalid render of `SwapDetails` with no `acceptedTrade`')
  }

  const estimatedBridgingTime = useMemo(() => {
    const tradeQuote = derivedSwapInfo.trade.trade?.quote

    if (!tradeQuote || !isBridge(tradeQuote)) {
      return undefined
    }

    return tradeQuote.quote.estimatedFillTimeMs
  }, [derivedSwapInfo.trade.trade?.quote])

  return (
    <HeightAnimatorWrapper>
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
        tokenWarningProps={tokenWarningProps}
        tokenWarningChecked={tokenWarningChecked}
        setTokenWarningChecked={setTokenWarningChecked}
        gasFee={gasFee}
        swapFee={acceptedTrade.swapFee}
        swapFeeUsd={swapFeeUsd}
        indicative={acceptedTrade.indicative}
        outputCurrency={acceptedTrade.outputAmount.currency}
        showExpandedChildren={!!customSlippageTolerance}
        showWarning={warning && !newTradeRequiresAcceptance}
        transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
        uniswapXGasBreakdown={uniswapXGasBreakdown}
        warning={warning}
        estimatedBridgingTime={estimatedBridgingTime}
        isBridgeTrade={isBridgeTrade ?? false}
        txSimulationErrors={txSimulationErrors}
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
        {isBridgeTrade && <EstimatedTime visibleIfLong={false} timeMs={estimatedBridgingTime} />}
        {isBridgeTrade && <AcrossRoutingInfo />}
        {!isBridgeTrade && (
          <MaxSlippageRow
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            autoSlippageTolerance={autoSlippageTolerance}
            customSlippageTolerance={customSlippageTolerance}
          />
        )}
        {!isBridgeTrade && v4SwapEnabled && (
          <RoutingInfo gasFee={gasFee} chainId={acceptedTrade.inputAmount.currency.chainId} />
        )}
        <PriceImpactRow derivedSwapInfo={acceptedDerivedSwapInfo} />
      </TransactionDetails>
    </HeightAnimatorWrapper>
  )
}
