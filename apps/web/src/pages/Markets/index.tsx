import { createColumnHelper } from '@tanstack/react-table'
import { ReactComponent as SearchIcon } from 'assets/svg/search.svg'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Flex, Input, Text, styled, useMedia } from 'ui/src'
import { NumberType, useFormatter } from 'utils/formatNumbers'

type MarketSortKey = 'supplyApy' | 'borrowApy' | 'liquidity' | 'lltv'
type VaultSortKey = 'apy' | 'tvl' | 'liquidity'
type SortDirection = 'asc' | 'desc'

import { useAccount } from 'hooks/useAccount'
import { computeBorrowAssets, computeSupplyAssets } from 'pages/Markets/data/morphoPricing'
import { useMorphoAllMarketPositions, useMorphoAllVaultPositions } from 'pages/Markets/data/morphoReads'
import { Eyebrow, Label } from 'pages/Markets/detailLayout'
import { useLendingMarketsBrowse, useLendingVaultsBrowse } from 'pages/Markets/hooks'
import {
  getLendingMarketDetailsURL,
  getLendingVaultDetailsURL,
  getMarketsBrowseURL,
  getVaultsBrowseURL,
} from 'pages/Markets/routes'
import type { LendingBrowseStat, LendingMarketBrowseEntity, LendingVaultBrowseEntity } from 'pages/Markets/types'
import { formatUnits } from 'viem'

interface MarketRow {
  id: string
  market: LendingMarketBrowseEntity
  link: string
  testId: string
}

interface VaultRow {
  id: string
  vault: LendingVaultBrowseEntity
  link: string
  testId: string
}

const SubtleSection = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  overflow: 'hidden',
})

const ModeToggle = styled(Flex, {
  row: true,
  p: '$spacing4',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$roundedFull',
  backgroundColor: '$surface2',
  gap: '$spacing6',
})

const ModeToggleItem = styled(Flex, {
  px: '$spacing16',
  py: '$spacing10',
  borderRadius: '$roundedFull',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$surface1',
      },
    },
  } as const,
})

const StatValue = styled(Text, {
  variant: 'subheading1',
  color: '$neutral1',
})

const StatBlock = styled(Flex, {
  gap: '$spacing4',
  flex: 1,
  minWidth: 180,
  p: '$spacing16',
  borderRightWidth: 1,
  borderRightColor: '$surface3',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const TableValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
})

const PositiveTableValue = styled(TableValue, {
  color: '$accent1',
})

const SortableHeader = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: { opacity: 0.7 },
})

