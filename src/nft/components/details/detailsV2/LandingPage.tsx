import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import { VerifiedIcon } from 'nft/components/icons'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

const MAX_WIDTH = 560

const LandingPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: ${({ theme }) => `calc(100vh - ${theme.navHeight}px - ${theme.mobileBottomBarHeight}px)`};
  align-items: center;
  padding: 22px 20px 0px;
  gap: 26px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    gap: 64px;
    padding-top: 28px;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    min-height: ${({ theme }) => `calc(100vh - ${theme.navHeight}px )`};
  }

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    flex-direction: row;
    padding-top: 0px;
    padding-bottom: ${({ theme }) => `${theme.navHeight}px`};
    gap: 80px;
  }
`

const InfoContainer = styled(ColumnCenter)`
  gap: 40px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    width: ${MAX_WIDTH}px;
  }
`

const InfoDetailsContainer = styled(Column)`
  gap: 4px;
  align-items: center;
`

const MediaContainer = styled.div`
  width: 100%;
  height: 100%;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    width: ${MAX_WIDTH}px;
    height: ${MAX_WIDTH}px;
  }
`

const StyledMedia = styled.img`
  object-fit: contain;
  height: 100%;
  width: 100%;
`

const StyledSubheaderText = styled(ThemedText.SubHeaderSmall)`
  line-height: 20px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    line-height: 24px !important;
    font-size: 16px !important;
  }
`

const StyledHeadlineText = styled(ThemedText.HeadlineSmall)`
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    line-height: 44px !important;
    font-size: 36px !important;
  }
`

interface LandingPageProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const LandingPage = ({ asset, collection }: LandingPageProps) => {
  return (
    <LandingPageContainer>
      <MediaContainer>
        <StyledMedia src={asset.imageUrl} />
      </MediaContainer>
      <InfoContainer>
        <InfoDetailsContainer>
          <Row justify="center" gap="4px" align="center">
            <StyledSubheaderText>{collection.collectionName}</StyledSubheaderText>
            {collection.isVerified && <VerifiedIcon width="16px" height="16px" />}
          </Row>
          <StyledHeadlineText>{asset.name ?? `${asset.collectionName} #${asset.tokenId}`}</StyledHeadlineText>
        </InfoDetailsContainer>
      </InfoContainer>
    </LandingPageContainer>
  )
}
