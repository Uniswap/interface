import { TradingApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Accordion, Flex, Text } from 'ui/src'
import {
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/components/PriceImpactRow/PriceImpactRow'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

export function ExpandableRows(): JSX.Element | null {
  const { t } = useTranslation()
  const { gasFee, gasFeeBreakdown } = useSwapTxStore((s) => {
    if (isUniswapX(s)) {
      return {
        gasFee: s.gasFee,
        gasFeeBreakdown: s.gasFeeBreakdown,
      }
    }

    return {
      gasFee: s.gasFee,
      gasFeeBreakdown: undefined,
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

  if (!trade.trade) {
    return null
  }

  return (
    <Accordion.HeightAnimator animation="fast" mt="$spacing8">
      <Accordion.Content animation="fast" p="$none" exitStyle={{ opacity: 0 }}>
        <TransactionDetails
          showExpandedChildren
          routingType={trade.trade.routing}
          chainId={trade.trade.inputAmount.currency.chainId}
          gasFee={gasFee}
          swapFee={trade.trade.swapFee}
          swapFeeUsd={swapFeeUsd}
          indicative={trade.trade.indicative}
          feeOnTransferProps={feeOnTransferProps}
          showGasFeeError={false}
          showSeparatorToggle={false}
          outputCurrency={trade.trade.outputAmount.currency}
          transactionUSDValue={derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]}
          uniswapXGasBreakdown={gasFeeBreakdown}
          RoutingInfo={<RoutingInfo trade={trade.trade} gasFee={gasFee} chainId={chainId} />}
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
          {/* Price impact row is hidden if a price impact warning is already being shown in the expando toggle row. */}
          <PriceImpactRow derivedSwapInfo={derivedSwapInfo} hide={showPriceImpactWarning} />
          {trade.trade.routing !== TradingApi.Routing.BRIDGE && (
            <MaxSlippageRow
              acceptedDerivedSwapInfo={derivedSwapInfo}
              autoSlippageTolerance={autoSlippageTolerance}
              customSlippageTolerance={customSlippageTolerance}
            />
          )}
        </TransactionDetails>
      </Accordion.Content>
    </Accordion.HeightAnimator>
  )
}
