import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SegmentedControl, useMedia } from 'ui/src'
import { TimePeriod } from '~/appGraphql/data/util'
import { refitChartContentAtom } from '~/components/Charts/ChartModel'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import { ChartTypeToggle } from '~/features/Explore/chart/ChartTypeToggle'
import { getPillTimeSelectorOptions } from '~/features/Explore/timeLabels'
import { AdvancedPriceChartToggle } from '~/pages/TokenDetails/components/chart/AdvancedPriceChartToggle'
import {
  getDisplayPriceChartType,
  type TokenDetailsChartType,
} from '~/pages/TokenDetails/components/chart/TDPChartState'
import { useTDPChartStateContext } from '~/pages/TokenDetails/components/chart/TDPChartStateContext'

const TOKEN_DETAILS_CHART_OPTIONS: TokenDetailsChartType[] = [ChartType.PRICE, ChartType.VOLUME, ChartType.TVL]

export function ChartControls() {
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
  const refitChartContent = useAtomValue(refitChartContentAtom)
  const media = useMedia()
  const isMediumScreen = media.lg
  const timeSelectorOptions = useMemo(() => getPillTimeSelectorOptions(t), [t])
  const showAdvancedPriceChartToggle = chartType === ChartType.PRICE
  const displayPriceChartType = getDisplayPriceChartType(priceChartType, disableCandlestickUI)

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
          onSelectOption={(option: TimePeriod) => {
            if (option === timePeriod) {
              refitChartContent?.()
            } else {
              setTimePeriod(option)
            }
          }}
        />
      </Flex>
    </ChartActionsContainer>
  )
}
