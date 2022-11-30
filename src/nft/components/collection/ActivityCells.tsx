import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { EventName, PageName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/smart-order-router'
import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import {
  ActivityExternalLinkIcon,
  ActivityListingIcon,
  ActivitySaleIcon,
  ActivityTransferIcon,
  CancelListingIcon,
  RarityVerifiedIcon,
} from 'nft/components/icons'
import {
  ActivityEvent,
  ActivityEventType,
  ActivityEventTypeDisplay,
  BagItem,
  GenieAsset,
  Markets,
  OrderStatus,
  TokenMetadata,
  TokenRarity,
} from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { buildActivityAsset } from 'nft/utils/buildActivityAsset'
import { formatEthPrice } from 'nft/utils/currency'
import { getTimeDifference, isValidDate } from 'nft/utils/date'
import { putCommas } from 'nft/utils/putCommas'
import { fallbackProvider, getRarityProviderLogo } from 'nft/utils/rarity'
import { MouseEvent, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import * as styles from './Activity.css'

const AddressLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;
  font-weight: 400;
  line-height: 20px;
  a {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
  }
  a:hover {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  a:focus {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const formatListingStatus = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.EXECUTED:
      return 'Sold'
    case OrderStatus.CANCELLED:
      return 'Cancelled'
    case OrderStatus.EXPIRED:
      return 'Expired'
    case OrderStatus.VALID:
      return 'Add to Bag'
  }
}

interface BuyCellProps {
  event: ActivityEvent
  collectionName: string
  selectAsset: (assets: GenieAsset[]) => void
  removeAsset: (assets: GenieAsset[]) => void
  itemsInBag: BagItem[]
  cartExpanded: boolean
  toggleCart: () => void
  isMobile: boolean
  ethPriceInUSD: number
}

export const BuyCell = ({
  event,
  collectionName,
  selectAsset,
  removeAsset,
  itemsInBag,
  cartExpanded,
  toggleCart,
  isMobile,
  ethPriceInUSD,
}: BuyCellProps) => {
  const asset = useMemo(
    () => buildActivityAsset(event, collectionName, ethPriceInUSD),
    [event, collectionName, ethPriceInUSD]
  )
  const isSelected = useMemo(() => {
    return itemsInBag.some((item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address)
  }, [asset, itemsInBag])

  const trace = useTrace({ page: PageName.NFT_COLLECTION_PAGE })

  const eventProperties = {
    collection_address: asset.address,
    token_id: asset.tokenId,
    token_type: asset.tokenType,
    ...trace,
  }

  return (
    <Column display={{ sm: 'none', lg: 'flex' }} height="full" justifyContent="center" marginX="auto">
      {event.eventType === ActivityEventType.Listing && event.orderStatus ? (
        <Box
          as="button"
          className={event.orderStatus === OrderStatus.VALID && isSelected ? styles.removeCell : styles.buyCell}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            isSelected ? removeAsset([asset]) : selectAsset([asset])
            !isSelected && !cartExpanded && !isMobile && toggleCart()
            !isSelected && sendAnalyticsEvent(EventName.NFT_BUY_ADDED, { eventProperties })
          }}
          disabled={event.orderStatus !== OrderStatus.VALID}
        >
          {event.orderStatus === OrderStatus.VALID ? (
            <>{`${isSelected ? 'Remove' : 'Add to bag'}`}</>
          ) : (
            <>{`${formatListingStatus(event.orderStatus)}`}</>
          )}
        </Box>
      ) : (
        '-'
      )}
    </Column>
  )
}

interface AddressCellProps {
  address?: string
  desktopLBreakpoint?: boolean
  chainId?: number
}

export const AddressCell = ({ address, desktopLBreakpoint, chainId }: AddressCellProps) => {
  return (
    <Column
      display={{ sm: 'none', xl: desktopLBreakpoint ? 'none' : 'flex', xxl: 'flex' }}
      className={styles.addressCell}
    >
      <AddressLink
        href={getExplorerLink(chainId ?? ChainId.MAINNET, address ?? '', ExplorerDataType.ADDRESS)}
        style={{ textDecoration: 'none' }}
      >
        <Box onClick={(e) => e.stopPropagation()}>{address ? shortenAddress(address, 2, 4) : '-'}</Box>
      </AddressLink>
    </Column>
  )
}

export const MarketplaceIcon = ({ marketplace }: { marketplace: Markets }) => {
  return (
    <Box
      as="img"
      alt={marketplace}
      src={`/nft/svgs/marketplaces/${marketplace}.svg`}
      className={styles.marketplaceIcon}
    />
  )
}

const PriceTooltip = ({ price }: { price: string }) => (
  <MouseoverTooltip
    text={
      <Box textAlign="left" fontSize="14" fontWeight="normal" color="textSecondary">
        {`${price} ETH`}
      </Box>
    }
    placement="top"
  >
    <Box>{`${price.substring(0, 5)}... ETH`}</Box>
  </MouseoverTooltip>
)

export const PriceCell = ({ marketplace, price }: { marketplace?: Markets; price?: string }) => {
  const formattedPrice = useMemo(() => (price ? putCommas(formatEthPrice(price))?.toString() : null), [price])

  return (
    <Row display={{ sm: 'none', md: 'flex' }} gap="8">
      {marketplace && <MarketplaceIcon marketplace={marketplace} />}
      {formattedPrice ? (
        formattedPrice.length > 6 ? (
          <PriceTooltip price={formattedPrice} />
        ) : (
          <>{`${formattedPrice} ETH`}</>
        )
      ) : (
        <>-</>
      )}
    </Row>
  )
}

interface EventCellProps {
  eventType: ActivityEventType
  eventTimestamp?: number
  eventTransactionHash?: string
  eventOnly?: boolean
  price?: string
  isMobile?: boolean
}

const renderEventIcon = (eventType: ActivityEventType) => {
  switch (eventType) {
    case ActivityEventType.Listing:
      return <ActivityListingIcon width={16} height={16} />
    case ActivityEventType.Sale:
      return <ActivitySaleIcon width={16} height={16} />
    case ActivityEventType.Transfer:
      return <ActivityTransferIcon width={16} height={16} />
    case ActivityEventType.CancelListing:
      return <CancelListingIcon width={16} height={16} />
    default:
      return null
  }
}

const openEtherscanLinkInNewTab = (e: MouseEvent, transactionHash: string) => {
  e.preventDefault()
  window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank', 'noopener,noreferrer')
}

const ExternalLinkIcon = ({ transactionHash }: { transactionHash: string }) => (
  <Row onClick={(e: MouseEvent) => openEtherscanLinkInNewTab(e, transactionHash)} marginLeft="4">
    <ActivityExternalLinkIcon />
  </Row>
)

const eventColors = (eventType: ActivityEventType) => {
  const activityEvents = {
    [ActivityEventType.Listing]: 'gold',
    [ActivityEventType.Sale]: 'green',
    [ActivityEventType.Transfer]: 'violet',
    [ActivityEventType.CancelListing]: 'accentFailure',
  }

  return activityEvents[eventType] as 'gold' | 'green' | 'violet' | 'accentFailure'
}

export const EventCell = ({
  eventType,
  eventTimestamp,
  eventTransactionHash,
  eventOnly,
  price,
  isMobile,
}: EventCellProps) => {
  const formattedPrice = useMemo(() => (price ? putCommas(formatEthPrice(price))?.toString() : null), [price])
  return (
    <Column height="full" justifyContent="center" gap="4">
      <Row className={styles.eventDetail} color={eventColors(eventType)}>
        {renderEventIcon(eventType)}
        {ActivityEventTypeDisplay[eventType]}
      </Row>
      {eventTimestamp && isValidDate(eventTimestamp) && !isMobile && !eventOnly && (
        <Row className={styles.eventTime}>
          {getTimeDifference(eventTimestamp.toString())}
          {eventTransactionHash && <ExternalLinkIcon transactionHash={eventTransactionHash} />}
        </Row>
      )}
      {isMobile && price && <Row fontSize="16" fontWeight="normal" color="textPrimary">{`${formattedPrice} ETH`}</Row>}
    </Column>
  )
}

interface ItemCellProps {
  event: ActivityEvent
  rarityVerified: boolean
  collectionName: string
  isMobile: boolean
  eventTimestamp?: number
}

const NoContentContainer = () => (
  <Box
    position="relative"
    style={{
      background: `#24272e`,
    }}
    className={styles.detailsImage}
  >
    <Box
      position="absolute"
      textAlign="center"
      left="1/2"
      top="1/2"
      style={{ transform: 'translate3d(-50%, -50%, 0)' }}
      color="gray500"
      fontSize="12"
      fontWeight="normal"
    >
      Image
      <br />
      not
      <br />
      available
    </Box>
  </Box>
)

interface RankingProps {
  rarity: TokenRarity
  collectionName: string
  rarityVerified: boolean
  details?: boolean
}

const Ranking = ({ details, rarity, collectionName, rarityVerified }: RankingProps) => {
  const rarityProviderLogo = getRarityProviderLogo(rarity.source)

  return (
    <Box>
      <MouseoverTooltip
        text={
          <Row>
            <Box display="flex" marginRight="4">
              <img src={rarityProviderLogo} alt="cardLogo" width={16} />
            </Box>
            <Box width="full" fontSize="14">
              {rarityVerified
                ? `Verified by ${collectionName}`
                : `Ranking by ${rarity.source === 'Genie' ? fallbackProvider : rarity.source}`}
            </Box>
          </Row>
        }
        placement="top"
      >
        <Box className={styles.rarityInfo}>
          <Box paddingTop="2" paddingBottom="2" display="flex">
            {putCommas(rarity.rank)}
          </Box>

          <Box display="flex" height="16">
            {rarityVerified ? <RarityVerifiedIcon /> : null}
          </Box>
        </Box>
      </MouseoverTooltip>
    </Box>
  )
}

const getItemImage = (tokenMetadata?: TokenMetadata): string | undefined => {
  return tokenMetadata?.smallImageUrl || tokenMetadata?.imageUrl
}

export const ItemCell = ({ event, rarityVerified, collectionName, eventTimestamp, isMobile }: ItemCellProps) => {
  const [loaded, setLoaded] = useState(false)
  const [noContent, setNoContent] = useState(!getItemImage(event.tokenMetadata))

  return (
    <Row gap="16" overflow="hidden" whiteSpace="nowrap">
      {!noContent ? (
        <Box
          as="img"
          alt={event.tokenMetadata?.name || event.tokenId}
          src={getItemImage(event.tokenMetadata)}
          draggable={false}
          className={styles.detailsImage}
          style={{
            background: loaded ? 'none' : '#24272e',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setNoContent(true)}
        />
      ) : (
        <NoContentContainer />
      )}
      <Column height="full" justifyContent="center" overflow="hidden" whiteSpace="nowrap" marginRight="24">
        <Box className={styles.detailsName}>{event.tokenMetadata?.name || event.tokenId}</Box>
        {event.tokenMetadata?.rarity && !isMobile && (
          <Ranking
            rarity={event.tokenMetadata?.rarity}
            rarityVerified={rarityVerified}
            collectionName={collectionName}
          />
        )}
        {isMobile && eventTimestamp && isValidDate(eventTimestamp) && getTimeDifference(eventTimestamp.toString())}
      </Column>
    </Row>
  )
}
