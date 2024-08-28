import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { getProtocolColor, getProtocolName } from 'graphql/data/util'
import { useTheme } from 'lib/styled-components'
import { UTCTimestamp } from 'lightweight-charts'
import { ReactElement, ReactNode } from 'react'
import { EllipsisTamaguiStyle } from 'theme/components'
import { ThemedText } from 'theme/components/text'
import { Flex, Text } from 'ui/src'
import { PriceSource } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export type ChartHeaderProtocolInfo = { protocol: PriceSource; value?: number }

function ProtocolLegend({ protocolData }: { protocolData?: ChartHeaderProtocolInfo[] }) {
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()

  return (
    <Flex position="absolute" gap="$gap12" py="$spacing4" px="$spacing12" right={0} pointerEvents="none">
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value
            ? formatFiatPrice({ price: value, type: NumberType.ChartFiatValue })
            : getProtocolName(protocol)
          return (
            <Flex row gap={6} justifyContent="flex-end" key={protocol + '_blip'}>
              <Text variant="body4" width={80} textAlign="right" {...EllipsisTamaguiStyle}>
                {display}
              </Text>
              <Flex
                borderRadius="$rounded4"
                width={12}
                height={12}
                backgroundColor={getProtocolColor(protocol, theme)}
              />
            </Flex>
          )
        })
        .reverse()}
    </Flex>
  )
}

interface HeaderValueDisplayProps {
  /** The number to be formatted and displayed, or the ReactElement to be displayed */
  value?: number | ReactElement
  /** Used to override default format NumberType (ChartFiatValue) */
  valueFormatterType?: NumberType
}

function HeaderValueDisplay({ value, valueFormatterType = NumberType.ChartFiatValue }: HeaderValueDisplayProps) {
  const { formatFiatPrice } = useFormatter()

  if (typeof value !== 'number' && typeof value !== 'undefined') {
    return <>{value}</>
  }

  return (
    <Text variant="heading2" {...EllipsisTamaguiStyle}>
      {formatFiatPrice({ price: value, type: valueFormatterType })}
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
    <ThemedText.SubHeader color="neutral2">{time ? headerDateFormatter(time) : timePlaceholder}</ThemedText.SubHeader>
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
  return (
    <Flex row position="absolute" width="100%" gap="$gap8" alignItems="flex-start" animation="fast" id="chart-header">
      <Flex position="absolute" gap="$gap4" pb={14} pointerEvents="none" width="70%">
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        <Flex row gap="$gap8" {...EllipsisTamaguiStyle}>
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Flex>
      </Flex>
      <ProtocolLegend protocolData={protocolData} />
    </Flex>
  )
}
