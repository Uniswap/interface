import { createColumnHelper } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { EllipsisText, HeaderCell, TableText } from 'components/Table/styled'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import useSimplePagination from 'hooks/useSimplePagination'
import { memo, ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TABLE_PAGE_SIZE } from 'state/explore'
import { useTopAuctions } from 'state/explore/topAuctions'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { Auction } from 'uniswap/src/data/rest/auctions/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

interface TopAuctionsTableValue {
  index: number
  tokenName: ReactElement
  link: string
}

function TokenNameCell({ auction }: { auction: Auction }) {
  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <EllipsisText>{auction.token_name}</EllipsisText>
      <TableText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {auction.token_symbol}
      </TableText>
    </Flex>
  )
}

export const ToucanTable = memo(function ToucanTable() {
  const { topAuctions, isLoading, isError } = useTopAuctions()

  const { page, loadMore } = useSimplePagination()

  return (
    <TableWrapper data-testid="toucan-explore-table">
      <ToucanTableComponent
        auctions={topAuctions.slice(0, page * TABLE_PAGE_SIZE)}
        loading={isLoading}
        loadMore={loadMore}
        error={isError}
      />
    </TableWrapper>
  )
})

function ToucanTableComponent({
  auctions,
  loading,
  error,
  loadMore,
}: {
  auctions?: readonly Auction[]
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
  const topAuctionsTableValues: TopAuctionsTableValue[] | undefined = useMemo(
    () =>
      auctions?.map((auction, i) => {
        const chainUrlParam = getChainInfo(auction.chain_id).urlParam
        return {
          index: i + 1,
          tokenName: <TokenNameCell auction={auction} />,
          link: `/explore/auctions/${chainUrlParam}/${auction.auction_id}`,
        }
      }) ?? [],
    [auctions],
  )

  const showLoadingSkeleton = loading || !!error

  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TopAuctionsTableValue>()
    const filteredColumns = [
      columnHelper.accessor((row) => row.tokenName, {
        id: 'tokenName',
        size: media.lg ? 150 : 300,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.tokenName')}
            </Text>
          </HeaderCell>
        ),
        cell: (auctionDescription) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
            <TableText>{auctionDescription.getValue()}</TableText>
          </Cell>
        ),
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [showLoadingSkeleton, media, t])

  return (
    <Table
      columns={columns}
      data={topAuctionsTableValues}
      loading={loading}
      error={error}
      v2={false}
      loadMore={loadMore}
      maxWidth={1200}
      defaultPinnedColumns={['index', 'auctionDescription']}
    />
  )
}
