import { formatNumberOrString, NumberType } from '@uniswap/conedison/format'
import { loadingAnimation } from 'components/Loader/styled'
import { LoadingBubble } from 'components/Tokens/loading'
import { useCollection } from 'graphql/data/nft/Collection'
import { VerifiedIcon } from 'nft/components/icons'
import { Markets, TrendingCollection } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme/components/text'

const CarouselCardBorder = styled.div`
  width: 100%;
  position: relative;
  border-radius: 21px;
  cursor: pointer;
  border: 1px solid transparent;
  transition-property: border-color;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  transition-timing-function: ${({ theme }) => theme.transition.timing.inOut};

  :hover {
    border: 1px solid ${({ theme }) => theme.backgroundOutline};
  }

  ::after {
    content: '';
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 21px;
    z-index: -1;
    box-shadow: ${({ theme }) => theme.deepShadow};
    transition-property: opacity;
    transition-duration: ${({ theme }) => theme.transition.duration.fast};
    transition-timing-function: ${({ theme }) => theme.transition.timing.inOut};
  }

  :hover::after {
    opacity: 1;
  }
`

const CardHeaderContainer = styled.div<{ src: string }>`
  position: relative;
  background-image: ${({ src }) => `url(${src})`};
  background-size: cover;
  background-position: center;
`

const LoadingCardHeaderContainer = styled.div`
  position: relative;
  animation: ${loadingAnimation} 1.5s infinite;
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.backgroundInteractive} 25%,
    ${({ theme }) => theme.backgroundOutline} 50%,
    ${({ theme }) => theme.backgroundInteractive} 75%
  );
  will-change: background-position;
  background-size: 400%;
`

const CardHeaderColumn = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  height: 202px;
  justify-content: center;
  padding: 0 40px;
  z-index: 1;
`
const IconContainer = styled.div`
  display: inline;
  vertical-align: text-bottom;
  margin-left: 2px;
`
const CollectionNameContainer = styled.div`
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  max-height: 56px;
`

const LoadingCollectionNameContainer = styled(LoadingBubble)`
  width: 50%;
`

const HeaderOverlay = styled.div`
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.08));
  bottom: 0px;
  left: 0px;
  position: absolute;
  right: 0px;
  top: 0px;
  z-index: 0;

  // overlay workaround for firefox only
  @supports (-moz-appearance: none) {
    bottom: -1px;
  }
`

const CollectionImage = styled.img`
  width: 86px;
  height: 86px;
  background: ${({ theme }) => theme.accentTextLightPrimary};
  border: 2px solid ${({ theme }) => theme.accentTextLightPrimary};
  border-radius: 100px;
`

const LoadingCollectionImage = styled.div`
  width: 86px;
  height: 86px;
  border-radius: 100px;
  animation: ${loadingAnimation} 1.5s infinite;
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.backgroundInteractive} 25%,
    ${({ theme }) => theme.backgroundOutline} 50%,
    ${({ theme }) => theme.backgroundInteractive} 75%
  );
  will-change: background-position;
  background-size: 400%;
`

const LoadingTableElement = styled(LoadingBubble)`
  width: 50px;
`

const TableElement = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const FirstColumnTextWrapper = styled.div``

const CardBottomContainer = styled.div`
  display: grid;
  flex: 1;
  gap: 8px;
  grid-template-columns: auto auto auto;
  padding: 16px 16px 20px;
`

const MarketplaceIcon = styled.img`
  width: 20px;
  height: 20px;
`

const CarouselCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 20px;
  overflow: hidden;
  height: 100%;

  ${TableElement}:nth-child(3n-1), ${LoadingTableElement}:nth-child(3n-1) {
    justify-self: center;
  }

  ${TableElement}:nth-child(3n), ${LoadingTableElement}:nth-child(3n) {
    justify-self: right;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}px) or ((min-width: ${({ theme }) =>
      theme.breakpoint.sm}px) and (max-width: 880px)) {
    ${FirstColumnTextWrapper} {
      display: none;
    }
    ${TableElement} {
      justify-self: left !important;
    }
    ${CardHeaderColumn} {
      padding: 0 20px;
    }
  }
`

interface MarketplaceRowProps {
  marketplace: string
  floorInEth?: number
  listings?: number
}

