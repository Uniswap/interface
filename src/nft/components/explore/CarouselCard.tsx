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
  gap: 20px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.backgroundOutline};
  width: 100%;
  cursor: pointer;
  overflow: hidden;

  :hover {
    outline: 3px solid ${({ theme }) => theme.backgroundOutline};
    box-shadow: ${({ theme }) => theme.deepShadow};
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
  gap: 12px;
  align-items: center;
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
  row-gap: 16px;
  column-gap: 20px;
  padding-right: 28px;
  padding-left: 28px;
  padding-bottom: 20px;
  justify-content: space-between;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    row-gap: 12px;
  }
`

const HeaderRow = styled.div`
  color: ${({ theme }) => theme.userThemeColor};
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    row-gap: 12px;
    font-size: 14px;
    line-height: 20px;
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
  floor?: string
  listings?: string
}

export const MarketplaceRow = ({ marketplace, floor, listings }: MarketplaceRowProps) => {
  return (
    <>
      <TableElement>{marketplace}</TableElement>
      <TableElement>{floor ?? '-'}</TableElement>
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

  const theme = useTheme()

  return (
    <CarouselCardContainer onClick={onClick}>
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
      <CardBottomContainer>
        {!gqlCollection ? (
          <LoadingTable />
        ) : (
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
                  listings={marketplace.count.toString()}
                  floor={marketplace.floorPrice.toString()}
                />
              )
            })}
          </>
        )}
      </CardBottomContainer>
    </CarouselCardContainer>
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

export const LoadingCarouselCard = () => {
  return (
    <CarouselCardContainer>
      <LoadingCardHeaderContainer>
        <CardHeaderRow>
          <LoadingCollectionImage />
          <LoadingCollectionNameContainer />
        </CardHeaderRow>
        <HeaderOverlay />
      </LoadingCardHeaderContainer>
      <CardBottomContainer>
        <LoadingTable />
      </CardBottomContainer>
    </CarouselCardContainer>
  )
}
