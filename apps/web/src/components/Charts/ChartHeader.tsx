import { useHeaderDateFormatter } from 'components/Charts/hooks'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { getProtocolColor, getProtocolName } from 'graphql/data/util'
import { UTCTimestamp } from 'lightweight-charts'
import React, { ReactElement, ReactNode } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components/text'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export type ChartHeaderProtocolInfo = { protocol: PriceSource; value?: number }

const ChartHeaderWrapper = styled(RowBetween)`
  ${textFadeIn};
  position: absolute;
  width: 100%;
  gap: 8px;
  align-items: flex-start;
`
const ChartHeaderLeftDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  text-align: left;
  pointer-events: none;
`
const ProtocolLegendWrapper = styled(Column)`
  padding: 4px 12px;
  gap: 12px;
  text-align: left;
  pointer-events: none;
`
const ProtocolBlip = styled.div<{ color: string }>`
  background-color: ${({ color }) => color};
  border-radius: 4px;
  width: 12px;
  height: 12px;
`

function ProtocolLegend({ protocolData }: { protocolData?: ChartHeaderProtocolInfo[] }) {
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()

  return (
    <ProtocolLegendWrapper>
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value
            ? formatFiatPrice({ price: value, type: NumberType.FiatTokenStatChartHeader })
            : getProtocolName(protocol)
          return (
            <Row gap="6px" justify="flex-end" key={protocol + '_blip'}>
              <ThemedText.Caption>{display}</ThemedText.Caption>
              <ProtocolBlip color={getProtocolColor(protocol, theme)} />
            </Row>
          )
        })
        .reverse()}
    </ProtocolLegendWrapper>
  )
}

interface HeaderValueDisplayProps {
  /** The number to be formatted and displayed, or the ReactElement to be displayed */
  value?: number | ReactElement
  /** Used to override default format NumberType (FiatTokenStatChartHeader) */
  valueFormatterType?: NumberType
}

function HeaderValueDisplay({
  value,
  valueFormatterType = NumberType.FiatTokenStatChartHeader,
}: HeaderValueDisplayProps) {
  const { formatFiatPrice } = useFormatter()

  if (typeof value !== 'number' && typeof value !== 'undefined') {
    return <>{value}</>
  }

  return (
    <ThemedText.HeadlineLarge>{formatFiatPrice({ price: value, type: valueFormatterType })}</ThemedText.HeadlineLarge>
  )
}

interface HeaderTimeDisplayProps {
  time?: UTCTimestamp
  /** Optional string to display when time is undefined */
  timePlaceholder?: string
}

function HeaderTimeDisplay({ time, timePlaceholder }: HeaderTimeDisplayProps) {
  const headerDateFormatter = useHeaderDateFormatter()
  return <ThemedText.Caption color="neutral2">{time ? headerDateFormatter(time) : timePlaceholder}</ThemedText.Caption>
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
    <ChartHeaderWrapper>
      <ChartHeaderLeftDisplay>
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        {additionalFields}
        <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
      </ChartHeaderLeftDisplay>
      <ProtocolLegend protocolData={protocolData} />
    </ChartHeaderWrapper>
  )
}
