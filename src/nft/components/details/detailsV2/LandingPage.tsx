import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import { VerifiedIcon } from 'nft/components/icons'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { InfoChips } from './InfoChips'
import { MediaRenderer } from './MediaRenderer'

const MAX_WIDTH = 560

const LandingPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: ${({ theme }) => `calc(100vh - ${theme.navHeight}px - ${theme.mobileBottomBarHeight}px)`};
  align-items: center;
  padding: 22px 20px 0px;
  gap: 26px;
  width: 100%;

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
    justify-content: center;
  }
`

const InfoContainer = styled(ColumnCenter)`
  gap: 40px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    width: ${MAX_WIDTH}px;
  }
`

const StyledHeadlineText = styled.div`
  font-weight: 600;
  font-size: 20px;
  line-height: 28px;
  text-align: center;
  color: ${({ theme }) => theme.textPrimary};

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    line-height: 44px;
    font-size: 36px;
  }
`
const StyledSubheaderText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: ${({ theme }) => theme.textSecondary};

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    line-height: 24px;
    font-size: 16px;
  }
`

const InfoDetailsContainer = styled(Column)`
  gap: 4px;
  align-items: center;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    ${StyledHeadlineText} {
      line-height: 44px;
      font-size: 36px;
    }

    ${StyledSubheaderText} {
      line-height: 24px;
      font-size: 16px;
    }
  }
`

const MediaContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0px 12px 20px rgba(0, 0, 0, 0.1));

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    width: ${MAX_WIDTH}px;
    height: ${MAX_WIDTH}px;
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
        <MediaRenderer asset={asset} />
      </MediaContainer>
      <InfoContainer>
        <InfoDetailsContainer>
          <Row justify="center" gap="4px" align="center">
            <StyledSubheaderText>{collection.collectionName}</StyledSubheaderText>
            {collection.isVerified && <VerifiedIcon width="16px" height="16px" />}
          </Row>
          <StyledHeadlineText>{asset.name ?? `${asset.collectionName} #${asset.tokenId}`}</StyledHeadlineText>
        </InfoDetailsContainer>
        <InfoChips asset={asset} />
      </InfoContainer>
    </LandingPageContainer>
  )
}
