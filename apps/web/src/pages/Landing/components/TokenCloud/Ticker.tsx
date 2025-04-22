import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { TickerPosition } from 'pages/Landing/components/TokenCloud'
import { Flex, Text } from 'ui/src'
import { useFormatter } from 'utils/formatNumbers'

export function Ticker({
  color,
  pricePercentChange,
  ticker,
  tickerPosition,
  size,
}: {
  color: string
  pricePercentChange: number
  ticker: string
  tickerPosition: TickerPosition
  size: number
}) {
  const { formatDelta } = useFormatter()

  return (
    <Flex
      position="absolute"
      flex={1}
      row
      animation="100ms"
      opacity={0}
      x={0}
      gap={20}
      $group-item-hover={{
        opacity: 1,
        x: 8,
      }}
      {...(tickerPosition === 'right' ? { left: size * 1.25 } : { right: size * 0.6 })}
    >
      <Flex justifyContent="center">
        <Text
          fontSize={14}
          fontWeight="$medium"
          color={color}
          textAlign={tickerPosition === 'right' ? 'left' : 'right'}
        >
          {ticker}
        </Text>
        <Flex row alignItems="center">
          <DeltaArrow delta={pricePercentChange} />
          <Text variant="body2">{formatDelta(pricePercentChange)}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
