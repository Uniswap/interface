import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { Flex, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { HEADER_LOGO_SIZE, HEADER_TRANSITION } from '~/components/Explore/stickyHeader/constants'
import { getHeaderLogoSize } from '~/components/Explore/stickyHeader/getHeaderLogoSize'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'

export function AnimatedDoubleLogo({
  token0,
  token1,
  isCompact,
}: {
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  isCompact: boolean
}): JSX.Element {
  const media = useMedia()
  const logoSize = getHeaderLogoSize({ isCompact, isMobile: media.md })
  const currencies = useMemo(
    () => (token0 && token1 ? [gqlToCurrency(token0), gqlToCurrency(token1)] : []),
    [token0, token1],
  )

  const expandedSize = HEADER_LOGO_SIZE.expanded
  return (
    <Flex height={logoSize} width={logoSize} transition={HEADER_TRANSITION}>
      <Flex
        height={expandedSize}
        width={expandedSize}
        style={{
          transform: `scale(${logoSize / expandedSize})`,
          transformOrigin: '0 0',
          transition: HEADER_TRANSITION,
        }}
      >
        <DoubleCurrencyLogo currencies={currencies} data-testid={TestID.PoolDetailsDoubleLogo} size={expandedSize} />
      </Flex>
    </Flex>
  )
}
