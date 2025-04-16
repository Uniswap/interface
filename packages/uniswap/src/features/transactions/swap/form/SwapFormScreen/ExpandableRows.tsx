import { useTranslation } from 'react-i18next'
import { Accordion, Flex, Text } from 'ui/src'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { AcrossRoutingInfo } from 'uniswap/src/features/transactions/swap/modals/AcrossRoutingInfo'
import { MaxSlippageRow } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/MaxSlippageRow'
import { PriceImpactRow } from 'uniswap/src/features/transactions/swap/review/SwapDetails/PriceImpactRow'

import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/review/SwapRateRatio'
import { RoutingInfo } from 'uniswap/src/features/transactions/swap/review/modals/RoutingInfo'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

export function ExpandableRows({ isBridge }: { isBridge?: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const swapTxContext = useSwapTxContext()

  const { gasFee } = swapTxContext
  const uniswapXGasBreakdown = isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined

  const { derivedSwapInfo } = useSwapFormContext()

  const { priceImpactWarning } = useParsedSwapWarnings()
  const showPriceImpactWarning = Boolean(priceImpactWarning)

  const { autoSlippageTolerance, customSlippageTolerance } = useTransactionSettingsContext()
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
          isSwap
          showExpandedChildren
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
          uniswapXGasBreakdown={uniswapXGasBreakdown}
          RoutingInfo={isBridge ? <AcrossRoutingInfo /> : <RoutingInfo gasFee={gasFee} chainId={chainId} />}
          RateInfo={
            showPriceImpactWarning && trade.trade ? (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral2" variant="body3">
                  {t('swap.details.rate')}
                </Text>
                <Flex row shrink justifyContent="flex-end">
                  <SwapRateRatio trade={trade.trade} />
                </Flex>
              </Flex>
            ) : undefined
          }
        >
          {/* Price impact row is hidden if a price impact warning is already being shown in the expando toggle row. */}
          <PriceImpactRow derivedSwapInfo={derivedSwapInfo} hide={showPriceImpactWarning} />
          {!isBridge && (
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