function formatPercentValue(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`
}

function formatStatValue(
  stat: LendingBrowseStat,
  formatNumber: ReturnType<typeof useFormatter>['formatNumber'],
): string {
  if (stat.type === 'percent') {
    return formatPercentValue(stat.value, 2)
  }

  if (stat.type === 'fiat') {
    return formatNumber({ input: stat.value, type: NumberType.FiatTokenStats })
  }

  if (stat.type === 'token') {
    return `${formatNumber({ input: stat.value, type: NumberType.TokenQuantityStats })} ${stat.symbol ?? ''}`.trim()
  }

  return stat.value.toLocaleString()
}

function formatTokenOrUsd(
  value: number,
  symbol: string,
  formatNumber: ReturnType<typeof useFormatter>['formatNumber'],
  usd?: number,
): string {
  return usd !== undefined
    ? formatNumber({ input: usd, type: NumberType.FiatTokenStats })
    : `${formatNumber({ input: value, type: NumberType.TokenQuantityStats })} ${symbol}`
}

function MarketDescription({ market }: { market: LendingMarketBrowseEntity }) {
  return (
    <Flex row gap="$spacing10" alignItems="center" maxWidth="100%">
      <PortfolioLogo
        images={[market.loanAsset.logoUrl, market.collateralAsset.logoUrl]}
        symbols={[market.loanAsset.symbol, market.collateralAsset.symbol]}
        names={[market.loanAsset.name, market.collateralAsset.name]}
        chainId={market.chainId}
        size={20}
      />
      <Flex gap="$spacing2" maxWidth="100%">
        <Text variant="body3" color="$neutral1">
          {market.loanAsset.symbol} / {market.collateralAsset.symbol}
        </Text>
        <Flex row gap="$spacing8" flexWrap="wrap">
          <Label>{market.chainLabel}</Label>
          <Label>{formatPercentValue(market.lltv, 0)} LLTV</Label>
        </Flex>
      </Flex>
    </Flex>
  )
}

function VaultDescription({ vault }: { vault: LendingVaultBrowseEntity }) {
  return (
    <Flex row gap="$spacing10" alignItems="center" maxWidth="100%">
      <PortfolioLogo
        images={[vault.asset.logoUrl]}
        symbols={[vault.asset.symbol]}
        names={[vault.asset.name]}
        chainId={vault.chainId}
        size={20}
      />
      <Flex gap="$spacing2" maxWidth="100%">
        <Text variant="body3" color="$neutral1">
          {vault.title}
        </Text>
        <Flex row gap="$spacing8" flexWrap="wrap">
          <Label>{vault.chainLabel}</Label>
          <Label>{vault.asset.symbol}</Label>
        </Flex>
      </Flex>
    </Flex>
  )
}

const PositionCard = styled(Flex, {
  gap: '$spacing8',
  p: '$spacing16',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  cursor: 'pointer',
  hoverStyle: { backgroundColor: '$surface2' },
})

const PositionStatRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
})

function PositionsView({
  markets,
  vaults,
  marketPositions,
  vaultPositions,
  hasAnyPosition,
  formatNumber,
}: {
  markets: LendingMarketBrowseEntity[]
  vaults: LendingVaultBrowseEntity[]
  marketPositions: ReturnType<typeof useMorphoAllMarketPositions>
  vaultPositions: ReturnType<typeof useMorphoAllVaultPositions>
  hasAnyPosition: boolean
  formatNumber: ReturnType<typeof useFormatter>['formatNumber']
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const marketPositionMap = useMemo(() => new Map(marketPositions.map((p) => [p.entityId, p])), [marketPositions])
  const vaultPositionMap = useMemo(() => new Map(vaultPositions.map((p) => [p.entityId, p])), [vaultPositions])

  if (!hasAnyPosition) {
    return (
      <Flex alignItems="center" justifyContent="center" py="$spacing40">
        <Text variant="body2" color="$neutral3">
          {t('common.noPositions')}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing16" pt="$spacing12">
      {markets.length > 0 ? (
        <Flex gap="$spacing8">
          <Text variant="subheading2" color="$neutral2">
            {t('common.lending')}
          </Text>
          {markets.map((market) => {
            const pos = marketPositionMap.get(market.id)
            if (!pos) {
              return null
            }
            const suppliedAssets = computeSupplyAssets(pos)
            const borrowedAssets = computeBorrowAssets(pos)
            return (
              <PositionCard
                key={market.id}
                onPress={() => navigate(getLendingMarketDetailsURL(market.chainId, market.id))}
              >
                <MarketDescription market={market} />
                <PositionStatRow>
                  <Label>{t('common.collateral')}</Label>
                  <TableValue>
                    {formatNumber({
                      input: Number(formatUnits(pos.collateral, market.collateralAsset.decimals)),
                      type: NumberType.TokenNonTx,
                    })}{' '}
                    {market.collateralAsset.symbol}
                  </TableValue>
                </PositionStatRow>
                {suppliedAssets > 0n ? (
                  <PositionStatRow>
                    <Label>{t('common.supplied')}</Label>
                    <PositiveTableValue>
                      {formatNumber({
                        input: Number(formatUnits(suppliedAssets, market.loanAsset.decimals)),
                        type: NumberType.TokenNonTx,
                      })}{' '}
                      {market.loanAsset.symbol}
                    </PositiveTableValue>
                  </PositionStatRow>
                ) : null}
                {borrowedAssets > 0n ? (
                  <PositionStatRow>
                    <Label>{t('common.borrowed')}</Label>
                    <TableValue>
                      {formatNumber({
                        input: Number(formatUnits(borrowedAssets, market.loanAsset.decimals)),
                        type: NumberType.TokenNonTx,
                      })}{' '}
                      {market.loanAsset.symbol}
                    </TableValue>
                  </PositionStatRow>
                ) : null}
              </PositionCard>
            )
          })}
        </Flex>
      ) : null}
      {vaults.length > 0 ? (
        <Flex gap="$spacing8">
          <Text variant="subheading2" color="$neutral2">
            {t('common.vaults')}
          </Text>
          {vaults.map((vault) => {
            const pos = vaultPositionMap.get(vault.id)
            if (!pos) {
              return null
            }
            return (
              <PositionCard key={vault.id} onPress={() => navigate(getLendingVaultDetailsURL(vault.chainId, vault.id))}>
                <VaultDescription vault={vault} />
                <PositionStatRow>
                  <Label>{t('common.shares')}</Label>
                  <TableValue>
                    {formatNumber({
                      input: Number(formatUnits(pos.shares, vault.asset.decimals)),
                      type: NumberType.TokenNonTx,
                    })}
                  </TableValue>
                </PositionStatRow>
                <PositionStatRow>
                  <Label>{t('common.redeemable')}</Label>
                  <PositiveTableValue>
                    {formatNumber({
                      input: Number(formatUnits(pos.assets, vault.asset.decimals)),
                      type: NumberType.TokenNonTx,
                    })}{' '}
                    {vault.asset.symbol}
                  </PositiveTableValue>
                </PositionStatRow>
              </PositionCard>
            )
          })}
        </Flex>
      ) : null}
    </Flex>
  )
}

export default function MarketsPage() {
  const { t } = useTranslation()
  const media = useMedia()
  const location = useLocation()
  const navigate = useNavigate()
  const account = useAccount()
  const { formatNumber } = useFormatter()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(() => searchParams.get('q') ?? '')
  const [showPositions, setShowPositions] = useState(false)
  const viewMode = location.pathname === '/vaults' ? 'vaults' : 'markets'
  const marketState = useLendingMarketsBrowse(searchValue)
  const vaultState = useLendingVaultsBrowse(searchValue)
  const marketPositions = useMorphoAllMarketPositions()
  const vaultPositions = useMorphoAllVaultPositions()
  const [marketSort, setMarketSort] = useState<{ key: MarketSortKey; dir: SortDirection }>({
    key: 'liquidity',
    dir: 'desc',
  })
  const [vaultSort, setVaultSort] = useState<{ key: VaultSortKey; dir: SortDirection }>({
    key: 'tvl',
    dir: 'desc',
  })

  const toggleMarketSort = useCallback((key: MarketSortKey) => {
    setMarketSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }))
  }, [])

  const toggleVaultSort = useCallback((key: VaultSortKey) => {
    setVaultSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }))
  }, [])

  function sortArrow(active: boolean, dir: SortDirection): string {
    if (!active) {
      return '↕'
    }
    return dir === 'desc' ? '↓' : '↑'
  }

  useEffect(() => {
    const legacyView = searchParams.get('view')
    if (location.pathname === '/lending' && legacyView === 'vaults') {
      navigate(getVaultsBrowseURL(searchParams.get('q') ?? undefined), { replace: true })
    }
  }, [location.pathname, navigate, searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    const normalizedQuery = searchValue.trim()
    let changed = false

    if (nextParams.has('view')) {
      nextParams.delete('view')
      changed = true
    }

    if (normalizedQuery) {
      if (nextParams.get('q') != normalizedQuery) {
        nextParams.set('q', normalizedQuery)
        changed = true
      }
    } else if (nextParams.has('q')) {
      nextParams.delete('q')
      changed = true
    }

    if (changed) {
      setSearchParams(nextParams)
    }
  }, [searchParams, searchValue, setSearchParams])

  const marketRows: MarketRow[] = useMemo(() => {
    const rows = marketState.items.map((market) => ({
      id: market.id,
      market,
      link: getLendingMarketDetailsURL(market.chainId, market.id),
      testId: `market-row-${market.id}`,
    }))
    const accessor: Record<MarketSortKey, (m: LendingMarketBrowseEntity) => number> = {
      supplyApy: (m) => m.supplyApy,
      borrowApy: (m) => m.borrowApy,
      liquidity: (m) => m.liquidityUsd ?? m.liquidity,
      lltv: (m) => m.lltv,
    }
    const fn = accessor[marketSort.key]
    const multiplier = marketSort.dir === 'desc' ? -1 : 1
    return rows.sort((a, b) => multiplier * (fn(a.market) - fn(b.market)))
  }, [marketState.items, marketSort])

  const vaultRows: VaultRow[] = useMemo(() => {
    const rows = vaultState.items.map((vault) => ({
      id: vault.id,
      vault,
      link: getLendingVaultDetailsURL(vault.chainId, vault.id),
      testId: `vault-row-${vault.id}`,
    }))
    const accessor: Record<VaultSortKey, (v: LendingVaultBrowseEntity) => number> = {
      apy: (v) => v.apy,
      tvl: (v) => v.totalAssetsUsd ?? v.totalAssets,
      liquidity: (v) => v.idleAssetsUsd ?? v.idleAssets,
    }
    const fn = accessor[vaultSort.key]
    const multiplier = vaultSort.dir === 'desc' ? -1 : 1
    return rows.sort((a, b) => multiplier * (fn(a.vault) - fn(b.vault)))
  }, [vaultState.items, vaultSort])

  const marketColumns = useMemo(() => {
    const columnHelper = createColumnHelper<MarketRow>()

    return [
      columnHelper.accessor((row) => row.market, {
        id: 'market',
        size: 320,
        header: () => (
          <HeaderCell justifyContent="flex-start" py="$spacing8">
            <Eyebrow>{t('common.market.label')}</Eyebrow>
          </HeaderCell>
        ),
        cell: ({ row }) => (
          <Cell justifyContent="flex-start">
            <MarketDescription market={row.original.market} />
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.market.supplyApy, {
        id: 'supplyApy',
        size: 126,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleMarketSort('supplyApy')}>
            <SortableHeader>
              <Eyebrow>{t('common.supplyApy')}</Eyebrow>
              <Eyebrow>{sortArrow(marketSort.key === 'supplyApy', marketSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: (value) => (
          <Cell>
            <PositiveTableValue>{formatPercentValue(value.getValue(), 2)}</PositiveTableValue>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.market.borrowApy, {
        id: 'borrowApy',
        size: 126,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleMarketSort('borrowApy')}>
            <SortableHeader>
              <Eyebrow>{t('common.borrowApy')}</Eyebrow>
              <Eyebrow>{sortArrow(marketSort.key === 'borrowApy', marketSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: (value) => (
          <Cell>
            <TableValue>{formatPercentValue(value.getValue(), 2)}</TableValue>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.market.liquidityUsd ?? row.market.liquidity, {
        id: 'liquidity',
        size: 136,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleMarketSort('liquidity')}>
            <SortableHeader>
              <Eyebrow>{t('common.liquidity')}</Eyebrow>
              <Eyebrow>{sortArrow(marketSort.key === 'liquidity', marketSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: ({ row }) => (
          <Cell>
            <TableValue>
              {formatTokenOrUsd(
                row.original.market.liquidity,
                row.original.market.loanAsset.symbol,
                formatNumber,
                row.original.market.liquidityUsd,
              )}
            </TableValue>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.market.lltv, {
        id: 'lltv',
        size: 92,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleMarketSort('lltv')}>
            <SortableHeader>
              <Eyebrow>LLTV</Eyebrow>
              <Eyebrow>{sortArrow(marketSort.key === 'lltv', marketSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: (value) => (
          <Cell>
            <TableValue>{formatPercentValue(value.getValue(), 0)}</TableValue>
          </Cell>
        ),
      }),
    ]
  }, [formatNumber, marketSort, t, toggleMarketSort])

  const vaultColumns = useMemo(() => {
    const columnHelper = createColumnHelper<VaultRow>()

    return [
      columnHelper.accessor((row) => row.vault, {
        id: 'vault',
        size: 320,
        header: () => (
          <HeaderCell justifyContent="flex-start" py="$spacing8">
            <Eyebrow>{t('common.vault')}</Eyebrow>
          </HeaderCell>
        ),
        cell: ({ row }) => (
          <Cell justifyContent="flex-start">
            <VaultDescription vault={row.original.vault} />
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.vault.apy, {
        id: 'apy',
        size: 126,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleVaultSort('apy')}>
            <SortableHeader>
              <Eyebrow>{t('common.netApy')}</Eyebrow>
              <Eyebrow>{sortArrow(vaultSort.key === 'apy', vaultSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: (value) => (
          <Cell>
            <PositiveTableValue>{formatPercentValue(value.getValue(), 2)}</PositiveTableValue>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.vault.totalAssetsUsd ?? row.vault.totalAssets, {
        id: 'tvl',
        size: 136,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleVaultSort('tvl')}>
            <SortableHeader>
              <Eyebrow>{t('common.totalAssets')}</Eyebrow>
              <Eyebrow>{sortArrow(vaultSort.key === 'tvl', vaultSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: ({ row }) => (
          <Cell>
            <TableValue>
              {formatTokenOrUsd(
                row.original.vault.totalAssets,
                row.original.vault.asset.symbol,
                formatNumber,
                row.original.vault.totalAssetsUsd,
              )}
            </TableValue>
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.vault.idleAssetsUsd ?? row.vault.idleAssets, {
        id: 'liquidity',
        size: 136,
        header: () => (
          <HeaderCell py="$spacing8" onPress={() => toggleVaultSort('liquidity')}>
            <SortableHeader>
              <Eyebrow>{t('common.idleAssets')}</Eyebrow>
              <Eyebrow>{sortArrow(vaultSort.key === 'liquidity', vaultSort.dir)}</Eyebrow>
            </SortableHeader>
          </HeaderCell>
        ),
        cell: ({ row }) => (
          <Cell>
            <TableValue>
              {formatTokenOrUsd(
                row.original.vault.idleAssets,
                row.original.vault.asset.symbol,
                formatNumber,
                row.original.vault.idleAssetsUsd,
              )}
            </TableValue>
          </Cell>
        ),
      }),
    ]
  }, [formatNumber, t, toggleVaultSort, vaultSort])

  const setViewMode = (nextView: 'markets' | 'vaults') => {
    setShowPositions(false)
    navigate(nextView === 'markets' ? getMarketsBrowseURL(searchValue) : getVaultsBrowseURL(searchValue))
  }

  const positionMarketIds = useMemo(() => new Set(marketPositions.map((p) => p.entityId)), [marketPositions])
  const positionVaultIds = useMemo(() => new Set(vaultPositions.map((p) => p.entityId)), [vaultPositions])
  const positionMarketRows = useMemo(
    () => marketState.items.filter((m) => positionMarketIds.has(m.id)),
    [marketState.items, positionMarketIds],
  )
  const positionVaultRows = useMemo(
    () => vaultState.items.filter((v) => positionVaultIds.has(v.id)),
    [vaultState.items, positionVaultIds],
  )
  const hasAnyPosition = marketPositions.length > 0 || vaultPositions.length > 0

  return (
    <Flex width="100%" px="$spacing32" pt="$spacing20" pb="$spacing40" $md={{ px: '$spacing16', pb: '$spacing24' }}>
      <Flex width="100%" gap="$spacing16">
        <Flex row justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$spacing12">
          <Flex gap="$spacing4">
            <Text variant="heading1">
              {showPositions
                ? t('common.myPositions')
                : viewMode === 'markets'
                  ? t('common.lending')
                  : t('common.vaults')}
            </Text>
            <Label>
              {showPositions
                ? t('common.myPositions.description')
                : viewMode === 'markets'
                  ? t('common.lendingMarkets.description')
                  : t('common.vaults.description')}
            </Label>
          </Flex>
          <ModeToggle>
            <ModeToggleItem active={!showPositions && viewMode === 'markets'} onPress={() => setViewMode('markets')}>
              <Text variant="buttonLabel3" color={!showPositions && viewMode === 'markets' ? '$neutral1' : '$neutral3'}>
                {t('common.lending')}
              </Text>
            </ModeToggleItem>
            <ModeToggleItem active={!showPositions && viewMode === 'vaults'} onPress={() => setViewMode('vaults')}>
              <Text variant="buttonLabel3" color={!showPositions && viewMode === 'vaults' ? '$neutral1' : '$neutral3'}>
                {t('common.vaults')}
              </Text>
            </ModeToggleItem>
            {account.isConnected ? (
              <ModeToggleItem active={showPositions} onPress={() => setShowPositions(true)}>
                <Text variant="buttonLabel3" color={showPositions ? '$neutral1' : '$neutral3'}>
                  {t('common.myPositions')}
                </Text>
              </ModeToggleItem>
            ) : null}
          </ModeToggle>
        </Flex>

        {!showPositions ? (
          <SubtleSection>
            {(viewMode === 'markets' ? marketState.stats : vaultState.stats).map((stat, index) => (
              <StatBlock key={`${viewMode}-${stat.label}-${index}`}>
                <Eyebrow>{stat.label}</Eyebrow>
                <StatValue color={stat.type === 'percent' ? '$accent1' : undefined}>
                  {formatStatValue(stat, formatNumber)}
                </StatValue>
              </StatBlock>
            ))}
          </SubtleSection>
        ) : null}

        {!showPositions ? (
          <Flex row justifyContent="flex-end">
            <Flex position="relative" width={media.md ? '100%' : 360}>
              <SearchIcon
                width={18}
                height={18}
                style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }}
              />
              <Input
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={viewMode === 'markets' ? t('common.searchLendingMarkets') : t('common.searchVaults')}
                placeholderTextColor="$neutral3"
                backgroundColor="$surface2"
                borderColor="$surface3"
                borderWidth={1}
                borderRadius={12}
                pl={36}
                height={40}
              />
            </Flex>
          </Flex>
        ) : null}

        <Flex width="100%" mt={-12}>
          {showPositions ? (
            <PositionsView
              markets={positionMarketRows}
              vaults={positionVaultRows}
              marketPositions={marketPositions}
              vaultPositions={vaultPositions}
              hasAnyPosition={hasAnyPosition}
              formatNumber={formatNumber}
            />
          ) : viewMode === 'markets' ? (
            <Table columns={marketColumns} data={marketRows} />
          ) : (
            <Table columns={vaultColumns} data={vaultRows} />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
