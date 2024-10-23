import { useEffect, useState } from 'react'
import { Accordion, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Gas } from 'ui/src/components/icons/Gas'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeFormattedAmounts,
  useGasFeeHighRelativeToValue,
} from 'uniswap/src/features/gas/hooks'
import { FormattedUniswapXGasFeeInfo, GasFeeResult } from 'uniswap/src/features/gas/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { NetworkFeeWarning } from 'uniswap/src/features/transactions/swap/modals/NetworkFeeWarning'
import { PriceImpactWarning } from 'uniswap/src/features/transactions/swap/modals/PriceImpactWarning'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/review/SwapRateRatio'
import { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface, isMobileApp } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'

type DebouncedGasInfo = {
  gasFee: GasFeeResult
  fiatPriceFormatted?: string
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  isHighRelativeToValue: boolean
  isLoading: boolean
}

export function useDebouncedGasInfo(): DebouncedGasInfo {
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

  const { gasFeeFormatted, gasFeeUSD } = useGasFeeFormattedAmounts({
    gasFee,
    chainId,
    placeholder: undefined,
  })

  const isHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, outputUSDValue ?? inputUSDValue)

  const amountChanged = usePrevious(currencyAmounts[exactCurrencyField]) !== currencyAmounts[exactCurrencyField]
  const tradeChanged = usePrevious(trade.trade) !== trade.trade && Boolean(trade.trade)

  const tradeLoadingOrRefetching = Boolean(trade.isLoading || trade.isFetching)
  const gasLoading = Boolean(gasFee.isLoading || (gasFee.value && !gasFeeUSD))

  const isLoading = tradeLoadingOrRefetching || gasLoading || amountChanged || tradeChanged

  const [info, setInfo] = useState<DebouncedGasInfo>({ gasFee, isHighRelativeToValue, uniswapXGasFeeInfo, isLoading })

  useEffect(() => {
    if (isLoading) {
      setInfo((prev) => ({ ...prev, isLoading }))
    } else {
      setInfo({
        gasFee,
        fiatPriceFormatted: gasFeeFormatted ?? undefined,
        isHighRelativeToValue,
        uniswapXGasFeeInfo,
        isLoading,
      })
    }
  }, [gasFee, gasFeeFormatted, isHighRelativeToValue, isLoading, uniswapXGasFeeInfo])

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

function GasRow({ gasInfo, hidden }: { gasInfo: DebouncedGasInfo; hidden?: boolean }): JSX.Element | null {
  if (gasInfo.fiatPriceFormatted) {
    const color = gasInfo.isHighRelativeToValue && !isInterface ? '$statusCritical' : '$neutral2' // Avoid high gas UI on interface
    const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted
    const body = uniswapXSavings ? (
      <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} preSavingsGasFee={uniswapXSavings} />
    ) : (
      <>
        <Gas color={color} size="$icon.16" />
        <Text color={color} variant="body3">
          {gasInfo.fiatPriceFormatted}
        </Text>
      </>
    )

    return (
      <Flex
        centered
        row
        animation="quick"
        enterStyle={{ opacity: 0 }}
        opacity={hidden ? 0 : gasInfo.isLoading ? 0.6 : 1}
      >
        <NetworkFeeWarning
          gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
          placement={isInterface ? 'right' : 'bottom'}
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
export function GasTradeRow({
  gasInfo,
  showPriceImpactWarning,
  priceImpactWarning,
}: {
  gasInfo: DebouncedGasInfo
  showPriceImpactWarning?: boolean
  priceImpactWarning?: Warning
}): JSX.Element | null {
  // Debounce the trade to prevent flickering on input
  const debouncedTrade = useDebouncedTrade()
  const warningColor = getAlertColor(priceImpactWarning?.severity)
  const { isTestnetModeEnabled } = useEnabledChains()

  if (isTestnetModeEnabled) {
    return null
  }

  if (isMobileApp) {
    return <GasRow gasInfo={gasInfo} />
  }

  return (
    <Flex centered row>
      <Flex fill>
        {debouncedTrade && !showPriceImpactWarning && (
          <SwapRateRatio initialInverse={true} styling="secondary" trade={debouncedTrade} />
        )}

        {showPriceImpactWarning && priceImpactWarning && (
          <PriceImpactWarning warning={priceImpactWarning}>
            <Flex row centered>
              <AlertTriangleFilled mr={2} color={warningColor.text} size="$icon.16" />
              <Text color={warningColor.text} variant="body3">
                {priceImpactWarning.title}
              </Text>
            </Flex>
          </PriceImpactWarning>
        )}
      </Flex>

      {debouncedTrade ? (
        <Accordion.Trigger
          p="$none"
          style={{ background: '$surface1' }}
          focusStyle={{ background: '$surface1' }}
          hoverStyle={{ background: '$surface1' }}
        >
          {({ open }: { open: boolean }) => (
            <Flex row gap="$spacing4" alignItems="center">
              <GasRow gasInfo={gasInfo} hidden={open} />
              <RotatableChevron
                animation="fast"
                width={iconSizes.icon16}
                height={iconSizes.icon16}
                direction={open ? 'up' : 'down'}
                color="$neutral3"
              />
            </Flex>
          )}
        </Accordion.Trigger>
      ) : (
        <GasRow gasInfo={gasInfo} />
      )}
    </Flex>
  )
}