const MarketplaceRow = ({ marketplace, floorInEth, listings }: MarketplaceRowProps) => {
  return (
    <>
      <TableElement>
        <MarketplaceIcon
          src={`/nft/svgs/marketplaces/${marketplace.toLowerCase()}-grey.svg`}
          alt={`${marketplace} icon`}
        />
        <FirstColumnTextWrapper>
          <ThemedText.BodySmall color="textSecondary">{marketplace}</ThemedText.BodySmall>
        </FirstColumnTextWrapper>
      </TableElement>
      <TableElement>
        <ThemedText.BodySmall color="textSecondary">
          {Number(floorInEth) > 0
            ? `${formatNumberOrString(floorInEth, NumberType.NFTTokenFloorPriceTrailingZeros)} ETH`
            : '-'}
        </ThemedText.BodySmall>
      </TableElement>
      <TableElement>
        <ThemedText.BodySmall color="textSecondary">{Number(listings) > 0 ? listings : 'None'}</ThemedText.BodySmall>
      </TableElement>
    </>
  )
}

interface CarouselCardProps {
  collection: TrendingCollection
  onClick: () => void
}

const MARKETS_TO_CHECK = [Markets.Opensea, Markets.X2Y2, Markets.LooksRare] as const
const MARKETS_ENUM_TO_NAME = {
  [Markets.Opensea]: 'OpenSea',
  [Markets.X2Y2]: 'X2Y2',
  [Markets.LooksRare]: 'LooksRare',
}

export const CarouselCard = ({ collection, onClick }: CarouselCardProps) => {
  const { data: gqlCollection, loading } = useCollection(collection.address)

  if (loading) return <LoadingCarouselCard />

  return (
    <CarouselCardBorder>
      <CarouselCardContainer onClick={onClick}>
        <CarouselCardHeader collection={collection} />
        <CardBottomContainer>
          <>
            <TableElement>
              <MarketplaceIcon src="/nft/svgs/marketplaces/uniswap-magenta.svg" alt="Uniswap icon" />
              <FirstColumnTextWrapper>
                <ThemedText.SubHeaderSmall color="userThemeColor">Uniswap</ThemedText.SubHeaderSmall>
              </FirstColumnTextWrapper>
            </TableElement>
            <TableElement>
              <ThemedText.SubHeaderSmall color="userThemeColor">
                {formatWeiToDecimal(collection.floor.toString())} ETH Floor
              </ThemedText.SubHeaderSmall>
            </TableElement>
            <TableElement>
              <ThemedText.SubHeaderSmall color="userThemeColor">
                {gqlCollection.marketplaceCount?.reduce((acc, cur) => acc + cur.count, 0)} Listings
              </ThemedText.SubHeaderSmall>
            </TableElement>
            {MARKETS_TO_CHECK.map((market) => {
              const marketplace = gqlCollection.marketplaceCount?.find(
                (marketplace) => marketplace.marketplace === market
              )
              if (!marketplace) {
                return null
              }
              return (
                <MarketplaceRow
                  key={`CarouselCard-key-${collection.address}-${marketplace.marketplace}`}
                  marketplace={MARKETS_ENUM_TO_NAME[market]}
                  listings={marketplace.count}
                  floorInEth={marketplace.floorPrice}
                />
              )
            })}
          </>
        </CardBottomContainer>
      </CarouselCardContainer>
    </CarouselCardBorder>
  )
}

const DEFAULT_TABLE_ELEMENTS = 12

const LoadingTable = () => {
  return (
    <>
      {[...Array(DEFAULT_TABLE_ELEMENTS)].map((index) => (
        <LoadingTableElement key={index} />
      ))}
    </>
  )
}

const CollectionName = styled(ThemedText.MediumHeader)`
  display: inline;
  vertical-align: text-bottom;
  line-height: 28px;
`

const CarouselCardHeader = ({ collection }: { collection: TrendingCollection }) => {
  return (
    <CardHeaderContainer src={collection.bannerImageUrl}>
      <CardHeaderColumn>
        <CollectionImage src={collection.imageUrl} />
        <CollectionNameContainer>
          <CollectionName color="accentTextLightPrimary" fontWeight="500">
            {collection.name}
          </CollectionName>
          {collection.isVerified && (
            <IconContainer>
              <VerifiedIcon width="24px" height="24px" />
            </IconContainer>
          )}
        </CollectionNameContainer>
      </CardHeaderColumn>
      <HeaderOverlay />
    </CardHeaderContainer>
  )
}

export const LoadingCarouselCard = ({ collection }: { collection?: TrendingCollection }) => {
  return (
    <CarouselCardBorder>
      <CarouselCardContainer>
        {collection ? (
          <CarouselCardHeader collection={collection} />
        ) : (
          <LoadingCardHeaderContainer>
            <CardHeaderColumn>
              <LoadingCollectionImage />
              <LoadingCollectionNameContainer />
            </CardHeaderColumn>
            <HeaderOverlay />
          </LoadingCardHeaderContainer>
        )}
        <CardBottomContainer>
          <LoadingTable />
        </CardBottomContainer>
      </CarouselCardContainer>
    </CarouselCardBorder>
  )
}
