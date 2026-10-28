import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { type ParsedToken, v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { LoadingBubble } from '~/components/Tokens/loading'
import type { PoolData } from '~/data/pools/poolData'
import { get24hLpFeesUsd } from '~/data/pools/poolStats'
import { getTokenDetailsURL } from '~/data/util'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
import { StatCell } from '~/features/Liquidity/PoolInfoCard/PoolInfoCard'
import { getChainUrlParam } from '~/utils/params/chainParams'

const COLUMNS = 3
const COMPACT_COLUMNS = 2

// `transition-opacity`, not `all`: `all` animates theme tokens and flashes on a light/dark toggle.
const TokenLink = styled(Link, {
  platform: 'web',
  base: 'flex flex-row items-center gap-3 min-w-0 cursor-pointer no-underline transition-opacity duration-100 hover:opacity-80 active:opacity-60',
})

/** Lays cells out in fixed columns divided by a left rule, padding the last row so columns stay aligned. */
function DividedGrid({ cells }: { cells: ReactNode[] }): JSX.Element {
  const media = useMedia()
  const columns = media.md ? COMPACT_COLUMNS : COLUMNS
  const rows: ReactNode[][] = []
  for (let i = 0; i < cells.length; i += columns) {
    const row = cells.slice(i, i + columns)
    rows.push([...row, ...Array.from({ length: columns - row.length }, () => null)])
  }

  return (
    <Flex gap="$spacing20" width="100%">
      {rows.map((row, rowIndex) => (
        <Flex key={rowIndex} row gap="$spacing12" width="100%">
          {row.map((cell, cellIndex) => (
            <Flex
              key={cellIndex}
              flex={1}
              flexBasis={0}
              minWidth={0}
              justifyContent="center"
              {...(cellIndex > 0 && { pl: '$spacing16' })}
              {...(cellIndex > 0 &&
                cell !== null && { borderLeftWidth: 1, borderLeftColor: '$surface3', borderStyle: 'solid' })}
            >
              {cell}
            </Flex>
          ))}
        </Flex>
      ))}
    </Flex>
  )
}

function LoadingCell(): JSX.Element {
  return (
    <Flex gap="$gap8">
      <LoadingBubble width={80} height={20} />
      <LoadingBubble width={140} height={29} />
    </Flex>
  )
}

/** The PDP revamp's pool stats: a flat, divided grid of TVL, volume, APR and fees. */
export function PdpPoolStats({
  poolData,
  loading,
  rewards = [],
}: {
  poolData?: PoolData
  loading?: boolean
  /** The pool's live per-token boosts, as served. */
  rewards?: PositionRewardApr[]
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()

  if (loading || !poolData) {
    return (
      <DividedGrid
        cells={Array.from({ length: 4 }, (_, i) => (
          <LoadingCell key={i} />
        ))}
      />
    )
  }

  // 0 here is served data, not missing (unknown stats never render) — avoid FiatTokenStats' '-' placeholder
  const formatFiat = (value: number) =>
    formatNumberOrString({ value, type: value === 0 ? NumberType.FiatTokenPrice : NumberType.FiatTokenStats })

  const fees24h = get24hLpFeesUsd(poolData)

  const cells: ReactNode[] = []
  if (poolData.tvlUSD) {
    cells.push(
      <StatCell
        key="tvl"
        size="large"
        label={t('common.totalValueLocked')}
        value={formatFiat(poolData.tvlUSD)}
        delta={poolData.tvlUSDChange}
      />,
    )
  }
  if (poolData.volumeUSD24H !== undefined) {
    cells.push(
      <StatCell
        key="volume"
        size="large"
        label={t('stats.24volume')}
        value={formatFiat(poolData.volumeUSD24H)}
        delta={poolData.volumeUSD24HChange}
      />,
    )
  }
  // `total_apr` already sums the fee APR with every reward boost; the badge names the boosts it includes.
  if (poolData.apr !== undefined) {
    cells.push(
      <StatCell
        key="apr"
        size="large"
        label={t('pool.apr')}
        value={
          <Flex row alignItems="center" gap="$gap8">
            {formatPercent(poolData.totalApr, 2)}
            {rewards.length > 0 && <RewardAprBadge rewards={rewards} hideBackground label="symbol" />}
          </Flex>
        }
      />,
    )
  }
  if (fees24h !== undefined) {
    cells.push(<StatCell key="fees" size="large" label={t('stats.24fees')} value={formatFiat(fees24h)} />)
  }

  return <DividedGrid cells={cells} />
}

function TokenCell({ token, chainId }: { token: ParsedToken; chainId: UniverseChainId }): JSX.Element {
  const currencyInfo = useCurrencyInfo(currencyId(v2TokenToCurrency(token)))

  return (
    <TokenLink
      to={getTokenDetailsURL({ address: token.address, chainUrlParam: getChainUrlParam(chainId) })}
      data-testid={`pdp-token-logo-${token.symbol}`}
    >
      <CurrencyLogo currencyInfo={currencyInfo} size={40} />
      <Flex gap="$spacing2" minWidth={0}>
        <Text variant="body1" color="$neutral1" numberOfLines={1}>
          {token.name}
        </Text>
        <Text variant="body2" color="$neutral2" numberOfLines={1}>
          {token.symbol}
        </Text>
      </Flex>
    </TokenLink>
  )
}

/** The PDP revamp's token row: each of the pool's tokens, linking to its token page. */
export function PdpPoolTokens({
  tokens,
  chainId,
  loading,
}: {
  tokens: [ParsedToken | undefined, ParsedToken | undefined]
  chainId: UniverseChainId
  loading?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap12" width="100%">
      <Text variant="body2" color="$neutral2">
        {t('common.token.plural')}
      </Text>
      <DividedGrid
        cells={tokens.map((token, i) =>
          loading || !token ? (
            <LoadingBubble key={i} width={160} height={40} />
          ) : (
            <TokenCell key={i} token={token} chainId={chainId} />
          ),
        )}
      />
    </Flex>
  )
}
