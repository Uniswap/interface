import { Flex } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle } from '~/features/Explore/chart/ChartTypeToggle'
import { getPillTimeSelectorOptions } from '~/features/Explore/timeLabels'
import { AdvancedPriceChartToggle } from '~/pages/TokenDetails/components/chart/AdvancedPriceChartToggle'
import { usePrefetchTDPChartHistory } from '~/pages/TokenDetails/components/chart/hooks/usePrefetchTDPChartHistory'
import {
  getDisplayPriceChartType,
  type TDPChartQueryVariables,
  type TokenDetailsChartType,
} from '~/pages/TokenDetails/components/chart/TDPChartState'
import { useTDPChartStateContext } from '~/pages/TokenDetails/components/chart/TDPChartStateContext'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

const TOKEN_DETAILS_CHART_OPTIONS: TokenDetailsChartType[] = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL]

export function ChartControls({ variables }: { variables: TDPChartQueryVariables }) {
  const { t } = useTranslation()
  const {
    chartType,
    timePeriod,
    setTimePeriod,
    setChartType,
    priceChartType,
    setPriceChartType,
    disableCandlestickUI,
  } = useTDPChartStateContext()
  const { address, currencyChainId } = useTDPStore((s) => ({
    address: s.address,
    currencyChainId: s.currencyChainId,
  }))
  const refitChartContent = useAtomValue(refitChartContentAtom)
  const media = useMedia()
  const isMediumScreen = media.lg
  const timeSelectorOptions = useMemo(() => getPillTimeSelectorOptions(t), [t])
  const showAdvancedPriceChartToggle = chartType === ChartType.PRICE
  const displayPriceChartType = getDisplayPriceChartType(priceChartType, disableCandlestickUI)
  const prefetchTimePeriod = usePrefetchTDPChartHistory({ variables, chartType, displayPriceChartType })

  return (
    <ChartActionsContainer>
      <Flex
        row
        gap="$gap8"
        $md={{
          width: '100%',
          gap: '$gap16',
          '$platform-web': {
            display: 'grid',
            gridTemplateColumns: '1fr',
          },
        }}
      >
        {showAdvancedPriceChartToggle && (
          <AdvancedPriceChartToggle
            currentChartType={displayPriceChartType}
            onChartTypeChange={setPriceChartType}
            disableCandlestickUI={disableCandlestickUI}
          />
        )}
        <Flex $md={{ width: '100%' }}>
          <ChartTypeToggle
            availableOptions={TOKEN_DETAILS_CHART_OPTIONS}
            currentChartType={chartType}
            onChartTypeChange={(c: ChartType) => {
              if (c !== chartType) {
                sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
                  page: InterfacePageName.TokenDetailsPage,
                  selection: 'chart_type',
                  chart_type: c,
                  time_period: timePeriod,
                  previous_value: chartType,
                  chain_id: currencyChainId,
                  token_address: address,
                })
              }
              setChartType(c as TokenDetailsChartType)
              if (c === ChartType.PRICE) {
                setPriceChartType(PriceChartType.LINE)
              }
            }}
          />
        </Flex>
      </Flex>
      <Flex $md={{ width: '100%' }}>
        <SegmentedControl
          fullWidth={isMediumScreen}
          options={timeSelectorOptions}
          selectedOption={timePeriod}
          onHoverOption={prefetchTimePeriod}
          onSelectOption={(option: TimePeriod) => {
            if (option === timePeriod) {
              refitChartContent?.()
            } else {
              sendAnalyticsEvent(InterfaceEventName.ChartSettingSelected, {
                page: InterfacePageName.TokenDetailsPage,
                selection: 'time_period',
                chart_type: chartType,
                time_period: option,
                previous_value: timePeriod,
                chain_id: currencyChainId,
                token_address: address,
              })
              setTimePeriod(option)
            }
          }}
        />
      </Flex>
    </ChartActionsContainer>
  )
}
