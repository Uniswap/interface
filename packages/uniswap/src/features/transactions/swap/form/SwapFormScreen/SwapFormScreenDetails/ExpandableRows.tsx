import { TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Accordion, Flex, Text } from 'ui/src'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RoutingInfo'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { FormNetworkCostRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/FormNetworkCostRow'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isMultiChainGasQuote, isUniswapX, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

export function ExpandableRows(): JSX.Element | null {
  const { t } = useTranslation()
  const { gasFee, gasFeeBreakdown, txRequests } = useSwapTxStore((s) => {
    if (isUniswapX(s)) {
      return {
        gasFee: s.gasFee,
        gasFeeBreakdown: s.gasFeeBreakdown,
        txRequests: undefined,
      }
    }

    return {
      gasFee: s.gasFee,
      gasFeeBreakdown: undefined,
      txRequests: 'txRequests' in s ? s.txRequests : undefined,
    }
  })

  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const { priceImpactWarning } = useParsedSwapWarnings()
  const showPriceImpactWarning = Boolean(priceImpactWarning)

  const customSlippageTolerance = useTransactionSettingsStore((s) => s.customSlippageTolerance)
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)

  const { chainId, trade } = derivedSwapInfo

  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const feeOnTransferProps = useFeeOnTransferAmounts(derivedSwapInfo)

  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  const isCustomGasFlowAvailable = useIsCustomGasFlowAvailable()

  if (!trade.trade) {
    return null
  }

  const inputCurrencyChainId = trade.trade.inputAmount.currency.chainId
  const isUniswapXTrade = isUniswapX({ routing: trade.trade.routing })

  const sponsorshipInfo = 'sponsorshipInfo' in trade.trade.quote ? trade.trade.quote.sponsorshipInfo : undefined

  // Only render the tappable row when the user has opted into custom entry
  // AND the trade is EVM. UniswapX has no editable EVM tx (txRequests is
  // forced to undefined above), so the editor would open without a recommended
  // baseline and saved overrides would carry into the next EVM swap. Falling
  // through to the default <NetworkFee /> keeps the UniswapX display unchanged.
  const NetworkCostRowSlot =
    isGasFeeOverridesEnabled && isCustomGasFlowAvailable && enableCustomGasFeeEntry && !isUniswapXTrade ? (
      <FormNetworkCostRow gasFee={gasFee} tx={txRequests?.[0]} chainId={inputCurrencyChainId} />
    ) : undefined

  return (
    <Accordion.HeightAnimator animation="fast" mt="$spacing8">
      <Accordion.Content animation="fast" p="$none" exitStyle={{ opacity: 0 }}>
        <TransactionDetails
          showExpandedChildren
          routingType={trade.trade.routing}
          chainId={inputCurrencyChainId}
          gasFee={gasFee}
          NetworkCostRowSlot={NetworkCostRowSlot}
          swapFee={trade.trade.swapFee}
          swapFeeUsd={swapFeeUsd}
          indicative={trade.trade.indicative}
          feeOnTransferProps={feeOnTransferProps}
          showGasFeeError={false}
          showSeparatorToggle={false}
          showNetworkLogo={!isMultiChainGasQuote(trade.trade.quote)}
          outputCurrency={trade.trade.outputAmount.currency}
          transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
          uniswapXGasBreakdown={gasFeeBreakdown}
          sponsorshipInfo={sponsorshipInfo}
          RateInfo={
            showPriceImpactWarning ? (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral2" variant="body3">
                  {t('swap.details.rate')}
                </Text>
                <Flex row shrink justifyContent="flex-end">
                  <SwapRateRatio trade={trade.trade} derivedSwapInfo={derivedSwapInfo} />
                </Flex>
              </Flex>
            ) : undefined
          }
        >
          {trade.trade.routing !== TradingApi.Routing.BRIDGE && (
            <MaxSlippageRow
              acceptedDerivedSwapInfo={derivedSwapInfo}
              autoSlippageTolerance={autoSlippageTolerance}
              customSlippageTolerance={customSlippageTolerance}
            />
          )}
          {trade.trade.routing !== TradingApi.Routing.BRIDGE && !isWrap(trade.trade) && (
            <RoutingInfo trade={trade.trade} gasFee={gasFee} chainId={chainId} />
          )}
        </TransactionDetails>
      </Accordion.Content>
    </Accordion.HeightAnimator>
  )
}
