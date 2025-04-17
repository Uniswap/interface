import { InterfacePageName, NFTEventName } from '@uniswap/analytics-events'
import {
  ActivityExternalLinkIcon,
  ActivityListingIcon,
  ActivitySaleIcon,
  ActivityTransferIcon,
  CancelListingIcon,
} from 'nft/components/iconExports'
import { ActivityEvent, ActivityEventTypeDisplay, BagItem, GenieAsset } from 'nft/types'
import { buildActivityAsset } from 'nft/utils/buildActivityAsset'
import { getTimeDifference } from 'nft/utils/date'
import { ReactNode, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, GetThemeValueForKey, Text, styled as tamaguiStyled } from 'ui/src'
import {
  NftActivityType,
  NftMarketplace,
  OrderStatus,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
