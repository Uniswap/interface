import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { MouseoverTooltip } from 'components/Tooltip'
import { NftActivityType, NftMarketplace, OrderStatus } from 'graphql/data/__generated__/types-and-hooks'
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
  ActivityEventTypeDisplay,
  BagItem,
  GenieAsset,
  Markets,
  Rarity,
  TokenMetadata,
  TokenRarity,
} from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils'
import { buildActivityAsset } from 'nft/utils/buildActivityAsset'
import { formatEth } from 'nft/utils/currency'
import { getTimeDifference } from 'nft/utils/date'
import { putCommas } from 'nft/utils/putCommas'
import { MouseEvent, ReactNode, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { shortenAddress } from 'utils'
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

const isPurchasableOrder = (orderStatus?: OrderStatus, marketplace?: string): boolean => {
  if (!marketplace || !orderStatus) return false
  const purchasableMarkets = Object.keys(NftMarketplace).map((market) => market.toLowerCase())

  const validOrder = orderStatus === OrderStatus.Valid
  const isPurchasableMarket = purchasableMarkets.includes(marketplace.toLowerCase())
  return validOrder && isPurchasableMarket
}

const formatListingStatus = (status: OrderStatus, orderIsPurchasable: boolean, isSelected: boolean): ReactNode => {
  if (orderIsPurchasable) {
    return isSelected ? <Trans>Remove</Trans> : <Trans>Add to bag</Trans>
  }

  switch (status) {
    case OrderStatus.Executed:
      return <Trans>Sold</Trans>
    case OrderStatus.Cancelled:
      return <Trans>Cancelled</Trans>
    case OrderStatus.Expired:
      return <Trans>Expired</Trans>
    case OrderStatus.Valid:
      return <Trans>Unavailable</Trans>
    default:
      return null
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

  const orderIsPurchasable = isPurchasableOrder(event.orderStatus, event.marketplace)
  const trace = useTrace({ page: InterfacePageName.NFT_COLLECTION_PAGE })
  const eventProperties = {
    collection_address: asset.address,
    token_id: asset.tokenId,
    token_type: asset.tokenType,
    ...trace,
  }

  return (
    <Column display={{ sm: 'none', lg: 'flex' }} height="full" justifyContent="center" marginX="auto">
      {event.eventType === NftActivityType.Listing && event.orderStatus ? (
        <Box
          as="button"
          className={orderIsPurchasable && isSelected ? styles.removeCell : styles.buyCell}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            isSelected ? removeAsset([asset]) : selectAsset([asset])
            !isSelected && !cartExpanded && !isMobile && toggleCart()
            !isSelected && sendAnalyticsEvent(NFTEventName.NFT_BUY_ADDED, { eventProperties })
          }}
          disabled={!orderIsPurchasable}
        >
          {formatListingStatus(event.orderStatus, orderIsPurchasable, isSelected)}
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
        <Box onClick={(e) => e.stopPropagation()}>{address ? shortenAddress(address, 2) : '-'}</Box>
      </AddressLink>
    </Column>
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

export const PriceCell = ({ marketplace, price }: { marketplace?: Markets | string; price?: string | number }) => {
  const formattedPrice = useMemo(() => (price ? formatEth(parseFloat(price?.toString())) : null), [price])

  return (
    <Row display={{ sm: 'none', md: 'flex' }} gap="8">
      {marketplace && getMarketplaceIcon(marketplace, '16')}
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
  eventType: NftActivityType
  eventTimestamp?: number
  eventTransactionHash?: string
  eventOnly?: boolean
  price?: string | number
  isMobile?: boolean
}

const renderEventIcon = (eventType: NftActivityType) => {
  switch (eventType) {
    case NftActivityType.Listing:
      return <ActivityListingIcon width={16} height={16} />
    case NftActivityType.Sale:
      return <ActivitySaleIcon width={16} height={16} />
    case NftActivityType.Transfer:
      return <ActivityTransferIcon width={16} height={16} />
    case NftActivityType.CancelListing:
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

const eventColors = (eventType: NftActivityType) => {
  const activityEvents = {
    [NftActivityType.Listing]: 'gold',
    [NftActivityType.Sale]: 'green',
    [NftActivityType.Transfer]: 'violet',
    [NftActivityType.CancelListing]: 'accentFailure',
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
  const formattedPrice = useMemo(() => (price ? formatEth(parseFloat(price?.toString())) : null), [price])
  return (
    <Column height="full" justifyContent="center" gap="4">
      <Row className={styles.eventDetail} color={eventColors(eventType)}>
        {renderEventIcon(eventType)}
        {ActivityEventTypeDisplay[eventType]}
      </Row>
      {eventTimestamp && !isMobile && !eventOnly && (
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
  rarity: TokenRarity | Rarity
  collectionName: string
  rarityVerified: boolean
  details?: boolean
}

const Ranking = ({ rarity, collectionName, rarityVerified }: RankingProps) => {
  const rank = (rarity as TokenRarity).rank || (rarity as Rarity).providers?.[0].rank

  if (!rank) return null

  return (
    <Box>
      <MouseoverTooltip
        text={
          <Row>
            <Box display="flex" marginRight="4">
              <img src="/nft/svgs/gem.svg" alt="cardLogo" width={16} />
            </Box>
            <Box width="full" fontSize="14">
              {rarityVerified ? `Verified by ${collectionName}` : `Ranking by Rarity Sniper`}
            </Box>
          </Row>
        }
        placement="top"
      >
        <Box className={styles.rarityInfo}>
          <Box paddingTop="2" paddingBottom="2" display="flex">
            {putCommas(rank)}
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
        {isMobile && eventTimestamp && getTimeDifference(eventTimestamp.toString())}
      </Column>
    </Row>
  )
}
