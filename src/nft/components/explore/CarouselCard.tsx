import { formatNumberOrString, NumberType } from '@uniswap/conedison/format'
import { loadingAnimation } from 'components/Loader/styled'
import { LoadingBubble } from 'components/Tokens/loading'
import { useCollectionQuery } from 'graphql/data/nft/Collection'
import { VerifiedIcon } from 'nft/components/icons'
import { Markets, TrendingCollection } from 'nft/types'
import { formatWeiToDecimal } from 'nft/utils'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const CarouselCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 20px;
  gap: 8px;
  overflow: hidden;
  height: 100%;
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    gap: 20px;
  }
`
const CarouselCardBorder = styled.div`
  width: 100%;
  position: relative;
  border-radius: 22px;
  cursor: pointer;
  border: 2px solid transparent;
  transition-property: border-color;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  transition-timing-function: ${({ theme }) => theme.transition.timing.inOut};

  :hover {
    border: 2px solid ${({ theme }) => theme.backgroundOutline};
  }

  ::after {
    content: '';
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 22px;
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
  width: 100%;
  height: 108px;
  padding-top: 32px;
  padding-bottom: 16px;
  padding-left: 28px;
  padding-right: 28px;
  background-image: ${({ src }) => `url(${src})`};
  background-size: cover;
  background-position: center;
`

const LoadingCardHeaderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 108px;
  padding-top: 32px;
  padding-bottom: 16px;
  padding-left: 28px;
  padding-right: 28px;
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

const CardHeaderRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    gap: 12px;
  }
`

const CardNameRow = styled.div`
  display: flex;
  gap: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const IconContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
`

const CollectionNameContainer = styled.div`
  display: flex;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const LoadingCollectionNameContainer = styled(LoadingBubble)`
  width: 50%;
`

const HeaderOverlay = styled.div`
  position: absolute;
  height: 108px;
  top: 0px;
  right: 0px;
  left: 0px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%, rgba(0, 0, 0, 0.08));
  z-index: 0;
`

const CollectionImage = styled.img`
  width: 60px;
  height: 60px;
  background: ${({ theme }) => theme.accentTextLightPrimary};
  border: 2px solid ${({ theme }) => theme.accentTextLightPrimary};
  border-radius: 100px;
`

const LoadingCollectionImage = styled.div`
  width: 60px;
  height: 60px;
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

const CardBottomContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  row-gap: 8px;
  column-gap: 20px;
  padding-right: 28px;
  padding-left: 28px;
  padding-bottom: 20px;
  justify-content: space-between;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    row-gap: 16px;
  }
`

const HeaderRow = styled.div`
  color: ${({ theme }) => theme.userThemeColor};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  row-gap: 8px;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    font-size: 16px;
    line-height: 24px;
    row-gap: 12px;
  }
`

const LoadingTableElement = styled(LoadingBubble)`
  width: 50px;
`

const TableElement = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
`

interface MarketplaceRowProps {
  marketplace: string
  floorInEth?: number
  listings?: number
}

export const MarketplaceRow = ({ marketplace, floorInEth, listings }: MarketplaceRowProps) => {
  return (
    <>
      <TableElement>{marketplace}</TableElement>
      <TableElement>
        {floorInEth !== undefined ? formatNumberOrString(floorInEth, NumberType.NFTTokenFloorPriceTrailingZeros) : '-'}{' '}
        ETH
      </TableElement>
      <TableElement>{listings ?? '-'}</TableElement>
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
  const gqlCollection = useCollectionQuery(collection.address)

  return (
    <CarouselCardBorder>
      <CarouselCardContainer onClick={onClick}>
        <CarouselCardHeader collection={collection} />
        <CardBottomContainer>
          <>
            <HeaderRow>Uniswap</HeaderRow>
            <HeaderRow>{formatWeiToDecimal(collection.floor.toString())} ETH Floor</HeaderRow>
            <HeaderRow>{gqlCollection.marketplaceCount?.reduce((acc, cur) => acc + cur.count, 0)} Listings</HeaderRow>
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

export const LoadingTable = () => {
  return (
    <>
      {[...Array(DEFAULT_TABLE_ELEMENTS)].map((index) => (
        <LoadingTableElement key={index} />
      ))}
    </>
  )
}

const CarouselCardHeader = ({ collection }: { collection: TrendingCollection }) => {
  const theme = useTheme()
  return (
    <CardHeaderContainer src={collection.bannerImageUrl}>
      <CardHeaderRow>
        <CollectionImage src={collection.imageUrl} />
        <CardNameRow>
          <CollectionNameContainer>
            <ThemedText.MediumHeader color={theme.accentTextLightPrimary} fontWeight="500" lineHeight="28px">
              {collection.name}
            </ThemedText.MediumHeader>
          </CollectionNameContainer>
          {collection.isVerified && (
            <IconContainer>
              <VerifiedIcon width="24px" height="24px" />
            </IconContainer>
          )}
        </CardNameRow>
      </CardHeaderRow>
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
            <CardHeaderRow>
              <LoadingCollectionImage />
              <LoadingCollectionNameContainer />
            </CardHeaderRow>
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
