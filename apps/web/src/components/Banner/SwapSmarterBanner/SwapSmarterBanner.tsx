import { Trans } from '@lingui/macro'
import { PopupContainer } from 'components/Banner/shared/styled'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { colors } from 'theme/colors'
import { SwapSmarterBannerBackground, UniswapLogoWithStar } from './icons'
import { useSwapSmarterBanner } from './useSwapSmarterBanner'

const StyledPopupContainer = styled(PopupContainer)`
  height: 150px;
  width: 350px;
  right: 28px;
  bottom: 46px;

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    right: unset;
    left: unset;
    bottom: 68px;
  }

  @media screen and (max-width: 350px) {
    display: none;
  }

  border: none;
  background: none;
  overflow: hidden;
`

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 15.24px 16px;
  position: relative;
  background: ${colors.pinkBase};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  overflow: hidden;
`

const ContentContainer = styled(Column)`
  position: relative;
  justify-content: center;
  z-index: 1;
  gap: 6px;
`

const ComingSoonContainer = styled.div`
  width: max-content;
  height: 19.68px;
  border-top-left-radius: 4.34px;
  border-top-right-radius: 4.34px;
  background-color: ${colors.pinkVibrant};
  color: white;
  font-size: 11.78px;
  font-weight: 535;
  line-height: 14.14px;
  text-align: center;
  padding: 3.67px 6.62px 1.69px 6.62px;
`

const BrowserExtensionContainer = styled(Row)`
  width: max-content;
  background-color: white;
  padding: 2.1px 4.95px 0 5.8px;
  border-top-right-radius: 4.34px;
  border-bottom-right-radius: 4.34px;
  color: black;
  font-size: 30.66px;
  font-weight: 535;
  line-height: 36.8px;
  text-align: center;
  gap: 1.45px;
  letter-spacing: -0.04em;
`

const SubtitleContainer = styled.div`
  width: max-content;
  background-color: white;
  padding: 0px 6.79px 6.28px 6.79px;
  border-bottom-left-radius: 4.34px;
  border-bottom-right-radius: 4.34px;
  color: black;
  font-size: 16.84px;
  font-weight: 500;
  line-height: 18.86px;
  letter-spacing: -0.04em;
`

const ButtonStyles = css`
  height: 29.76px;
  width: 100%;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 535;
  line-height: 20px;
`

const LearnMoreButton = styled(ThemeButton)`
  color: white;
  background-color: black;
  ${ButtonStyles}
`

const DismissButton = styled(ThemeButton)`
  color: #361a37;
  background-color: #ffffff4d;
  border: 1px solid #ffffff1f;
  ${ButtonStyles}
`

export function SwapSmarterBanner() {
  const { shouldShowBanner, handleAccept, handleReject } = useSwapSmarterBanner()

  return (
    <StyledPopupContainer show={shouldShowBanner} data-testid="swap-smarter-banner">
      <Wrapper>
        <ContentContainer>
          <Column>
            <ComingSoonContainer>
              <Trans>COMING SOON</Trans>
            </ComingSoonContainer>
            <BrowserExtensionContainer>
              <UniswapLogoWithStar />
              <Trans>Browser Extension</Trans>
            </BrowserExtensionContainer>
            <SubtitleContainer>
              <Trans>and all new products to swap smarter</Trans>
            </SubtitleContainer>
          </Column>
          <Row gap="sm">
            <LearnMoreButton size={ButtonSize.medium} emphasis={ButtonEmphasis.promotional} onClick={handleAccept}>
              <Trans>Learn more</Trans>
            </LearnMoreButton>
            <DismissButton size={ButtonSize.medium} emphasis={ButtonEmphasis.promotional} onClick={handleReject}>
              <Trans>Dismiss</Trans>
            </DismissButton>
          </Row>
        </ContentContainer>
        <SwapSmarterBannerBackground />
      </Wrapper>
    </StyledPopupContainer>
  )
}
