import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { Flex } from 'ui/src'
import { toHistoryDuration } from '~/appGraphql/data/util'
import { ChartType } from '~/components/Charts/utils'
import { ChartControls } from '~/pages/TokenDetails/components/chart/ChartControls'
import { getDisplayPriceChartType } from '~/pages/TokenDetails/components/chart/TDPChartState'
import {
  TDPChartStateProvider,
  useTDPChartStateContext,
} from '~/pages/TokenDetails/components/chart/TDPChartStateContext'
import { TDPPriceChartPanel } from '~/pages/TokenDetails/components/chart/TDPPriceChartPanel'
import { TDPTvlChartPanel } from '~/pages/TokenDetails/components/chart/TDPTvlChartPanel'
import { TDPVolumeChartPanel } from '~/pages/TokenDetails/components/chart/TDPVolumeChartPanel'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { getTDPChartGraphqlTarget } from '~/pages/TokenDetails/hooks/getTDPChartGraphqlTarget'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

function ChartSectionBody(): JSX.Element {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  const {
    tokenColor,
    currency,
    tokenQueryData,
    pathGraphqlChain,
    pathTokenDbAddress,
    selectedMultichainChainId,
    multiChainMap,
  } = useTDPStore((s) => ({
    tokenColor: s.tokenColor,
    currency: s.currency!,
    tokenQueryData: s.tokenQuery.data?.token,
    pathGraphqlChain: s.currencyChain,
    pathTokenDbAddress: s.tokenQuery.variables?.address,
    selectedMultichainChainId: s.selectedMultichainChainId,
    multiChainMap: s.multiChainMap,
  }))

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1

  const showMultichainAggregation =
    multichainTokenUxEnabled && isMultiChainAsset && selectedMultichainChainId === undefined

  const { chain: tokenChain, address: tokenDBAddress } = useMemo(
    () =>
      getTDPChartGraphqlTarget({
        multichainTokenUxEnabled,
        selectedMultichainChainId,
        tokenQueryData,
        pathGraphqlChain,
        pathTokenDbAddress,
      }),
    [multichainTokenUxEnabled, pathGraphqlChain, pathTokenDbAddress, selectedMultichainChainId, tokenQueryData],
  )

  const { chartType, timePeriod, priceChartType, disableCandlestickUI, setDisableCandlestickUI } =
    useTDPChartStateContext()

  const variables = useMemo(
    () => ({
      address: tokenDBAddress,
      chain: tokenChain,
      duration: toHistoryDuration(timePeriod),
      multichain: showMultichainAggregation,
    }),
    [showMultichainAggregation, timePeriod, tokenChain, tokenDBAddress],
  )

  const displayPriceChartType = getDisplayPriceChartType(priceChartType, disableCandlestickUI)

  return (
    <Flex data-cy={`tdp-${chartType}-chart-container`} testID={`tdp-${chartType}-chart-container`}>
      {chartType === ChartType.PRICE && (
        <TDPPriceChartPanel
          variables={variables}
          priceChartType={priceChartType}
          displayPriceChartType={displayPriceChartType}
          setDisableCandlestickUI={setDisableCandlestickUI}
          tokenColor={tokenColor}
          timePeriod={timePeriod}
          currency={currency}
        />
      )}
      {chartType === ChartType.VOLUME && (
        <TDPVolumeChartPanel variables={variables} tokenColor={tokenColor} timePeriod={timePeriod} />
      )}
      {chartType === ChartType.TVL && <TDPTvlChartPanel variables={variables} tokenColor={tokenColor} />}
      <ChartControls />
    </Flex>
  )
}

export function ChartSection(): JSX.Element {
  return (
    <TDPChartStateProvider>
      <ChartSectionBody />
    </TDPChartStateProvider>
  )
}
