import { ApolloError } from '@apollo/client'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { InterfaceElementName } from '@ubeswap/analytics-events'
import { ChainId, Percent, Token } from '@ubeswap/sdk-core'
import Row from 'components/Row'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from 'components/Table/styled'
import { NameText } from 'components/Tokens/TokenTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { BIPS_BASE } from 'constants/misc'
import DoubleTokenLogo from './DoubleTokenLogo'

import { OrderDirection, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { FarmSortFields, TableFarm, useActiveFarms, useInactiveFarms } from 'pages/Earn/data/useFarms'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HEADER_DESCRIPTIONS: Record<FarmSortFields, ReactNode | undefined> = {
  [FarmSortFields.TVL]: undefined,
  [FarmSortFields.APR]: <Trans>Return on 1 year</Trans>,
}

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

const Badge = styled(ThemedText.LabelMicro)`
  padding: 2px 6px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 5px;
`

interface FarmTableValues {
  index: number
  farmDescription: ReactElement
  tvl: number
  apr: Percent
  protocolVersion: ProtocolVersion
  link: string
}

export enum FarmTableColumns {
  Index,
  FarmDescription,
  ProtocolVersion,
  TVL,
  APR,
  Actions,
}

function PoolDescription({
  token0,
  token1,
  feeTier,
  chainId,
  protocolVersion = ProtocolVersion.V3,
}: {
  token0: Token
  token1: Token
  feeTier: number
  chainId: ChainId
  protocolVersion: ProtocolVersion
}) {
  const tokens = [token0, token1]
  return (
    <Row gap="sm">
      <DoubleTokenLogo chainId={chainId} tokens={tokens} size={28} />
      <NameText>
        {token0.symbol}/{token1.symbol}
      </NameText>
      {protocolVersion === ProtocolVersion.V2 && <Badge>{protocolVersion.toLowerCase()}</Badge>}
      <Badge>{feeTier / BIPS_BASE}%</Badge>
    </Row>
  )
}

// Used to keep track of sorting state for Pool Tables
// declared as atomWithReset because sortMethodAtom and sortAscendingAtom are shared across multiple Pool Table instances - want to be able to reset sorting state between instances
export const sortMethodAtom = atomWithReset<FarmSortFields>(FarmSortFields.APR)
export const sortAscendingAtom = atomWithReset<boolean>(false)

function useSetSortMethod(newSortMethod: FarmSortFields) {
  const [sortMethod, setSortMethod] = useAtom(sortMethodAtom)
  const setSortAscending = useUpdateAtom(sortAscendingAtom)

  return useCallback(() => {
    if (sortMethod === newSortMethod) {
      setSortAscending((sortAscending) => !sortAscending)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  }, [sortMethod, setSortMethod, setSortAscending, newSortMethod])
}

const HEADER_TEXT: Record<FarmSortFields, ReactNode> = {
  [FarmSortFields.TVL]: <Trans>TVL</Trans>,
  [FarmSortFields.APR]: <Trans>APR</Trans>,
}

function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: FarmSortFields
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const handleSortCategory = useSetSortMethod(category)
  return (
    <MouseoverTooltip disabled={!HEADER_DESCRIPTIONS[category]} text={HEADER_DESCRIPTIONS[category]} placement="top">
      <ClickableHeaderRow $justify="flex-end" onClick={handleSortCategory}>
        {isCurrentSortMethod && <HeaderArrow direction={direction} />}
        <HeaderSortText $active={isCurrentSortMethod}>{HEADER_TEXT[category]}</HeaderSortText>
      </ClickableHeaderRow>
    </MouseoverTooltip>
  )
}

export function ActiveFarmTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const { farms, loading } = useActiveFarms(
    { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chainId
  )
  // const combinedError =
  //   errorV2 && errorV3
  //     ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Top Pools on chain: ${chainId}` })
  //     : undefined
  // const allDataStillLoading = loading && !topPools.length
  // useUpdateManualOutage({ chainId, errorV3, errorV2 })

  return (
    <TableWrapper data-testid="inactive-farms-earn-table">
      <FarmsTable pools={farms} loading={loading} error={undefined} chainId={chainId} maxWidth={1200} />
    </TableWrapper>
  )
}

export function InactiveFarmTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const { farms, loading } = useInactiveFarms(
    { sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc },
    chainId
  )
  // const combinedError =
  //   errorV2 && errorV3
  //     ? new ApolloError({ errorMessage: `Could not retrieve V2 and V3 Top Pools on chain: ${chainId}` })
  //     : undefined
  // const allDataStillLoading = loading && !topPools.length
  // useUpdateManualOutage({ chainId, errorV3, errorV2 })

  return (
    <TableWrapper data-testid="inactive-farms-earn-table">
      <FarmsTable pools={farms} loading={loading} error={undefined} chainId={chainId} maxWidth={1200} />
    </TableWrapper>
  )
}

