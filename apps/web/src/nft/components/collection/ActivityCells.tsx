import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
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
import { getTimeDifference } from 'nft/utils/date'
import { ReactNode, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, GetThemeValueForKey, Image, Text, styled as tamaguiStyled } from 'ui/src'
import {
  NftActivityType,
  NftMarketplace,
  OrderStatus,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const AddressLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral1};
  text-decoration: none;
  font-weight: 485;
  line-height: 20px;
  a {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
  }
  a:hover {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  a:focus {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const BuyCellText = tamaguiStyled(Text, {
  variant: 'buttonLabel2',
  width: 'max-content',
  background: 'none',
  py: '$padding6',
  px: '$padding12',
  borderRadius: '$rounded12',
  animation: 'fast',
  cursor: 'pointer',
  variants: {
    remove: {
      true: {
        color: '$accent1',
        disabledStyle: {
          color: '$neutral3',
        },
        hoverStyle: {
          background: '$accent1',
          color: '$white',
        },
      },
      false: {
        color: '$critical',
        hoverStyle: {
          background: '$critical',
          color: '$white',
        },
      },
    },
  } as const,
})

const isPurchasableOrder = (orderStatus?: OrderStatus, marketplace?: string): boolean => {
  if (!marketplace || !orderStatus) {
    return false
  }
  const purchasableMarkets = Object.keys(NftMarketplace).map((market) => market.toLowerCase())

  const validOrder = orderStatus === OrderStatus.Valid
  const isPurchasableMarket = purchasableMarkets.includes(marketplace.toLowerCase())
  return validOrder && isPurchasableMarket
}

const formatListingStatus = (status: OrderStatus, orderIsPurchasable: boolean, isSelected: boolean): ReactNode => {
  if (orderIsPurchasable) {
    return isSelected ? <Trans i18nKey="common.remove.label" /> : <Trans i18nKey="nft.addToBag" />
  }

  switch (status) {
    case OrderStatus.Executed:
      return <Trans i18nKey="common.sold" />
    case OrderStatus.Cancelled:
      return <Trans i18nKey="common.cancelled" />
    case OrderStatus.Expired:
      return <Trans i18nKey="common.expired" />
    case OrderStatus.Valid:
      return <Trans i18nKey="common.unavailable" />
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
    [event, collectionName, ethPriceInUSD],
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
    <Flex $md={{ display: 'none' }} height="100%" justifyContent="center">
      {event.eventType === NftActivityType.Listing && event.orderStatus ? (
        <BuyCellText
          color={orderIsPurchasable ? '$accent1' : '$neutral1'}
          remove={orderIsPurchasable && isSelected}
          onPress={(e) => {
            e.preventDefault()
            isSelected ? removeAsset([asset]) : selectAsset([asset])
            !isSelected && !cartExpanded && !isMobile && toggleCart()
            !isSelected && sendAnalyticsEvent(NFTEventName.NFT_BUY_ADDED, eventProperties)
          }}
          disabled={!orderIsPurchasable}
          {...(orderIsPurchasable ? ClickableTamaguiStyle : {})}
        >
          {formatListingStatus(event.orderStatus, orderIsPurchasable, isSelected)}
        </BuyCellText>
      ) : (
        '-'
      )}
    </Flex>
  )
}

interface AddressCellProps {
  address?: string
  desktopLBreakpoint?: boolean
  chainId?: number
}

export const AddressCell = ({ address, chainId }: AddressCellProps) => {
  return (
    <Flex $md={{ display: 'none' }} height="100%" justifyContent="center" pl="$spacing2">
      <AddressLink
        href={getExplorerLink(chainId ?? UniverseChainId.Mainnet, address ?? '', ExplorerDataType.ADDRESS)}
        style={{ textDecoration: 'none' }}
      >
        <Text variant="body2" onPress={(e) => e.stopPropagation()}>
          {address ? shortenAddress(address, 2) : '-'}
        </Text>
      </AddressLink>
    </Flex>
  )
}

const PriceTooltip = ({ price }: { price: string }) => (
  <MouseoverTooltip
    text={
      <Text textAlign="left" variant="body3" color="$neutral2">
        {`${price} ETH`}
      </Text>
    }
    placement="top"
  >
    <Text variant="body3">{`${price.substring(0, 5)}... ETH`}</Text>
  </MouseoverTooltip>
)

export const PriceCell = ({ marketplace, price }: { marketplace?: Markets | string; price?: string | number }) => {
  const { formatNumberOrString } = useFormatter()
  const formattedPrice = useMemo(
    () => (price ? formatNumberOrString({ input: parseFloat(price?.toString()), type: NumberType.NFTToken }) : null),
    [formatNumberOrString, price],
  )

  return (
    <Flex row $md={{ display: 'none' }} gap="$gap8" alignItems="center">
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
    </Flex>
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
  const color = eventColors(eventType) as string
  switch (eventType) {
    case NftActivityType.Listing:
      return <ActivityListingIcon width={16} height={16} color={color} />
    case NftActivityType.Sale:
      return <ActivitySaleIcon width={16} height={16} color={color} />
    case NftActivityType.Transfer:
      return <ActivityTransferIcon width={16} height={16} color={color} />
    case NftActivityType.CancelListing:
      return <CancelListingIcon width={16} height={16} color={color} />
    default:
      return null
  }
}

const openEtherscanLinkInNewTab = (transactionHash: string) => {
  window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank', 'noopener,noreferrer')
}

const ExternalLinkIcon = ({ transactionHash, color }: { transactionHash: string; color: string }) => (
  <Flex
    row
    onPress={(e) => {
      e.preventDefault()
      openEtherscanLinkInNewTab(transactionHash)
    }}
    ml="$spacing4"
  >
    <ActivityExternalLinkIcon color={color} />
  </Flex>
)

const eventColors = (eventType: NftActivityType): GetThemeValueForKey<'color'> => {
  const activityEvents = {
    [NftActivityType.Listing]: '#eeb317',
    [NftActivityType.Sale]: '$statusSuccess',
    [NftActivityType.Transfer]: '#bdb8fa',
    [NftActivityType.CancelListing]: '$statusCritical',
  } as const

  return activityEvents[eventType]
}

export const EventCell = ({
  eventType,
  eventTimestamp,
  eventTransactionHash,
  eventOnly,
  price,
  isMobile,
}: EventCellProps) => {
  const { formatNumberOrString } = useFormatter()
  const formattedPrice = useMemo(
    () => (price ? formatNumberOrString({ input: parseFloat(price?.toString()), type: NumberType.NFTToken }) : null),
    [formatNumberOrString, price],
  )
  return (
    <Flex height="100%" justifyContent="center" gap="$gap4">
      <Flex row gap="$gap8" alignItems="center">
        {renderEventIcon(eventType)}
        <Text variant="body2" color={eventColors(eventType)}>
          {ActivityEventTypeDisplay[eventType]}
        </Text>
      </Flex>
      {eventTimestamp && !isMobile && !eventOnly && (
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body3" color="$neutral2">
            {getTimeDifference(eventTimestamp.toString())}
          </Text>
          {eventTransactionHash && <ExternalLinkIcon color="$neutral2" transactionHash={eventTransactionHash} />}
        </Flex>
      )}
      {isMobile && price && <Text variant="body2" color="$neutral1">{`${formattedPrice} ETH`}</Text>}
    </Flex>
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
  <Flex position="relative" backgroundColor="#24272e" width={60} height={60} borderRadius="$rounded8">
    <Text
      position="absolute"
      textAlign="center"
      left="50%"
      top="50%"
      style={{ transform: 'translate3d(-50%, -50%, 0)' }}
      color="$neutral2"
      variant="body3"
    >
      Image
      <br />
      not
      <br />
      available
    </Text>
  </Flex>
)

interface RankingProps {
  rarity: TokenRarity | Rarity
  collectionName: string
  rarityVerified: boolean
  details?: boolean
}

const Ranking = ({ rarity, collectionName, rarityVerified }: RankingProps) => {
  const { formatNumber } = useFormatter()
  const rank = (rarity as TokenRarity).rank || (rarity as Rarity).providers?.[0].rank

  if (!rank) {
    return null
  }

  return (
    <Flex>
      <MouseoverTooltip
        text={
          <Flex row alignItems="center">
            <Flex mr="$spacing4">
              <img src="/nft/svgs/gem.svg" alt="cardLogo" width={16} />
            </Flex>
            <Text variant="body3" width="100%">
              {rarityVerified ? `Verified by ${collectionName}` : `Ranking by Rarity Sniper`}
            </Text>
          </Flex>
        }
        placement="top"
      >
        <Flex
          row
          alignItems="center"
          height="$spacing16"
          $platform-web={{ width: 'min-content', backdropFilter: 'blur(6px)' }}
          borderRadius="$rounded4"
          backgroundColor="$surface3"
          px="$spacing4"
          cursor="pointer"
        >
          <Text my="$spacing2" variant="body3" color="$neutral1">
            {formatNumber({ input: rank, type: NumberType.WholeNumber })}
          </Text>

          <Text display="flex" height="$spacing16" variant="body2" color="$neutral1">
            {rarityVerified ? <RarityVerifiedIcon /> : null}
          </Text>
        </Flex>
      </MouseoverTooltip>
    </Flex>
  )
}

const getItemImage = (tokenMetadata?: TokenMetadata): string | undefined => {
  return tokenMetadata?.smallImageUrl || tokenMetadata?.imageUrl
}

export const ItemCell = ({ event, rarityVerified, collectionName, eventTimestamp, isMobile }: ItemCellProps) => {
  const [loaded, setLoaded] = useState(false)
  const [noContent, setNoContent] = useState(!getItemImage(event.tokenMetadata))

  return (
    <Flex row alignItems="center" gap="$gap16" overflow="hidden" $platform-web={{ whiteSpace: 'nowrap' }}>
      {!noContent ? (
        <Image
          alt={event.tokenMetadata?.name || event.tokenId}
          src={getItemImage(event.tokenMetadata)}
          borderRadius="$rounded8"
          overflow="hidden"
          backgroundColor={loaded ? 'transparent' : '#24272e'}
          onLoad={() => setLoaded(true)}
          onError={() => setNoContent(true)}
          height={60}
          width={60}
        />
      ) : (
        <NoContentContainer />
      )}
      <Flex
        height="100%"
        justifyContent="center"
        overflow="hidden"
        $platform-web={{ whiteSpace: 'nowrap' }}
        mr="$spacing24"
      >
        <Text mb="$spacing6" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" variant="body2" width="90%">
          {event.tokenMetadata?.name || event.tokenId}
        </Text>
        {event.tokenMetadata?.rarity && !isMobile && (
          <Ranking
            rarity={event.tokenMetadata?.rarity}
            rarityVerified={rarityVerified}
            collectionName={collectionName}
          />
        )}
        {isMobile && eventTimestamp && getTimeDifference(eventTimestamp.toString())}
      </Flex>
    </Flex>
  )
}
