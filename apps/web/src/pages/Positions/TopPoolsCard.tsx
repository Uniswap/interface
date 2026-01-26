import { gqlToCurrency, supportedChainIdFromGQLChain, unwrapToken } from 'appGraphql/data/util'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { LPIncentiveRewardsBadge } from 'components/Liquidity/LPIncentives/LPIncentiveRewardsBadge'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { Trans } from 'react-i18next'
import { PoolStat } from 'state/explore/types'
import { Flex, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export function TopPoolsCard({ pool }: { pool: PoolStat }) {
  const { defaultChainId } = useEnabledChains()
  const { formatPercent } = useLocalizationContext()

  // Console pool 数据用于调试
  console.log('[TopPoolsCard] Pool 数据:', {
    id: pool.id,
    token0: pool.token0,
    token1: pool.token1,
    apr: pool.apr,
    aprType: typeof pool.apr,
    aprIsPercent: pool.apr instanceof Percent,
    aprHasToFixed: pool.apr && typeof (pool.apr as any).toFixed === 'function',
    totalLiquidity: pool.totalLiquidity,
    volume1Day: pool.volume1Day,
    protocolVersion: pool.protocolVersion,
    feeTier: pool.feeTier,
    boostedApr: pool.boostedApr,
  })

  const chainId = supportedChainIdFromGQLChain(pool.chain as GraphQLApi.Chain) ?? defaultChainId

  // 尝试使用 gqlToCurrency，如果失败则直接使用 pool 中的 symbol
  const token0 = pool.token0 ? gqlToCurrency(unwrapToken(chainId, pool.token0)) : undefined
  const token1 = pool.token1 ? gqlToCurrency(unwrapToken(chainId, pool.token1)) : undefined

  // 如果 gqlToCurrency 返回 undefined（比如数据来自 HSK subgraph），直接使用 pool 中的 symbol
  const token0Symbol = token0?.symbol || pool.token0?.symbol || '--'
  const token1Symbol = token1?.symbol || pool.token1?.symbol || '--'

  const formattedApr = pool.boostedApr ? formatPercent(pool.boostedApr) : null

  // 安全地格式化 APR：检查 pool.apr 是否是 Percent 对象，如果是则使用 toFixed，否则转换为数字
  const formatApr = (apr: Percent | any): string => {
    if (!apr) {
      return formatPercent(0)
    }
    // 检查是否有 toFixed 方法（Percent 对象应该有）
    if (typeof apr.toFixed === 'function') {
      return formatPercent(apr.toFixed(3))
    }
    // 如果没有 toFixed 方法，尝试从 numerator 和 denominator 计算
    // Percent 对象有 numerator 和 denominator 属性
    // 注意：protobuf 序列化后，numerator 和 denominator 可能是数组（JSBI 序列化）
    if ('numerator' in apr && 'denominator' in apr) {
      let numValue: number
      let denValue: number

      // 处理数组格式（protobuf 序列化后的 JSBI）
      if (Array.isArray(apr.numerator)) {
        // JSBI 序列化为数组，需要转换为数字
        // 空数组表示 0
        if (apr.numerator.length === 0) {
          numValue = 0
        } else {
          // JSBI 数组格式：[sign, ...digits]，sign 是 1 或 -1
          // 简化处理：如果是空数组或只有一个元素，直接使用
          numValue = apr.numerator.length > 0 ? Number(apr.numerator[0] || 0) : 0
        }
      } else {
        numValue = Number(apr.numerator) || 0
      }

      if (Array.isArray(apr.denominator)) {
        if (apr.denominator.length === 0) {
          denValue = 1
        } else {
          denValue = Number(apr.denominator[0] || 1)
        }
      } else {
        denValue = Number(apr.denominator) || 1
      }

      // 计算百分比：Percent 是 numerator/denominator，转换为百分比需要 * 100
      const percentValue = denValue > 0 ? (numValue / denValue) * 100 : 0
      return formatPercent(percentValue.toFixed(3))
    }
    // 最后的回退：尝试直接转换为数字
    return formatPercent(Number(apr) || 0)
  }

  return (
    <Flex
      row
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
      justifyContent="space-between"
      gap="$gap12"
      // 禁用点击功能
      // cursor="pointer"
      // hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
      // tag="a"
      // href={`/explore/pools/${toGraphQLChain(chainId).toLowerCase()}/${pool.id}`}
      $platform-web={{
        textDecoration: 'none',
      }}
    >
      <Flex row gap="$gap16">
        <DoubleCurrencyLogo currencies={[token0, token1]} size={44} />
        <Flex gap="$gap4">
          <Text variant="subheading2">
            {token0Symbol} / {token1Symbol}
          </Text>
          <Flex row gap="$spacing2" alignItems="center">
            <LiquidityPositionInfoBadges size="small" version={pool.protocolVersion} feeTier={pool.feeTier} />
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="flex-end" gap="$gap4">
        <Text variant="body2" color="$neutral2">
          {formatApr(pool.apr)} <Trans i18nKey="pool.apr" />
        </Text>
        {formattedApr && <LPIncentiveRewardsBadge formattedRewardApr={formattedApr} />}
      </Flex>
    </Flex>
  )
}
