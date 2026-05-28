import { Flex, Text } from 'ui/src'

interface BidAmountWithPriceProps {
  amount: string
  symbol: string
  price: string
  variant?: 'body3' | 'body4'
}

export function BidAmountWithPrice({ amount, symbol, price, variant = 'body3' }: BidAmountWithPriceProps): JSX.Element {
  return (
    <Flex row gap="$spacing4" alignItems="center">
      <Text variant={variant} color="$neutral1">
        {`${amount} ${symbol}`}
      </Text>
      <Text variant={variant} color="$neutral2">
        @
      </Text>
      <Text variant={variant} color="$neutral1">
        {price}
      </Text>
    </Flex>
  )
}
