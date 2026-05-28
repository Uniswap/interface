import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { PriceChartData } from '~/components/Charts/PriceChart'

const CandlestickTooltipRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  gap: '$sm',
})

export function CandlestickTooltip({ data }: { data: PriceChartData }) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <>
      <Text variant="body3" color="$neutral1">
        <CandlestickTooltipRow>
          {t('chart.price.label.open')}
          <Flex>{convertFiatAmountFormatted(data.open, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          {t('chart.price.label.high')}
          <Flex>{convertFiatAmountFormatted(data.high, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          {t('chart.price.label.low')}
          <Flex>{convertFiatAmountFormatted(data.low, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
        <CandlestickTooltipRow>
          {t('chart.price.label.close')}
          <Flex>{convertFiatAmountFormatted(data.close, NumberType.FiatTokenPrice)}</Flex>
        </CandlestickTooltipRow>
      </Text>
    </>
  )
}
