import { useEffect, useState } from 'react'
import { Flex, Text, isWeb } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeHighRelativeToValue,
  useUSDValue,
} from 'uniswap/src/features/gas/hooks'
import { FormattedUniswapXGasFeeInfo, GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { NetworkFeeWarning } from 'uniswap/src/features/transactions/swap/modals/NetworkFeeWarning'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/review/SwapRateRatio'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'

type DebouncedGasInfo = {
  gasFee: GasFeeResult
  fiatPriceFormatted?: string
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  isHighRelativeToValue: boolean
  isLoading: boolean
}

export function useDebouncedGasInfo(): DebouncedGasInfo {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const {
    derivedSwapInfo: { chainId, currencyAmountsUSDValue, trade, currencyAmounts, exactCurrencyField },
  } = useSwapFormContext()
  const inputUSDValue = currencyAmountsUSDValue[CurrencyField.INPUT]
  const outputUSDValue = currencyAmountsUSDValue[CurrencyField.OUTPUT]

  const swapTxContext = useSwapTxContext()
  const { gasFee } = swapTxContext
  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(
    isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined,
    chainId,
  )

  const usdPrice = useUSDValue(chainId, gasFee?.value)
  const isHighRelativeToValue = useGasFeeHighRelativeToValue(usdPrice, outputUSDValue ?? inputUSDValue)

  const amountChanged = usePrevious(currencyAmounts[exactCurrencyField]) !== currencyAmounts[exactCurrencyField]
  const tradeChanged = usePrevious(trade.trade) !== trade.trade && Boolean(trade.trade)

  const tradeLoadingOrRefetching = Boolean(trade.isLoading || trade.isFetching)
  const gasLoading = Boolean(gasFee.isLoading || (gasFee.value && !usdPrice))

  const isLoading = tradeLoadingOrRefetching || gasLoading || amountChanged || tradeChanged

  const [info, setInfo] = useState<DebouncedGasInfo>({ gasFee, isHighRelativeToValue, uniswapXGasFeeInfo, isLoading })

  useEffect(() => {
    if (isLoading) {
      setInfo((prev) => ({ ...prev, isLoading }))
    } else {
      const fiatPriceFormatted = usdPrice ? convertFiatAmountFormatted(usdPrice, NumberType.FiatGasPrice) : undefined
      setInfo({ gasFee, fiatPriceFormatted, isHighRelativeToValue, uniswapXGasFeeInfo, isLoading })
    }
  }, [convertFiatAmountFormatted, gasFee, isHighRelativeToValue, isLoading, uniswapXGasFeeInfo, usdPrice])

  return info
}

function useDebouncedTrade(): Trade | IndicativeTrade | undefined {
  const {
    derivedSwapInfo: { trade },
  } = useSwapFormContext()
  const [debouncedTrade, setDebouncedTrade] = useState<Trade | IndicativeTrade>()

  useEffect(() => {
    if (trade.trade) {
      setDebouncedTrade(trade.trade)
    } else if (trade.indicativeTrade) {
      setDebouncedTrade(trade.indicativeTrade)
    } else if (!trade.isLoading) {
      setDebouncedTrade(undefined)
    }
  }, [trade.indicativeTrade, trade.isLoading, trade.trade])

  return debouncedTrade
}

function GasRow({ gasInfo }: { gasInfo: DebouncedGasInfo }): JSX.Element | null {
  if (gasInfo.fiatPriceFormatted) {
    const color = gasInfo.isHighRelativeToValue ? '$statusCritical' : '$neutral2'
    const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted
    const body = uniswapXSavings ? (
      <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} preSavingsGasFee={uniswapXSavings} smaller={isWeb} />
    ) : (
      <>
        <Gas color={color} size="$icon.16" />
        <Text color={color} variant={isWeb ? 'body4' : 'body3'}>
          {gasInfo.fiatPriceFormatted}
        </Text>
      </>
    )

    return (
      <Flex centered row animation="quick" enterStyle={{ opacity: 0 }} opacity={gasInfo.isLoading ? 0.6 : 1}>
        <NetworkFeeWarning
          gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
          placement="bottom"
          tooltipTrigger={
            <Flex centered row gap="$spacing4">
              {body}
            </Flex>
          }
          uniswapXGasFeeInfo={gasInfo.uniswapXGasFeeInfo}
        />
      </Flex>
    )
  } else {
    return null
  }
}

// GasTradeRow take `gasInfo` as a prop (rather than directly using useDebouncedGasInfo) because on mobile,
// the parent needs to check whether to render an empty row based on `gasInfo` fields first.
export function GasTradeRow({ gasInfo }: { gasInfo: DebouncedGasInfo }): JSX.Element {
  // Debounce the trade to prevent flickering on input
  const debouncedTrade = useDebouncedTrade()

  if (isMobileApp) {
    return <GasRow gasInfo={gasInfo} />
  }

  return (
    <Flex centered row>
      {debouncedTrade && (
        <Flex fill>
          <SwapRateRatio initialInverse={true} styling="secondary" trade={debouncedTrade} />
        </Flex>
      )}
      <GasRow gasInfo={gasInfo} />
    </Flex>
  )
}
