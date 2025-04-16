import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { InteractiveToken, TokenStandard } from 'pages/Landing/assets/approvedTokens'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import {
  useCollectionPromoQuery,
  useTokenPromoQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useFormatter } from 'utils/formatNumbers'

export function Ticker({ itemPoint }: { itemPoint: ItemPoint<InteractiveToken> }) {
  const { formatDelta } = useFormatter()

  const { color, size, floatingElementPosition, itemData } = itemPoint
  const { address, chain, standard, symbol } = itemData

  const tokenPromoQuery = useTokenPromoQuery({
    variables: {
      address: address !== NATIVE_CHAIN_ID ? address : undefined,
      chain,
    },
    skip: standard !== TokenStandard.ERC20,
  })
  const collectionPromoQuery = useCollectionPromoQuery({
    variables: {
      addresses: [address],
    },
    skip: standard !== TokenStandard.ERC721,
  })
  const pricePercentChange = useMemo(() => {
    const value =
      standard === TokenStandard.ERC20
        ? tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0
        : collectionPromoQuery.data?.nftCollections?.edges?.[0].node.markets?.[0].floorPricePercentChange?.value
    return value ?? 0
  }, [
    collectionPromoQuery.data?.nftCollections?.edges,
    tokenPromoQuery.data?.token?.market?.pricePercentChange?.value,
    standard,
  ])

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
        <Flex row alignItems="center">
          <DeltaArrow delta={pricePercentChange} />
          <Text variant="body2">{formatDelta(pricePercentChange)}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
