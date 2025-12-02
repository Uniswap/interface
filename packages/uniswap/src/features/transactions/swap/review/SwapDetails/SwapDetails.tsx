import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, Text } from 'ui/src'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { EstimatedBridgeTime } from 'uniswap/src/features/transactions/swap/components/EstimatedBridgeTime'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/PriceImpactRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { AcceptNewQuoteRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/AcceptNewQuoteRow'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isMobileApp, isMobileWeb } from 'utilities/src/platform'

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
  txSimulationErrors?: TradingApi.TransactionFailureReason[]
  includesDelegation?: boolean
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
  includesDelegation,
}: SwapDetailsProps): JSX.Element {
  const priceUxEnabled = usePriceUXEnabled()
  const { t } = useTranslation()

  const isBridgeTrade = derivedSwapInfo.trade.trade && isBridge(derivedSwapInfo.trade.trade)

  const trade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)

  const showUnichainPoweredMessage = useIsUnichainFlashblocksEnabled(derivedSwapInfo.chainId)

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
    <HeightAnimator animationDisabled={isMobileApp || isMobileWeb}>
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
        showNetworkLogo={!showUnichainPoweredMessage}
        showWarning={warning && !newTradeRequiresAcceptance}
        transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
        uniswapXGasBreakdown={uniswapXGasBreakdown}
        warning={warning}
        estimatedBridgingTime={estimatedBridgingTime}
        isBridgeTrade={isBridgeTrade ?? false}
        txSimulationErrors={txSimulationErrors}
        amountUserWillReceive={derivedSwapInfo.outputAmountUserWillReceive ?? undefined}
        includesDelegation={includesDelegation}
        onShowWarning={onShowWarning}
      >
        <Flex row alignItems="center" justifyContent="space-between">
          <Text color="$neutral2" variant="body3">
            {t('swap.details.rate')}
          </Text>
          <SwapRateRatio trade={trade} derivedSwapInfo={acceptedDerivedSwapInfo} justifyContent="flex-end" />
        </Flex>
        {isBridgeTrade && <EstimatedBridgeTime visibleIfLong={false} timeMs={estimatedBridgingTime} />}
        {isBridgeTrade === false && (
          <MaxSlippageRow
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            autoSlippageTolerance={autoSlippageTolerance}
            customSlippageTolerance={customSlippageTolerance}
          />
        )}
        {!acceptedTrade.indicative && (
          <RoutingInfo trade={acceptedTrade} gasFee={gasFee} chainId={acceptedTrade.inputAmount.currency.chainId} />
        )}
        {!priceUxEnabled && <PriceImpactRow derivedSwapInfo={acceptedDerivedSwapInfo} />}
      </TransactionDetails>
    </HeightAnimator>
  )
}
