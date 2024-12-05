import bannerUrl from 'assets/svg/ubestarter-launchpad.svg'
import styled from 'styled-components'

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

const LaunchpadHeader = () => {
  return (
    <BannerContainer>
      <BannerMainArea>
        <HeaderContainer>
          UbeStarter
          <HeaderDetails>An amazing launchpad on Celo Network</HeaderDetails>
        </HeaderContainer>
        <Image src={bannerUrl} />
      </BannerMainArea>
    </BannerContainer>
  )
}

export default LaunchpadHeader
