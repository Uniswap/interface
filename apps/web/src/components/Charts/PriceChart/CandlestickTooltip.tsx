import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'

function CandlestickTooltipRow(props: FlexCompatProps): JSX.Element {
  return <Flex row justifyContent="space-between" gap="$spacing8" {...props} />
}

// Every leaf carries its own Text, so the container needs no typography of its own — and a Flex column
// keeps the rows' block-level divs out of an inline span, which a Text wrapper would not.
export function CandlestickTooltip({ data }: { data: PriceChartData }) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <Flex>
      <CandlestickTooltipRow>
        <Text variant="body3" color="$neutral1">
          {t('chart.price.label.open')}
        </Text>
        <Text variant="body3" color="$neutral1">
          {convertFiatAmountFormatted(data.open, NumberType.FiatTokenPrice)}
        </Text>
      </CandlestickTooltipRow>
      <CandlestickTooltipRow>
        <Text variant="body3" color="$neutral1">
          {t('chart.price.label.high')}
        </Text>
        <Text variant="body3" color="$neutral1">
          {convertFiatAmountFormatted(data.high, NumberType.FiatTokenPrice)}
        </Text>
      </CandlestickTooltipRow>
      <CandlestickTooltipRow>
        <Text variant="body3" color="$neutral1">
          {t('chart.price.label.low')}
        </Text>
        <Text variant="body3" color="$neutral1">
          {convertFiatAmountFormatted(data.low, NumberType.FiatTokenPrice)}
        </Text>
      </CandlestickTooltipRow>
      <CandlestickTooltipRow>
        <Text variant="body3" color="$neutral1">
          {t('chart.price.label.close')}
        </Text>
        <Text variant="body3" color="$neutral1">
          {convertFiatAmountFormatted(data.close, NumberType.FiatTokenPrice)}
        </Text>
      </CandlestickTooltipRow>
    </Flex>
  )
}
