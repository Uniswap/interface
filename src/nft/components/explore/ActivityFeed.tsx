import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ActivityFetcher } from 'nft/queries'
import { ActivityEvent, ActivityEventTypeDisplay, Markets } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { getTimeDifference, isValidDate } from 'nft/utils/date'
import { putCommas } from 'nft/utils/putCommas'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'

import * as styles from './Explore.css'

const ActivityFeed = ({ address }: { address: string }) => {
  const [current, setCurrent] = useState(0)
  const [hovered, toggleHover] = useReducer((state) => !state, false)
  const navigate = useNavigate()
  const { data: collectionActivity } = useQuery(['collectionActivity', address], () => ActivityFetcher(address), {
    staleTime: 5000,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      if (collectionActivity && !hovered) setCurrent(current === collectionActivity.events.length - 1 ? 0 : current + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [current, collectionActivity, hovered])

  return (
    <Column
      borderRadius="20"
      overflow="hidden"
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
      marginTop="40"
      style={{ background: 'rgba(13, 14, 14, 0.7)', height: '270px', width: '60%' }}
    >
      {collectionActivity ? (
        <Box display="flex" flexDirection="row" flexWrap="nowrap" overflow="hidden">
          <Column padding="20" style={{ maxWidth: '286px' }}>
            <Box
              as="img"
              src={collectionActivity.events[current].tokenMetadata?.imageUrl}
              borderRadius="12"
              style={{ width: '230px', height: '230px' }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/nfts/asset/${address}/${collectionActivity.events[current].tokenId}?origin=explore`)
              }}
            />
          </Column>
          <Column width="full" position="relative">
            {collectionActivity.events.map((activityEvent: ActivityEvent, index: number) => {
              return <ActivityRow event={activityEvent} index={index} key={index} current={current} />
            })}
          </Column>
        </Box>
      ) : null}
    </Column>
  )
}

const ActivityRow = ({ event, index, current }: { event: ActivityEvent; index: number; current: number }) => {
  const navigate = useNavigate()

  const formattedPrice = useMemo(
    () => (event.price ? putCommas(formatEthPrice(event.price)).toString() : null),
    [event.price]
  )

  const scrollPosition = useMemo(() => {
    const itemHeight = 56
    if (current === index) return current === 0 ? 0 : itemHeight / 2
    if (index > current)
      return current === 0 ? (index - current) * itemHeight : (index - current) * itemHeight + itemHeight / 2
    if (index < current)
      return current === 0 ? -(current - index) * itemHeight : -((current - index) * itemHeight - itemHeight / 2)
    else return 0
  }, [index, current])

  return (
    <Row
      className={clsx(styles.activityRow, index === current && styles.activeRow)}
      paddingTop="8"
      paddingBottom="8"
      fontSize="14"
      width="full"
      paddingLeft="16"
      style={{ transform: `translateY(${scrollPosition}px)` }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/nfts/asset/${event.collectionAddress}/${event.tokenId}?origin=explore`)
      }}
    >
      <Box as="img" src={event.tokenMetadata?.imageUrl} borderRadius="12" marginRight="8" width="40" height="40" />
      <Box as="span" color="explicitWhite">
        <Box as="span">{ActivityEventTypeDisplay[event.eventType]}</Box>
        <Box as="span" color="grey300" paddingLeft="4" paddingRight="4">
          for
        </Box>
        {formattedPrice} ETH
      </Box>

      {event.eventTimestamp && isValidDate(event.eventTimestamp) && (
        <Box className={styles.timestamp}>
          {getTimeDifference(event.eventTimestamp?.toString())}
          {event.marketplace && <MarketplaceIcon marketplace={event.marketplace} />}
        </Box>
      )}
    </Row>
  )
}

export default ActivityFeed

const MarketplaceIcon = ({ marketplace }: { marketplace: Markets }) => {
  return (
    <Box
      as="img"
      alt={marketplace}
      src={`/nft/svgs/marketplaces/${marketplace}.svg`}
      className={styles.marketplaceIcon}
    />
  )
}
