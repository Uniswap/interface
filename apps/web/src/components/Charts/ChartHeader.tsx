import { useHeaderDateFormatter } from 'components/Charts/hooks'
import { PROTOCOL_LEGEND_ELEMENT_ID } from 'components/Charts/types'
import { getProtocolColor, getProtocolName } from 'graphql/data/util'
import { useTheme } from 'lib/styled-components'
import { UTCTimestamp } from 'lightweight-charts'
import { ReactElement, ReactNode } from 'react'
import { EllipsisTamaguiStyle } from 'theme/components'
import { ThemedText } from 'theme/components/text'
import { Flex, Text, styled } from 'ui/src'
import { PriceSource } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export type ChartHeaderProtocolInfo = { protocol: PriceSource; value?: number }

const ProtocolLegendWrapper = styled(Flex, {
  position: 'absolute',
  right: 0,
  py: '$spacing4',
  px: '$spacing12',
  gap: '$gap12',
  pointerEvents: 'none',
  variants: {
    isMultichainExploreEnabled: {
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
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)

  return (
    <ProtocolLegendWrapper
      id={isMultichainExploreEnabled ? PROTOCOL_LEGEND_ELEMENT_ID : undefined}
      isMultichainExploreEnabled={isMultichainExploreEnabled}
    >
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value
            ? formatFiatPrice({ price: value, type: NumberType.ChartFiatValue })
            : isMultichainExploreEnabled
              ? null
              : getProtocolName(protocol)
          return (
            !!display && (
              <Flex
                row
                gap={isMultichainExploreEnabled ? 8 : 6}
                justifyContent="flex-end"
                key={protocol + '_blip'}
                width={isMultichainExploreEnabled ? 'max-content' : undefined}
              >
                {isMultichainExploreEnabled ? (
                  <Text variant="body4" textAlign="right" color="$neutral2" lineHeight={12}>
                    {getProtocolName(protocol)}
                  </Text>
                ) : (
                  <Text variant="body4" width={80} textAlign="right" lineHeight={12} {...EllipsisTamaguiStyle}>
                    {display}
                  </Text>
                )}
                <Flex
                  borderRadius="$rounded4"
                  width={12}
                  height={12}
                  backgroundColor={getProtocolColor(protocol, theme)}
                />
                {isMultichainExploreEnabled && (
                  <Text variant="body4" textAlign="right" lineHeight={12} {...EllipsisTamaguiStyle}>
                    {display}
                  </Text>
                )}
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
  const isHovered = !!time
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)
  return (
    <Flex
      row
      position="absolute"
      width="100%"
      gap="$gap8"
      alignItems="flex-start"
      animation="fast"
      zIndex="$tooltip"
      id="chart-header"
    >
      <Flex position="absolute" gap="$gap4" pb={14} pointerEvents="none" width="70%">
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        <Flex row gap="$gap8" {...EllipsisTamaguiStyle}>
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Flex>
      </Flex>
      {((isHovered && protocolData) || !isMultichainExploreEnabled) && <ProtocolLegend protocolData={protocolData} />}
    </Flex>
  )
}
