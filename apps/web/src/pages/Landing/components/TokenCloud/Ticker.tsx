import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { InteractiveToken } from '~/pages/Landing/assets/approvedTokens'

interface TickerProps {
  itemPoint: ItemPoint<InteractiveToken>
  pricePercentChange: number
}

export function Ticker({ itemPoint, pricePercentChange }: TickerProps): JSX.Element {
  const { formatPercent } = useLocalizationContext()

  const { color, size, floatingElementPosition, itemData } = itemPoint
  const { symbol } = itemData

  const absChangeFormatted = useMemo(
    () => formatPercent(Math.abs(pricePercentChange)),
    [formatPercent, pricePercentChange],
  )
  return (
    <Flex
      position="absolute"
      flex={1}
      row
      opacity={0}
      x={0}
      transition="all 0.1s ease-in-out"
      gap={20}
      $group-item-hover={{
        opacity: 1,
        x: 8,
      }}
      {...(floatingElementPosition === 'right' ? { left: size * 1.25 } : { right: size * 0.6 })}
    >
      <Flex justifyContent="center">
        <Text
          fontSize={14}
          fontWeight="$medium"
          color={color}
          textAlign={floatingElementPosition === 'right' ? 'left' : 'right'}
        >
          {symbol}
        </Text>
        <Flex row alignItems="center">
          <DeltaArrow delta={pricePercentChange} formattedDelta={absChangeFormatted} />
          <Text variant="body2">{absChangeFormatted}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
