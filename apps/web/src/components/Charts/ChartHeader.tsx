import { getProtocolColor, getProtocolName } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { useHeaderDateFormatter } from 'components/Charts/hooks/useHeaderDateFormatter'
import { PROTOCOL_LEGEND_ELEMENT_ID } from 'components/Charts/types'
import { UTCTimestamp } from 'lightweight-charts'
import { ReactElement, ReactNode } from 'react'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, styled, Text, useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'

type ChartHeaderProtocolInfo = { protocol: GraphQLApi.PriceSource; value?: number }

const ProtocolLegendWrapper = styled(Flex, {
  position: 'absolute',
  right: 0,
  py: '$spacing4',
  px: '$spacing12',
  gap: '$gap12',
  pointerEvents: 'none',
  variants: {
    hover: {
      true: {
        right: 'unset',
        p: '$spacing8',
        gap: '$gap6',
        borderRadius: '$rounded12',
        border: '1px solid',
        borderColor: '$surface3',
        backgroundColor: '$surface2',
        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 6px 2px rgba(0, 0, 0, 0.03)',
        zIndex: '$tooltip',
      },
    },
  },
})

function ProtocolLegend({ protocolData }: { protocolData?: ChartHeaderProtocolInfo[] }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <ProtocolLegendWrapper id={PROTOCOL_LEGEND_ELEMENT_ID} hover={true}>
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : null
          return (
            !!display && (
              <Flex row gap={8} justifyContent="flex-end" key={protocol + '_blip'} width="max-content">
                <Text variant="body4" textAlign="right" color="$neutral2" lineHeight={12}>
                  {getProtocolName(protocol)}
                </Text>

                <Flex borderRadius="$rounded4" width={12} height={12} backgroundColor={getProtocolColor(protocol)} />
                <Text variant="body4" textAlign="right" lineHeight={12} {...EllipsisTamaguiStyle}>
                  {display}
                </Text>
              </Flex>
            )
          )
        })
        .reverse()}
    </ProtocolLegendWrapper>
  )
}

interface HeaderValueDisplayProps {
  /** The number to be formatted and displayed, or the ReactElement to be displayed */
  value?: number | ReactElement
  /** Used to override default format NumberType (FiatTokenStats) */
  valueFormatterType?: FiatNumberType
}

function HeaderValueDisplay({ value, valueFormatterType = NumberType.FiatTokenStats }: HeaderValueDisplayProps) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (typeof value !== 'number' && typeof value !== 'undefined') {
    return <>{value}</>
  }

  return (
    <Text variant="heading2" {...EllipsisTamaguiStyle}>
      {convertFiatAmountFormatted(value, valueFormatterType)}
    </Text>
  )
}

interface HeaderTimeDisplayProps {
  time?: UTCTimestamp
  /** Optional string to display when time is undefined */
  timePlaceholder?: string
}

function HeaderTimeDisplay({ time, timePlaceholder }: HeaderTimeDisplayProps) {
  const headerDateFormatter = useHeaderDateFormatter()
  return (
    <Text variant="subheading2" display="flex" alignItems="center" color="neutral2">
      {time ? headerDateFormatter(time) : timePlaceholder}
    </Text>
  )
}

interface ChartHeaderProps extends HeaderValueDisplayProps, HeaderTimeDisplayProps {
  protocolData?: ChartHeaderProtocolInfo[]
  additionalFields?: ReactNode
}

export function ChartHeader({
  value,
  valueFormatterType,
  time,
  timePlaceholder,
  protocolData,
  additionalFields,
}: ChartHeaderProps) {
  const isHovered = !!time
  const colors = useSporeColors()
  return (
    <Flex
      row
      position="absolute"
      width="100%"
      gap="$gap8"
      alignItems="flex-start"
      animation="fast"
      zIndex="$mask"
      id="chart-header"
    >
      <Flex
        position="absolute"
        gap="$gap4"
        pb={14}
        pointerEvents="none"
        style={{
          background: `linear-gradient(to right, ${colors.surface1.val} 0%, ${colors.surface1.val} 70%, transparent 100%),
                      linear-gradient(to bottom, ${colors.surface1.val} 0%, ${colors.surface1.val} 70%, transparent 100%)`,
        }}
      >
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        <Flex row gap="$gap8" {...EllipsisTamaguiStyle}>
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Flex>
      </Flex>
      {isHovered && protocolData && <ProtocolLegend protocolData={protocolData} />}
    </Flex>
  )
}
