import { useAtomValue } from 'jotai/utils'
import { Flex, SegmentedControl, useMedia } from 'ui/src'
import { refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { ChartActionsContainer } from '~/components/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle } from '~/components/Explore/chart/ChartTypeToggle'
import {
  DEFAULT_PILL_TIME_SELECTOR_OPTIONS,
  DISPLAYS,
  getTimePeriodFromDisplay,
  TimePeriodDisplay,
} from '~/components/Explore/constants'
import { AdvancedPriceChartToggle } from '~/pages/TokenDetails/components/chart/AdvancedPriceChartToggle'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

type TokenDetailsChartType = ChartType.PRICE | ChartType.VOLUME | ChartType.TVL
const TOKEN_DETAILS_CHART_OPTIONS: TokenDetailsChartType[] = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL]

export function ChartControls() {
  const {
    activeQuery,
    timePeriod,
    setTimePeriod,
    setChartType,
    priceChartType,
    setPriceChartType,
    disableCandlestickUI,
  } = useTDPContext().chartState
  const refitChartContent = useAtomValue(refitChartContentAtom)
  const media = useMedia()
  const isMediumScreen = media.lg
  const showAdvancedPriceChartToggle = activeQuery.chartType === ChartType.PRICE

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
            currentChartType={priceChartType}
            onChartTypeChange={setPriceChartType}
            disableCandlestickUI={disableCandlestickUI}
          />
        )}
        <Flex $md={{ width: '100%' }}>
          <ChartTypeToggle
            availableOptions={TOKEN_DETAILS_CHART_OPTIONS}
            currentChartType={activeQuery.chartType}
            onChartTypeChange={(c: ChartType) => {
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
          options={DEFAULT_PILL_TIME_SELECTOR_OPTIONS}
          selectedOption={DISPLAYS[timePeriod]}
          onSelectOption={(option) => {
            const time = getTimePeriodFromDisplay(option as TimePeriodDisplay)
            if (time === timePeriod) {
              refitChartContent?.()
            } else {
              setTimePeriod(time)
            }
          }}
        />
      </Flex>
    </ChartActionsContainer>
  )
}
