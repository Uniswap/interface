import { t } from '@lingui/macro'
import styled from 'styled-components'
import { ButtonText, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

export const UK_BANNER_HEIGHT = 50
export const UK_BANNER_HEIGHT_MD = 80
export const UK_BANNER_HEIGHT_SM = 100

const BannerWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.surface1};
  padding: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  z-index: ${Z_INDEX.fixed};
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    flex-direction: column;
  }
`

const BannerTextWrapper = styled(ThemedText.BodySecondary)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    @supports (-webkit-line-clamp: 2) {
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    @supports (-webkit-line-clamp: 3) {
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  }
`

const ReadMoreWrapper = styled(ButtonText)`
  flex-shrink: 0;
  width: max-content;

  :focus {
    text-decoration: none;
  }
`

export const bannerText = t`This is a forked version of UniswapV3 with no fee. The license & rights are reserved to Uniswap; we hold no additional rights or responsibilities for its use.`

export function UkBanner() {
  // const openDisclaimer = useOpenModal(ApplicationModal.UK_DISCLAIMER)

  return (
    <BannerWrapper>
      <BannerTextWrapper lineHeight="24px">{bannerText}</BannerTextWrapper>
      <ReadMoreWrapper>
        {/* <ThemedText.BodySecondary lineHeight="24px" color="accent1">
          <Trans>Read more</Trans>
        </ThemedText.BodySecondary> */}
      </ReadMoreWrapper>
    </BannerWrapper>
  )
}
