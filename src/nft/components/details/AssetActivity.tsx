import { useEffect, useReducer, useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { ActivityEvent, ActivityEventResponse, ActivityEventType } from 'nft/types'
import { Box } from 'nft/components/Box'
import { useInfiniteQuery } from 'react-query'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import styled from 'styled-components/macro'
import { shortenAddress } from 'nft/utils/address'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { EventCell } from '../collection/ActivityCells'
import { getTimeDifference, isValidDate } from 'nft/utils/date'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { MarketplaceIcon } from '../collection/ActivityCells'
import { marketplace } from './AssetDetails.css'
import { reduceFilters } from '../collection/Activity'
import * as styles from 'nft/components/collection/Activity.css'

const TR = styled.tr`
  width: 100%;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  &:nth-child(1) {
    border-bottom: none;
  }
`

const TH = styled.th`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  width: 20%;
`

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`

const TD = styled.td`
  width: 20%;
  text-align: left;
  padding-top: 16px;
  padding-bottom: 16px;
`

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const initialFilterState = {
  [ActivityEventType.Listing]: true,
  [ActivityEventType.Sale]: true,
  [ActivityEventType.Transfer]: true,
  [ActivityEventType.CancelListing]: true,
}

const AssetActivity = ({ contractAddress, token_id }: { contractAddress: string; token_id: string }) => {
  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)
  const {
    data: eventsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
    isLoading,
  } = useInfiniteQuery<ActivityEventResponse>(
    [
      'collectionActivity',
      {
        contractAddress,
        activeFilters,
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          token_id,
          eventTypes: Object.keys(activeFilters)
            .filter((key) => activeFilters[key as ActivityEventType])
            .map((key) => key as ActivityEventType),
        },
        pageParam,
        '10'
      )
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.events?.length === 25 ? lastPage.cursor : undefined
      },
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  console.log(
    Object.keys(activeFilters)
      .filter((key) => activeFilters[key as ActivityEventType])
      .map((key) => key as ActivityEventType)
  )

  const pages = eventsData?.pages
  const events = pages && pages.length ? pages[0].events : []

  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <Box
          className={clsx(styles.filter, isActive && styles.activeFilter)}
          onClick={() => filtersDispatch({ eventType })}
          style={{ maxWidth: 150, height: 40, boxSizing: 'border-box' }}
        >
          {eventType === ActivityEventType.CancelListing
            ? 'Cancellation'
            : eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </Box>
      )
    },
    [activeFilters]
  )

  console.log(events)

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: 34 }}>
        <Filter eventType={ActivityEventType.Listing} />
        <Filter eventType={ActivityEventType.Sale} />
        <Filter eventType={ActivityEventType.Transfer} />
        <Filter eventType={ActivityEventType.CancelListing} />
      </div>

      <Table>
        <TR>
          <TH>Event</TH>
          <TH>Price</TH>
          <TH>By</TH>
          <TH>To</TH>
          <TH>Time</TH>
        </TR>
        {events.map((event, index) => {
          const price = event.price
          const formattedPrice = price ? putCommas(formatEthPrice(price)).toString() : null
          const marketplace = event.marketplace

          return (
            <TR key={index}>
              <TD>
                <EventCell
                  eventType={event.eventType}
                  eventTimestamp={event.eventTimestamp}
                  eventTransactionHash={event.transactionHash}
                  eventOnly
                />
              </TD>
              <TD>
                {formattedPrice && (
                  <PriceContainer>
                    {marketplace && <MarketplaceIcon marketplace={marketplace} />}
                    {formattedPrice} ETH
                  </PriceContainer>
                )}
              </TD>
              <TD>{shortenAddress(event.fromAddress)}</TD>
              <TD>{event.toAddress && shortenAddress(event.toAddress)}</TD>
              <TD>{event.eventTimestamp && getTimeDifference(event.eventTimestamp.toString())}</TD>
            </TR>
          )
        })}
      </Table>
    </div>
  )
}

export default AssetActivity
