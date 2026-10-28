import type { GasFeeResult } from '@universe/api'
import { type TradingApi } from '@universe/api'
import { isMobileApp, isMobileWeb } from '@universe/environment'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { EstimatedSwapTime } from '@universe/swap-ui'
import { useMemo } from 'react'
import { type Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { PriceDifferenceRow } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/PriceDifferenceRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RoutingInfo'
import { SwapRateRow } from 'uniswap/src/features/transactions/swap/components/SwapRateRow'
import { AcceptNewQuoteRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/AcceptNewQuoteRow'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import {
  isBridge,
  isChained,
  isMultiChainGasQuote,
  isSwapRouting,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
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
  txSimulationErrors?: TradingApi.TransactionFailureReason[]
  includesDelegation?: boolean
  BannerSlot?: React.ReactNode
  NetworkCostRowSlot?: React.ReactNode
  sponsorshipInfo?: TradingApi.SponsorshipInfo
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
  BannerSlot,
  NetworkCostRowSlot,
  sponsorshipInfo,
}: SwapDetailsProps): JSX.Element {
  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade
  const routedTrade = derivedSwapInfo.trade.trade
  const trade = derivedSwapInfo.trade.trade ?? derivedSwapInfo.trade.indicativeTrade

  const isBridgeTrade = routedTrade && isBridge(routedTrade)
  const routing = routedTrade?.routing
  // Indicative quotes have no routing yet, and wraps render `SwapReviewWrapTransactionDetails`
  // instead, so anything without a routed trade here is a swap.
  const isSwap = routedTrade ? isSwapRouting(routedTrade) : true

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)

  if (!trade) {
    throw new Error('Invalid render of `SwapDetails` with no `trade`')
  }

  if (!acceptedTrade) {
    throw new Error('Invalid render of `SwapDetails` with no `acceptedTrade`')
  }

  const tradeQuote = routedTrade?.quote

  const estimatedSwapTime: number | undefined = useMemo(() => {
    if (!tradeQuote) {
      return undefined
    }

    if (isChained(tradeQuote)) {
      return tradeQuote.quote.timeEstimateMs
    }
    if (isBridge(tradeQuote)) {
      return tradeQuote.quote.estimatedFillTimeMs
    }

    return undefined
  }, [tradeQuote])

  const showNetworkLogo = !isMultiChainGasQuote(tradeQuote)
  const showCollapsedPriceImpactRow =
    warning?.type === WarningLabel.PriceDifferenceHigh || warning?.type === WarningLabel.PriceDifferenceMedium

  return (
    <HeightAnimator animationDisabled={isMobileApp || isMobileWeb}>
      <TransactionDetails
        banner={
          newTradeRequiresAcceptance ? (
            <AcceptNewQuoteRow
              acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
              derivedSwapInfo={derivedSwapInfo}
              onAcceptTrade={onAcceptTrade}
            />
          ) : (
            BannerSlot
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
        showNetworkLogo={showNetworkLogo}
        showWarning={warning && !newTradeRequiresAcceptance}
        transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
        uniswapXGasBreakdown={uniswapXGasBreakdown}
        warning={warning}
        estimatedSwapTime={estimatedSwapTime}
        isSwap={isSwap}
        routingType={routing}
        txSimulationErrors={txSimulationErrors}
        includesDelegation={includesDelegation}
        NetworkCostRowSlot={NetworkCostRowSlot}
        sponsorshipInfo={sponsorshipInfo}
        CollapsedInfoRow={
          showCollapsedPriceImpactRow ? <PriceDifferenceRow derivedSwapInfo={acceptedDerivedSwapInfo} /> : undefined
        }
        RateInfo={<SwapRateRow trade={trade} derivedSwapInfo={acceptedDerivedSwapInfo} />}
        onShowWarning={onShowWarning}
      >
        <EstimatedSwapTime showIfLongerThanCutoff={false} timeMs={estimatedSwapTime} />
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
        <PriceDifferenceRow derivedSwapInfo={acceptedDerivedSwapInfo} />
      </TransactionDetails>
    </HeightAnimator>
  )
}
