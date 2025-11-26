import { GraphQLApi } from '@universe/api'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { InteractiveToken } from 'pages/Landing/assets/approvedTokens'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export function Ticker({ itemPoint }: { itemPoint: ItemPoint<InteractiveToken> }) {
  const { formatPercent } = useLocalizationContext()

  const { color, size, floatingElementPosition, itemData } = itemPoint
  const { address, chain, symbol } = itemData

  const tokenPromoQuery = GraphQLApi.useTokenPromoQuery({
    variables: {
      address: address !== NATIVE_CHAIN_ID ? address : undefined,
      chain,
    },
  })

  const pricePercentChange = useMemo(() => {
    return tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0
  }, [tokenPromoQuery.data?.token?.market?.pricePercentChange?.value])

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
          <DeltaArrow delta={pricePercentChange} formattedDelta={formatPercent(Math.abs(pricePercentChange))} />
          <Text variant="body2">{formatPercent(Math.abs(pricePercentChange))}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
