import { createColumnHelper, type Row } from '@tanstack/react-table'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import {
  MARGIN_ACTIVE_POSITION_STATUSES,
  type MarginActivePosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { hasRow } from '~/components/Table/utils/hasRow'
import { MARGIN_CHAIN_ID, MARGIN_POSITIONS_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { type MarginMarketResolver, useResolveMarginMarket } from '~/features/margin/hooks/useResolveMarginMarket'
import { formatLeverage, getMarginDirectionStyle, scaledE18ToNumber } from '~/features/margin/utils/marginFormat'
import { marginAmountLabel, resolveMarketForPosition } from '~/features/margin/utils/marginPositionDisplay'
import { marginCurrentLeverage, marginPositionTokens } from '~/features/margin/utils/marginPositionRow'
import { marginFallbackPairLabel, marginPairLabel, marginPairLegs } from '~/features/margin/utils/marginTokenDisplay'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from '~/pages/Portfolio/constants'
import { MAX_MARGIN_ROWS, MINI_TABLE_MOBILE_BLEED_PX } from '~/pages/Portfolio/Overview/constants'
import { TableSectionHeader } from '~/pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from '~/pages/Portfolio/Overview/ViewAllButton'

const MARGIN_PATH = '/margin'
const PAIR_LOGO_SIZE = 32

function openedAtSeconds(position: MarginActivePosition): number {
  const value = Number(position.openedAt)
  return Number.isFinite(value) ? value : 0
}

function PairInfo({
  market,
  fallbackTokens,
  currencyInfos,
  subtitle,
}: {
  market: MarginMarket | undefined
  fallbackTokens: { collateralToken: string; debtToken: string }
  currencyInfos: Map<string, CurrencyInfo>
  subtitle: JSX.Element
}): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap8" minWidth={0}>
      {market ? (
        <SplitLogo
          orientation="stacked"
          size={PAIR_LOGO_SIZE}
          chainId={MARGIN_CHAIN_ID}
          inputCurrencyInfo={null}
          outputCurrencyInfo={null}
          {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
        />
      ) : null}
      <Flex minWidth={0}>
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {market ? marginPairLabel({ market }) : marginFallbackPairLabel({ ...fallbackTokens, currencyInfos })}
        </Text>
        {subtitle}
      </Flex>
    </Flex>
  )
}

function DirectionLabel({ direction, leverage }: { direction: MarginDirection; leverage?: number }): JSX.Element {
  const { t } = useTranslation()
  const label = direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  return (
    <Text variant="body4" color={getMarginDirectionStyle(direction).color}>
      {leverage === undefined ? label : `${label} ${formatLeverage(leverage)}`}
    </Text>
  )
}

const PositionInfoCell = memo(function PositionInfoCell({
  position,
  resolveMarket,
  currencyInfos,
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
}): JSX.Element {
  return (
    <PairInfo
      market={resolveMarketForPosition({ position, resolveMarket })}
      fallbackTokens={marginPositionTokens(position)}
      currencyInfos={currencyInfos}
      subtitle={<DirectionLabel direction={position.direction} leverage={marginCurrentLeverage(position)} />}
    />
  )
})

const PositionPnlCell = memo(function PositionPnlCell({
  position,
  resolveMarket,
  currencyInfos,
}: {
  position: MarginActivePosition
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const pnl = Number(position.unrealizedPnl)
  if (position.unrealizedPnl === undefined || position.unrealizedPnl.trim() === '' || !Number.isFinite(pnl)) {
    return (
      <Text variant="body3" color="$neutral2">
        —
      </Text>
    )
  }
  const color = pnl >= 0 ? '$statusSuccess' : '$statusCritical'
  const roe = position.roe === undefined ? undefined : scaledE18ToNumber(position.roe) * 100
  return (
    <Flex alignItems="flex-end">
      <Text variant="body3" color={color}>
        {marginAmountLabel({
          raw: position.unrealizedPnl,
          leg: 'collateral',
          position,
          market: resolveMarketForPosition({ position, resolveMarket }),
          currencyInfos,
          formatNumberOrString,
          signed: true,
        })}
      </Text>
      {roe === undefined || !Number.isFinite(roe) ? null : (
        <Text variant="body4" color={color}>
          {`${pnl >= 0 ? '▲' : '▼'} ${Math.abs(roe).toFixed(2)}%`}
        </Text>
      )}
    </Flex>
  )
})

export const PortfolioMarginSection = memo(function PortfolioMarginSection({
  account,
  isReadOnly,
}: {
  account: string
  isReadOnly: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading } = useMarginPositionsQuery({
    params: { swapper: account, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_ACTIVE_POSITION_STATUSES },
    refetchInterval: MARGIN_POSITIONS_REFETCH_MS,
  })
  const currencyInfos = useMarginCurrencyInfos()
  const resolveMarket = useResolveMarginMarket({ positions: data?.positions })

  const activePositions = useMemo(
    () => (data?.positions ?? []).filter((position): position is MarginActivePosition => position.status === 'ACTIVE'),
    [data?.positions],
  )
  const rows = useMemo(
    () => [...activePositions].sort((a, b) => openedAtSeconds(b) - openedAtSeconds(a)).slice(0, MAX_MARGIN_ROWS),
    [activePositions],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<MarginActivePosition>()
    return [
      columnHelper.display({
        id: 'pair',
        minSize: 200,
        cell: (info) => (
          <Cell justifyContent="flex-start" pl="$none">
            {hasRow<MarginActivePosition>(info) && (
              <PositionInfoCell
                position={info.row.original}
                resolveMarket={resolveMarket}
                currencyInfos={currencyInfos}
              />
            )}
          </Cell>
        ),
      }),
      columnHelper.display({
        id: 'pnl',
        cell: (info) => (
          <Cell justifyContent="flex-end" pr="$none">
            {hasRow<MarginActivePosition>(info) && (
              <PositionPnlCell
                position={info.row.original}
                resolveMarket={resolveMarket}
                currencyInfos={currencyInfos}
              />
            )}
          </Cell>
        ),
      }),
    ]
  }, [currencyInfos, resolveMarket])

  const goToMargin = useCallback(() => navigate(MARGIN_PATH), [navigate])
  const rowWrapper = useCallback(
    (_row: Row<MarginActivePosition>, content: JSX.Element) =>
      isReadOnly ? (
        content
      ) : (
        <TouchableArea onPress={goToMargin} cursor="pointer" testID={TestID.PortfolioOverviewMarginPositionRow}>
          {content}
        </TouchableArea>
      ),
    [goToMargin, isReadOnly],
  )

  if (isLoading || rows.length === 0) {
    return null
  }

  return (
    <TableSectionHeader
      title={t('portfolio.margin.title')}
      subtitle={t('portfolio.margin.openPositions', { count: activePositions.length })}
      contentGap="$spacing2"
      testId={TestID.PortfolioOverviewMarginSection}
    >
      <Flex $md={{ mx: -MINI_TABLE_MOBILE_BLEED_PX }}>
        <Table
          mobileFullBleed
          hideHeader
          columns={columns}
          data={rows}
          loading={false}
          error={false}
          rowWrapper={rowWrapper}
          rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
        />
      </Flex>
      {isReadOnly ? null : (
        <Flex pt="$spacing12">
          <ViewAllButton
            href={MARGIN_PATH}
            label={t('common.viewAll')}
            elementName={ElementName.PortfolioViewAllMargin}
            testId={TestID.PortfolioOverviewViewAllMargin}
          />
        </Flex>
      )}
    </TableSectionHeader>
  )
})
