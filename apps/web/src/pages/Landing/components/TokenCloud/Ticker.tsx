import { InteractiveToken } from 'pages/Landing/assets/approvedTokens'
import { Flex, Text } from 'ui/src'
import { ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'

export function Ticker({ itemPoint }: { itemPoint: ItemPoint<InteractiveToken> }) {
  const { color, size, floatingElementPosition, itemData } = itemPoint
  const { symbol } = itemData

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
      </Flex>
    </Flex>
  )
}
