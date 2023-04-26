import Column from 'components/Column'
import Row from 'components/Row'
import { VerifiedIcon } from 'nft/components/icons'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

const MAX_WIDTH = 560

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: ${({ theme }) => `calc(100vh - ${theme.navHeight}px)`};
  align-items: center;
  padding: 22px 20px 0px;
  gap: 80px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    padding-top: 28px;
  }

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    flex-direction: row;
    padding-top: 0px;
    padding-bottom: ${({ theme }) => `${theme.navHeight}px`};
  }
`

const InfoContainer = styled(Column)`
  width: 100%;
  align-items: center;
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
    width: ${MAX_WIDTH}px;
  }
`

const StyledMedia = styled.img`
  object-fit: contain;
  height: 100%;
  width: 100%;
`

interface LandingPageProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const LandingPage = ({ asset, collection }: LandingPageProps) => {
  return (
    <Container>
      <MediaContainer>
        <StyledMedia src={asset.imageUrl} />
      </MediaContainer>
      <InfoContainer>
        <InfoDetailsContainer>
          <Row justify="center" gap="4px" align="center">
            <ThemedText.SubHeader>{collection.collectionName}</ThemedText.SubHeader>
            {collection.isVerified && <VerifiedIcon width="16px" height="16px" />}
          </Row>
          <ThemedText.HeadlineLarge>{collection.collectionName}</ThemedText.HeadlineLarge>
        </InfoDetailsContainer>
      </InfoContainer>
    </Container>
  )
}
