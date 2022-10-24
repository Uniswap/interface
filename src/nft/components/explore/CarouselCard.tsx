import { VerifiedIcon } from 'nft/components/icons'
import { TrendingCollection } from 'nft/types'
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
  width: 456px;
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

const CardBottomContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  row-gap: 16px;
  padding-right: 28px;
  padding-left: 28px;
  padding-bottom: 20px;
  justify-content: space-between;
`

const HeaderRow = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.userThemeColor};
  line-height: 24px;
`

const TableElement = styled(ThemedText.SubHeaderSmall)`
  font-weight: 400;
  line-height: 20px;
`

interface CarouselCardProps {
  collection: TrendingCollection
  onClick: () => void
}

export const CarouselCard = ({ collection, onClick }: CarouselCardProps) => {
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
        <HeaderRow>Uniswap</HeaderRow>
        <HeaderRow>{formatWeiToDecimal(collection.floor.toString())} ETH Floor</HeaderRow>
        <HeaderRow>324 Listings</HeaderRow>
        <TableElement>OpenSea</TableElement>
        <TableElement>7.1 ETH</TableElement>
        <TableElement>279</TableElement>
        <TableElement>X2Y2</TableElement>
        <TableElement>7.3 ETH</TableElement>
        <TableElement>32</TableElement>
        <TableElement>LooksRare</TableElement>
        <TableElement>6.9 ETH</TableElement>
        <TableElement>12</TableElement>
      </CardBottomContainer>
    </CarouselCardContainer>
  )
}
