import { useEffect, useMemo, useState } from 'react'
import { ActivityEvent, ActivityEventResponse, ActivityEventType } from 'nft/types'
import { useInfiniteQuery } from 'react-query'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import styled from 'styled-components/macro'
import { shortenAddress } from 'nft/utils/address'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { EventCell } from '../collection/ActivityCells'
import { getTimeDifference, isValidDate } from 'nft/utils/date'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'

const TR = styled.tr`
  width: 100%;
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
`

const TD = styled.td`
  width: 20%;
  text-align: left;
`

const AssetActivity = ({ contractAddress, token_id }: { contractAddress: string; token_id: string }) => {
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
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          token_id,
        },
        pageParam
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

  const pages = eventsData?.pages
  const events = pages && pages.length ? pages[0].events : []

  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  console.log(events)

  return (
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
        const formattedPrice = useMemo(() => (price ? putCommas(formatEthPrice(price)).toString() : null), [price])

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
            <TD>{formattedPrice} ETH</TD>
            <TD>{shortenAddress(event.fromAddress)}</TD>
            <TD>{event.toAddress && shortenAddress(event.toAddress)}</TD>
            <TD> {event.eventTimestamp && getTimeDifference(event.eventTimestamp.toString())}</TD>
          </TR>
        )
      })}
    </Table>
  )
}

export default AssetActivity
