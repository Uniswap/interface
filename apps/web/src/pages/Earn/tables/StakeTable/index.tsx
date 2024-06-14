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
import SingleTokenLogo from './SingleTokenLogo'

import { OrderDirection, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithReset, useAtomValue, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { StakeSortFields, TableStake, useStakes } from 'pages/Earn/data/useStakes'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HEADER_DESCRIPTIONS: Record<StakeSortFields, ReactNode | undefined> = {
  [StakeSortFields.TVL]: undefined,
  [StakeSortFields.APR]: <Trans>Return on 1 year</Trans>,
}

const TableWrapper = styled.div`
  margin: 0 auto;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

interface StakeTableValues {
  index: number
  stakeDescription: ReactElement
  rewardTokensList: ReactElement
  tvl: number
  apr: Percent
  link: string
}

export enum StakeTableColumns {
  Index,
  StakeDescription,
  RewardTokensList,
  TVL,
  APR,
  Actions,
}

function StakeDescription({ stakingToken, chainId }: { stakingToken: Token; chainId: ChainId }) {
  return (
    <Row gap="sm">
      <SingleTokenLogo chainId={chainId} token={stakingToken} size={28} />
      <NameText>{stakingToken.symbol} Stake</NameText>
    </Row>
  )
}

function RewardTokensList({ rewardTokens, chainId }: { rewardTokens: Token[]; chainId: ChainId }) {
  return (
    <Row gap="sm">
      <SingleTokenLogo chainId={chainId} token={rewardTokens[0]} size={28} />
      <NameText>{rewardTokens[0].symbol}</NameText>
    </Row>
  )
}

// Used to keep track of sorting state for Pool Tables
// declared as atomWithReset because sortMethodAtom and sortAscendingAtom are shared across multiple Pool Table instances - want to be able to reset sorting state between instances
export const sortMethodAtom = atomWithReset<StakeSortFields>(StakeSortFields.TVL)
export const sortAscendingAtom = atomWithReset<boolean>(false)

function useSetSortMethod(newSortMethod: StakeSortFields) {
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

const HEADER_TEXT: Record<StakeSortFields, ReactNode> = {
  [StakeSortFields.TVL]: <Trans>TVL</Trans>,
  [StakeSortFields.APR]: <Trans>APR</Trans>,
}

function PoolTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: StakeSortFields
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

export function StakeTable() {
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

  const { stakes, loading } = useStakes(
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
    <TableWrapper data-testid="stakes-earn-table">
      <StakesTable pools={stakes} loading={loading} error={undefined} chainId={chainId} maxWidth={1200} />
    </TableWrapper>
  )
}

export function StakesTable({
  pools,
  loading,
  error,
  loadMore,
  chainId,
  maxWidth,
  maxHeight,
  hiddenColumns,
}: {
  pools?: TableStake[]
  loading: boolean
  error?: ApolloError
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  chainId: ChainId
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: StakeTableColumns[]
}) {
  const { formatNumber, formatPercent } = useFormatter()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc
  const sortMethod = useAtomValue(sortMethodAtom)
  const filterString = useAtomValue(exploreSearchStringAtom)

  const poolTableValues: StakeTableValues[] | undefined = useMemo(
    () =>
      pools?.map((pool, index) => {
        const poolSortRank = index + 1

        return {
          index: poolSortRank,
          stakeDescription: <StakeDescription stakingToken={pool.stakingToken} chainId={chainId} />,
          rewardTokensList: <RewardTokensList rewardTokens={pool.rewardTokens} chainId={chainId} />,
          tvl: pool.tvl,
          apr: pool.apr,
          link: `/stake`,
          analytics: {
            elementName: InterfaceElementName.POOLS_TABLE_ROW,
            properties: {
              chain_id: chainId,
              pool_address: pool.hash,
              token_address: pool.stakingToken.address,
              token_symbol: pool.stakingToken.symbol,
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
    const columnHelper = createColumnHelper<StakeTableValues>()
    return [
      !hiddenColumns?.includes(StakeTableColumns.Index)
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
      !hiddenColumns?.includes(StakeTableColumns.StakeDescription)
        ? columnHelper.accessor((row) => row.stakeDescription, {
            id: 'stakeDescription',
            header: () => (
              <Cell justifyContent="flex-start" width={240} grow>
                <ThemedText.BodySecondary>
                  <Trans>Stake Program</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (stakeDescription) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
                {stakeDescription.getValue?.()}
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(StakeTableColumns.RewardTokensList)
        ? columnHelper.accessor((row) => row.rewardTokensList, {
            id: 'rewardTokensList',
            header: () => (
              <Cell justifyContent="flex-start" width={240} grow>
                <ThemedText.BodySecondary>
                  <Trans>Reward Token</Trans>
                </ThemedText.BodySecondary>
              </Cell>
            ),
            cell: (stakeDescription) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton} width={240} grow>
                {stakeDescription.getValue?.()}
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(StakeTableColumns.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            header: () => (
              <Cell minWidth={120} grow>
                <PoolTableHeader
                  category={StakeSortFields.TVL}
                  isCurrentSortMethod={sortMethod === StakeSortFields.TVL}
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
      !hiddenColumns?.includes(StakeTableColumns.APR)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            header: () => (
              <Cell minWidth={100} grow>
                <PoolTableHeader
                  category={StakeSortFields.APR}
                  isCurrentSortMethod={sortMethod === StakeSortFields.APR}
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
      !hiddenColumns?.includes(StakeTableColumns.Actions)
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
    ].filter(Boolean) as ColumnDef<StakeTableValues, any>[]
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
