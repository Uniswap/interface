import { gqlToCurrency, supportedChainIdFromGQLChain, unwrapToken } from 'appGraphql/data/util'
import { LPIncentiveRewardsBadge } from 'components/Liquidity/LPIncentiveRewardsBadge'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PoolStat } from 'state/explore/types'
import { Flex, Text } from 'ui/src'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export function TopPoolsCard({ pool }: { pool: PoolStat }) {
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()
  const { formatPercent } = useLocalizationContext()

  const chainId = supportedChainIdFromGQLChain(pool.chain as Chain) ?? defaultChainId
  const token0 = pool.token0 ? gqlToCurrency(unwrapToken(chainId, pool.token0)) : undefined
  const token1 = pool.token1 ? gqlToCurrency(unwrapToken(chainId, pool.token1)) : undefined

  const formattedApr = pool.boostedApr ? formatPercent(pool.boostedApr) : null

  return (
    <Flex
      row
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
      justifyContent="space-between"
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
      onPress={() => navigate(`/explore/pools/${toGraphQLChain(chainId ?? defaultChainId).toLowerCase()}/${pool.id}`)}
    >
      <Flex row gap="$gap16">
        <DoubleCurrencyLogo currencies={[token0, token1]} size={44} />
        <Flex gap="$gap4">
          <Text variant="subheading2">
            {token0?.symbol} / {token1?.symbol}
          </Text>
          <Flex row gap="$spacing2" alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              versionLabel={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier}
            />
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="flex-end" gap="$gap4">
        <Text variant="body2" color="$neutral2">
          {formatPercent(pool.apr.toFixed(3))} <Trans i18nKey="pool.apr" />
        </Text>
        {formattedApr && <LPIncentiveRewardsBadge formattedRewardApr={formattedApr} />}
      </Flex>
    </Flex>
  )
}
