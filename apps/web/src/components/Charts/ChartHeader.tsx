import { GraphQLApi } from '@universe/api'
import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { UTCTimestamp } from 'lightweight-charts'
import { PointerEvent, ReactElement, ReactNode, useState } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { useHeaderDateFormatter } from '~/components/Charts/hooks/useHeaderDateFormatter'
import { PROTOCOL_LEGEND_ELEMENT_ID } from '~/components/Charts/types'
import { getProtocolColor, getProtocolName } from '~/data/util'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

type ChartHeaderProtocolInfo = { protocol: GraphQLApi.PriceSource; value?: number }

type ProtocolLegendWrapperProps = FlexCompatProps & {
  hover?: boolean
}

// borderWidth must be paired with borderColor (mycelium/Tailwind convention) —
// width alone with no color class renders a black ring, per checkbox-compat/compile.ts.
const HOVER_STYLES: FlexCompatProps = {
  right: 'unset',
  gap: '$spacing6',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  backgroundColor: '$surface1',
  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 6px 2px rgba(0, 0, 0, 0.03)',
  zIndex: '$tooltip',
}

function ProtocolLegendWrapper({ hover, ...rest }: ProtocolLegendWrapperProps): JSX.Element {
  return (
    <Flex
      position="absolute"
      right={0}
      // One padding granularity on both branches: the compat cascade resolves
      // longhands over shorthands, so a hover-side `p` could not beat base `px`/`py`.
      py={hover ? '$spacing8' : '$spacing4'}
      px={hover ? '$spacing8' : '$spacing12'}
      gap="$gap12"
      pointerEvents="none"
      {...(hover ? HOVER_STYLES : undefined)}
      {...rest}
    />
  )
}

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
  /** When true (crosshair hover), suppresses animation so rapid price updates don't trigger slots */
  isHovered?: boolean
}

function HeaderValueDisplay({
  value,
  valueFormatterType = NumberType.FiatTokenStats,
  isHovered,
}: HeaderValueDisplayProps) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (typeof value !== 'number' && typeof value !== 'undefined') {
    return <>{value}</>
  }

  return (
    <AnimatedNumber
      value={convertFiatAmountFormatted(value, valueFormatterType)}
      numericValue={isHovered ? undefined : value}
      disableAnimations={isHovered}
      textVariant="$heading2"
    />
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
    <Text variant="subheading2" display="flex" alignItems="center" color="$neutral2">
      {time ? headerDateFormatter(time) : timePlaceholder}
    </Text>
  )
}

interface ChartHeaderProps extends HeaderValueDisplayProps, HeaderTimeDisplayProps {
  protocolData?: ChartHeaderProtocolInfo[]
  additionalFields?: ReactNode
  /** Catches the pointer over the header, so content in it (e.g. a tooltip) can be hovered instead of scrubbing the chart. */
  blocksChartHover?: boolean
}

export function ChartHeader({
  value,
  valueFormatterType,
  time,
  timePlaceholder,
  protocolData,
  additionalFields,
  blocksChartHover = false,
}: ChartHeaderProps) {
  const isHovered = !!time
  const [heldSize, setHeldSize] = useState<{ width: number; height: number }>()

  function holdSize(event: PointerEvent<HTMLElement>): void {
    const { width, height } = event.currentTarget.getBoundingClientRect()
    setHeldSize({ width, height })
  }

  function releaseSize(): void {
    setHeldSize(undefined)
  }

  return (
    <Flex row position="absolute" width="100%" gap="$gap8" alignItems="flex-start" zIndex="$mask" id="chart-header">
      <Flex
        position="absolute"
        gap="$gap4"
        pb="$padding8"
        pr="$padding8"
        pointerEvents={blocksChartHover ? 'auto' : 'none'}
        // Catching the pointer mid-scrub clears the crosshair, swapping the date for the resting content. If that
        // shrank the header out from under the cursor, the chart would take the pointer back and loop, so hold the size.
        minWidth={heldSize?.width}
        minHeight={heldSize?.height}
        onPointerEnter={holdSize}
        onPointerLeave={releaseSize}
      >
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} isHovered={isHovered} />
        <Flex row gap="$gap8" $sm={{ flexDirection: 'column' }} {...EllipsisTamaguiStyle}>
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Flex>
      </Flex>
      {isHovered && protocolData && <ProtocolLegend protocolData={protocolData} />}
    </Flex>
  )
}
