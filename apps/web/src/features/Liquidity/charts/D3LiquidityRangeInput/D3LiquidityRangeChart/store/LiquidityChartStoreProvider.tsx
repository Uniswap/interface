import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { createLiquidityChartStore } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { LiquidityChartStoreContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'

interface LiquidityChartStoreProviderProps {
  tickSpacing: number
  inputMode?: RangeAmountInputPriceMode
  children: ReactNode
  minTick?: number
  maxTick?: number
  /** Current tick in visual space — pre-negated when priceInverted, matching the chart's currentTick prop */
  currentTick: number
  currentPrice?: number
  creatingPoolOrPair?: boolean
  /** True once the user has edited the initial-price field — distinguishes a deliberate price edit
   * from the streamed reference re-seeding on its own, so a preset only recenters on the former. */
  isInitialPriceDirty?: boolean
  isFullRange?: boolean
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  selectedHistoryDuration: HistoryDuration
  onChartError: (error: string) => void
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
  onMinTickChange: (tick?: number) => void
  onMaxTickChange: (tick?: number) => void
  onMinMaxTickChange: (ticks: { minTick?: number; maxTick?: number }) => void
  onTimePeriodChange?: (timePeriod: HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}

function LiquidityChartStoreProviderInner({
  children,
  minTick,
  maxTick,
  currentTick,
  currentPrice,
  tickSpacing,
  isFullRange,
  isInitialPriceDirty,
}: PropsWithChildren<
  Pick<
    LiquidityChartStoreProviderProps,
    'minTick' | 'maxTick' | 'currentTick' | 'currentPrice' | 'tickSpacing' | 'isFullRange' | 'isInitialPriceDirty'
  >
>) {
  const store = useContext(LiquidityChartStoreContext)
  const { syncIsFullRangeFromParent, syncCurrentTickFromParent } = useLiquidityChartStoreActions()

  // Sync minTick and maxTick
  useEffect(() => {
    if (isFullRange || !store) {
      return
    }

    store.setState({
      minTick,
      maxTick,
    })
  }, [minTick, maxTick, isFullRange, store])

  // Sync currentTick/currentPrice/tickSpacing — while creating, the first two change on every
  // initial-price edit and the spacing changes with the fee tier, none of which remount the store.
  // isInitialPriceDirty rides along so the action can tell a user edit from a self-moving re-seed.
  useEffect(() => {
    syncCurrentTickFromParent({ currentTick, currentPrice, tickSpacing, isInitialPriceDirty })
  }, [currentTick, currentPrice, tickSpacing, isInitialPriceDirty, syncCurrentTickFromParent])

  // Sync isFullRange
  useEffect(() => {
    syncIsFullRangeFromParent(isFullRange ?? false)
  }, [isFullRange, syncIsFullRangeFromParent])

  return children
}

export function LiquidityChartStoreProvider({
  children,
  inputMode,
  minTick,
  maxTick,
  currentTick,
  currentPrice,
  creatingPoolOrPair,
  isInitialPriceDirty,
  tickSpacing,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
  isFullRange,
  selectedHistoryDuration,
  onChartError,
  onInputModeChange,
  onMinTickChange,
  onMaxTickChange,
  onMinMaxTickChange,
  onTimePeriodChange,
  setIsFullRange,
}: LiquidityChartStoreProviderProps) {
  const [store] = useState(() =>
    createLiquidityChartStore({
      inputMode,
      minTick,
      maxTick,
      currentTick,
      currentPrice,
      creatingPoolOrPair,
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
      isFullRange,
      selectedHistoryDuration,
      onChartError,
      onInputModeChange,
      onMinTickChange,
      onMaxTickChange,
      onMinMaxTickChange,
      onTimePeriodChange,
      setIsFullRange,
    }),
  )

  return (
    <LiquidityChartStoreContext.Provider value={store}>
      <LiquidityChartStoreProviderInner
        minTick={minTick}
        maxTick={maxTick}
        currentTick={currentTick}
        currentPrice={currentPrice}
        tickSpacing={tickSpacing}
        isFullRange={isFullRange}
        isInitialPriceDirty={isInitialPriceDirty}
      >
        {children}
      </LiquidityChartStoreProviderInner>
    </LiquidityChartStoreContext.Provider>
  )
}