export function FarmsTable({
  pools,
  loading,
  error,
  loadMore,
  chainId,
  maxWidth,
  maxHeight,
  hiddenColumns,
}: {
  pools?: TableFarm[]
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: FarmTableColumns[]
}) {
  const { formatNumber, formatPercent } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)

  const poolTableValues: FarmTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1
        const link =
          pool.protocolVersion == ProtocolVersion.V3
            ? `/farmv3/${pool.poolAddress}`
            : `/farm/${pool.token0.address}/${pool.token1.address}/${pool.farmAddress}`

        return {
          index: poolSortRank,
          farmDescription: (
            <PoolDescription
              token0={pool.token0}
              token1={pool.token1}
              feeTier={pool.feeTier}
              chainId={chainId}
              protocolVersion={pool.protocolVersion}
            />
          ),
          tvl: pool.tvl,
          apr: pool.apr,
          protocolVersion: pool.protocolVersion,
          link,
          analytics: {
            elementName: InterfaceElementName.POOLS_TABLE_ROW,
            properties: {
              chain_id: chainId,
              pool_address: pool.hash,
              token0_address: pool.token0.address,
              token0_symbol: pool.token0.symbol,
              token1_address: pool.token1.address,
              token1_symbol: pool.token1.symbol,
              pool_list_index: index,
              pool_list_rank: poolSortRank,
              pool_list_length: pools.length,
              search_pool_input: filterString,
            },
          },
        }
      }) ?? [],
    [chainId, filterString, pools]
  )

  const showLoadingSkeleton = loading || !!error
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<FarmTableValues>()
    return [
      !hiddenColumns?.includes(FarmTableColumns.Index)
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            header: () => (
              <Cell justifyContent="center" minWidth={44}>
                <ThemedText.BodySecondary>#</ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (index) => (
              <Cell justifyContent="center" loading={showLoadingSkeleton} minWidth={44}>
                <ThemedText.BodySecondary>{index.getValue?.()}</ThemedText.BodySecondary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(FarmTableColumns.FarmDescription)
        ? columnHelper.accessor((row) => row.farmDescription, {
            id: 'farmDescription',
            header: () => (
              <Cell justifyContent="flex-start" width={240} grow>
                <ThemedText.BodySecondary>
                  <Trans>Farm</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (farmDescription) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
                {farmDescription.getValue?.()}
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(FarmTableColumns.ProtocolVersion)
        ? columnHelper.accessor((row) => row.protocolVersion, {
            id: 'protocolVersion',
            header: () => (
              <Cell minWidth={60} grow>
                <ThemedText.BodySecondary>
                  <Trans>Version</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (protocolVersion) => (
              <Cell loading={showLoadingSkeleton} minWidth={60} grow>
                <ThemedText.BodyPrimary>{protocolVersion.getValue?.()}</ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(FarmTableColumns.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={FarmSortFields.TVL}
                  isCurrentSortMethod={sortMethod === FarmSortFields.TVL}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (tvl) => (
              <Cell loading={showLoadingSkeleton} minWidth={120} grow>
                <ThemedText.BodyPrimary>
                  {formatNumber({ input: tvl.getValue?.(), type: NumberType.FiatTokenStats })}
                </ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(FarmTableColumns.APR)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={FarmSortFields.APR}
                  isCurrentSortMethod={sortMethod === FarmSortFields.APR}
                  direction={orderDirection}
                />
              </Cell>
            ),
            cell: (apr) => (
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
                <ThemedText.BodyPrimary>{formatPercent(apr.getValue?.())}</ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(FarmTableColumns.Actions)
        ? columnHelper.accessor((row) => row, {
            id: 'actions',
            header: () => <Cell minWidth={100} />,
            cell: () => (
              <Cell minWidth={100} loading={showLoadingSkeleton} grow>
                <ThemedText.BodyPrimary>Manage</ThemedText.BodyPrimary>
              </Cell>
            ),
          })
        : null,
      // Filter out null values
    ].filter(Boolean) as ColumnDef<FarmTableValues, any>[]
  }, [formatNumber, formatPercent, hiddenColumns, orderDirection, showLoadingSkeleton, sortMethod])

  return (
    <Table
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={error}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
    />
  )
}
