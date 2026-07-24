import { GraphQLApi } from '@universe/api'
import React from 'react'
import { Link } from 'react-router'
import { Flex, styled, Text, TouchableArea, useMedia } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderTitleVariant } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from '~/theme/components/styles'

const StyledLink = styled(Link, {
  color: '$neutral1',
  minWidth: 0,
  flexShrink: 1,
  ...ClickableTamaguiStyle,
  '$platform-web': {
    display: 'flex',
    textDecoration: 'none',
  },
})

export function PoolDetailsTitle({
  token0,
  token1,
  chainId,
  feeTier,
  protocolVersion,
  protocolFeePips,
  toggleReversed,
  hookAddress,
  isCompact,
}: {
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  chainId?: UniverseChainId
  feeTier?: FeeData
  protocolVersion?: GraphQLApi.ProtocolVersion
  protocolFeePips?: number
  toggleReversed: React.DispatchWithoutAction
  hookAddress?: string
  isCompact: boolean
}): JSX.Element {
  const media = useMedia()
  const { defaultChainId } = useEnabledChains()
  const graphQLChain = toGraphQLChain(chainId ?? defaultChainId)
  const titleVariant = getHeaderTitleVariant({ isCompact, media })
  return (
    <Flex row gap="$spacing12" alignItems="center" minWidth={0} shrink>
      <Flex row minWidth={0} shrink>
        <StyledLink
          to={getTokenDetailsURL({
            address: token0?.address,
            chain: graphQLChain,
          })}
        >
          <Text
            variant={titleVariant}
            transition={HEADER_TRANSITION}
            minWidth={0}
            flexShrink={1}
            {...EllipsisTamaguiStyle}
          >
            {token0?.symbol} /{' '}
          </Text>
        </StyledLink>
        <StyledLink
          to={getTokenDetailsURL({
            address: token1?.address,
            chain: graphQLChain,
          })}
        >
          <Text
            variant={titleVariant}
            transition={HEADER_TRANSITION}
            minWidth={0}
            flexShrink={1}
            {...EllipsisTamaguiStyle}
          >
            {token1?.symbol}
          </Text>
        </StyledLink>
      </Flex>
      <Flex row gap="$spacing2">
        <LiquidityPositionInfoBadges
          version={protocolVersion}
          v4hook={hookAddress}
          chainId={chainId}
          feeTier={feeTier}
          protocolFeePips={protocolFeePips}
          size="default"
        />
      </Flex>
      <TouchableArea
        hoverable
        {...ClickableTamaguiStyle}
        onPress={toggleReversed}
        testID="toggle-tokens-reverse-arrows"
      >
        <ArrowDownArrowUp size="$icon.20" color="$neutral2" />
      </TouchableArea>
    </Flex>
  )
}
