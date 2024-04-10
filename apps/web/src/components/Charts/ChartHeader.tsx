import { useHeaderDateFormatter } from 'components/Charts/hooks'
import Column from 'components/Column'
import Row from 'components/Row'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { getProtocolColor, getProtocolName } from 'graphql/data/util'
import { UTCTimestamp } from 'lightweight-charts'
import { ReactElement, ReactNode } from 'react'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle } from 'theme/components'
import { ThemedText } from 'theme/components/text'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export type ChartHeaderProtocolInfo = { protocol: PriceSource; value?: number }

const ChartHeaderWrapper = styled(Row)`
  ${textFadeIn};
  position: absolute;
  width: 100%;
  gap: 8px;
  align-items: flex-start;
`
const ChartHeaderLeftDisplay = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  text-align: left;
  pointer-events: none;
  width: 70%;

  * {
    ${EllipsisStyle}
  }
`
const ProtocolLegendWrapper = styled(Column)`
  position: absolute;
  right: 0px;
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

const ProtocolText = styled(ThemedText.Caption)`
  width: 80px;
  text-align: right;
  ${EllipsisStyle}
`

function ProtocolLegend({ protocolData }: { protocolData?: ChartHeaderProtocolInfo[] }) {
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()

  return (
    <ProtocolLegendWrapper>
      {protocolData
        ?.map(({ value, protocol }) => {
          const display = value
            ? formatFiatPrice({ price: value, type: NumberType.ChartFiatValue })
            : getProtocolName(protocol)
          return (
            <Row gap="6px" justify="flex-end" key={protocol + '_blip'}>
              <ProtocolText>{display}</ProtocolText>
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
  /** Used to override default format NumberType (ChartFiatValue) */
  valueFormatterType?: NumberType
}

function HeaderValueDisplay({ value, valueFormatterType = NumberType.ChartFiatValue }: HeaderValueDisplayProps) {
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
    <ChartHeaderWrapper data-cy="chart-header">
      <ChartHeaderLeftDisplay>
        <HeaderValueDisplay value={value} valueFormatterType={valueFormatterType} />
        <Row gap="sm">
          {additionalFields}
          <HeaderTimeDisplay time={time} timePlaceholder={timePlaceholder} />
        </Row>
      </ChartHeaderLeftDisplay>
      <ProtocolLegend protocolData={protocolData} />
    </ChartHeaderWrapper>
  )
}
