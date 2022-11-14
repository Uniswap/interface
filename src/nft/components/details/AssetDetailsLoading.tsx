import Column from 'components/Column'
import Loader from 'components/Loader'
import { LoadingBubble } from 'components/Tokens/loading'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import styled, { useTheme } from 'styled-components/macro'

const BREAKPOINT = '960px'

const Title = styled(LoadingBubble)`
  height: 16px;
  width: 136px;
`

const SubTitle = styled(LoadingBubble)`
  height: 40px;
  width: 200px;
  margin-top: 12px;
`

const PrimaryBody = styled(LoadingBubble)`
  width: 100%;
  height: 260px;
`

const PrimaryContent = styled(Column)`
  max-width: 780px;
  margin-top: 28px;
  width: 100%;

  @media (max-width: ${BREAKPOINT}) {
    max-width: 100%;
  }
`

const SecondaryContent = styled(LoadingBubble)`
  width: 100%;
  height: 60px;
  margin-top: 28px;
`

const LoaderContainer = styled.div`
  width: 100%;
  padding-top: 200px;
  padding-bottom: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: pink;
`

const BuyNowContainer = styled(LoadingBubble)`
  height: 180px;
  width: 360px;
  margin-top: 28px;

  @media (max-width: ${BREAKPOINT}) {
    width: 100%;
  }
`

const PriceContainer = styled(LoadingBubble)`
  height: 16px;
  width: 136px;

  @media (max-width: ${BREAKPOINT}) {
    margin-top: 20px;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  margin-top: 48px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  max-width: 1296px;

  ${ScreenBreakpointsPaddings}

  @media (max-width: ${BREAKPOINT}) {
    max-width: 100%;
    margin-top: 0;
  }
`

const StyledColumn = styled(Column)`
  max-width: 780px;
  width: 100%;

  @media (max-width: ${BREAKPOINT}) {
    max-width: 100%;
  }
`

const BuyNowLoadingDesktop = styled.div`
  padding-left: 60px;

  @media (max-width: ${BREAKPOINT}) {
    display: none;
  }
`

const BuyNowLoadingMobile = styled.div`
  display: none;
  margin-top: 16px;

  @media (max-width: ${BREAKPOINT}) {
    display: block;
  }
`

const BuyNowLoading = () => (
  <>
    <PriceContainer />
    <BuyNowContainer />
  </>
)

export const AssetDetailsLoading = () => {
  const theme = useTheme()

  return (
    <LoadingContainer>
      <StyledColumn>
        <LoaderContainer>
          <Loader stroke={theme.accentAction} size="40px" />
        </LoaderContainer>
        <Title />
        <SubTitle />
        <BuyNowLoadingMobile>
          <BuyNowLoading />
        </BuyNowLoadingMobile>
        <PrimaryContent>
          <PrimaryBody />
          <SecondaryContent />
          <SecondaryContent />
          <SecondaryContent />
        </PrimaryContent>
      </StyledColumn>
      <BuyNowLoadingDesktop>
        <BuyNowLoading />
      </BuyNowLoadingDesktop>
    </LoadingContainer>
  )
}
