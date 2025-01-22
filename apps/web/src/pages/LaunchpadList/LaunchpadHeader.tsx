import bannerUrl from 'assets/svg/ubestarter-launchpad.svg'
import Row from 'components/Row'
import { Trans } from 'i18n'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'

const BannerContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  padding-top: 22px;
  position: relative;

  @media only screen and (min-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 32px 16px;
  }
`

const BannerMainArea = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  gap: 36px;
  max-width: ${({ theme }) => theme.maxWidth};
  justify-content: space-between;
  z-index: 2;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    height: 100%;
    gap: 14px;
    margin-top: 4px;
    margin-bottom: 6px;
  }
`

const HeaderContainer = styled.div`
  max-width: 600px;
  font-weight: 535;
  font-size: 72px;
  line-height: 88px;
  flex-shrink: 0;
  padding-bottom: 32px;

  color: ${({ theme }) => theme.neutral1};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    font-size: 48px;
    line-height: 67px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    font-size: 36px;
    line-height: 50px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    line-height: 43px;
    text-align: center;
    padding-bottom: 16px;

    br {
      display: none;
    }
  }

  /* Custom breakpoint to split into two lines on smaller screens */
  @media only screen and (max-width: 550px) {
    font-size: 28px;
    line-height: 34px;

    br {
      display: unset;
    }
  }
`
const Image = styled.img`
  margin-right: 6vw;
  width: 20vw;
  max-width: 250px;
  opacity: 0.8;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

const HeaderDetails = styled.div`
  font-weight: normal;
  font-size: 20px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`
const LearnMoreButton = styled(Link)`
  display: flex;
  width: 70%;
  padding: 12px 16px;
  border-radius: 24px;
  border: 0;
  background-color: ${({ theme }) => theme.surface2};
  font-family: Basel;
  font-size: 20px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px;
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle}
`
const LearnMoreArrow = styled(ArrowRightCircle)`
  size: 24px;
  stroke: ${({ theme }) => theme.surface2};
  fill: ${({ theme }) => theme.neutral1};
`

function LearnMore() {
  return (
    <LearnMoreButton to="/ubestarter/create">
      <Row gap="sm" align="center">
        <Trans>List Your Project</Trans>
        <LearnMoreArrow />
      </Row>
    </LearnMoreButton>
  )
}

const LaunchpadHeader = () => {
  return (
    <BannerContainer>
      <BannerMainArea>
        <HeaderContainer>
          UbeStarter
          <HeaderDetails>An amazing launchpad on Celo Network</HeaderDetails>
          <LearnMore />
        </HeaderContainer>
        <Image src={bannerUrl} />
      </BannerMainArea>
    </BannerContainer>
  )
}

export default LaunchpadHeader
