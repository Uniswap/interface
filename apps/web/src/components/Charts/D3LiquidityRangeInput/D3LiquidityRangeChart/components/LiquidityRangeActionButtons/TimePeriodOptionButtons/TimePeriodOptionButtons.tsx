import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useLiquidityChartStoreActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedControl, SegmentedControlOption, Text } from 'ui/src'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function TimePeriodOptionButtons() {
  const { t } = useTranslation()
  const { selectedHistoryDuration } = useChartPriceState()
  const { setTimePeriod } = useLiquidityChartStoreActions()
  const timePeriodOptions = useMemo(() => {
    const options: Array<SegmentedControlOption<HistoryDuration>> = [
      [
        HistoryDuration.Day,
        t('token.priceExplorer.timeRangeLabel.day'),
        t('token.priceExplorer.timeRangeLabel.day.verbose'),
      ],
      [
        HistoryDuration.Week,
        t('token.priceExplorer.timeRangeLabel.week'),
        t('token.priceExplorer.timeRangeLabel.week.verbose'),
      ],
      [
        HistoryDuration.Month,
        t('token.priceExplorer.timeRangeLabel.month'),
        t('token.priceExplorer.timeRangeLabel.month.verbose'),
      ],
      [
        HistoryDuration.Year,
        t('token.priceExplorer.timeRangeLabel.year'),
        t('token.priceExplorer.timeRangeLabel.year.verbose'),
      ],
      [HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as HistoryDuration,
      display:
        timePeriod[0] === selectedHistoryDuration ? (
          <Text variant="buttonLabel4">{timePeriod[1]}</Text>
        ) : (
          <Text variant="buttonLabel4" color="$neutral2">
            {timePeriod[1]}
          </Text>
        ),
    }))
    return {
      options,
      selected: selectedHistoryDuration,
    }
  }, [selectedHistoryDuration, t])

  return (
    <SegmentedControl
      options={timePeriodOptions.options}
      selectedOption={timePeriodOptions.selected}
      onSelectOption={(option: HistoryDuration) => {
        setTimePeriod(option)
      }}
    />
  )
}
