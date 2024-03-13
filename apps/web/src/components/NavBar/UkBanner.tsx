import { t, Trans } from '@lingui/macro'
import throttle from 'lodash/throttle'
import { useEffect, useState } from 'react'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { ButtonText, CloseIcon, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

import { useUkBannerState } from 'state/application/atoms'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'
import { Flex } from 'ui/src'

export const UK_BANNER_HEIGHT = 65
export const UK_BANNER_HEIGHT_MD = 113
export const UK_BANNER_HEIGHT_SM = 137

const BannerWrapper = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.surface1};
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  z-index: ${Z_INDEX.fixed};
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  width: 98%;
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

export const bannerText = t`
  This web application is provided as a tool for users to interact with the Uniswap Protocol on
  their own initiative, with no endorsement or recommendation of cryptocurrency trading activities. In doing so,
  Uniswap is not recommending that users or potential users engage in cryptoasset trading activity, and users or
  potential users of the web application should not regard this webpage or its contents as involving any form of
  recommendation, invitation or inducement to deal in cryptoassets.
`

const BannerConatner = styled.div<{
  show: boolean
}>`
  display: flex;
  max-height: ${({ show }) => (show ? `${UK_BANNER_HEIGHT}px` : '0px')};
  overflow: hidden;
  width: 100%;
  transition: max-height 0.35s ease-in-out;
  position: relative;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-height: ${({ show }) => (show ? `${UK_BANNER_HEIGHT_MD}px` : '0px')};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-height: ${({ show }) => (show ? `${UK_BANNER_HEIGHT_SM}px` : '0px')};
  }
`

export const useRenderUkBanner = () => {
  const [show, setShow] = useState<boolean>(true)
  const [notDismissed, dismissBanner] = useUkBannerState()

  const originCountry = useAppSelector((state: AppState) => state.user.originCountry)

  useEffect(() => {
    const scrollListener = () => {
      if (window.scrollY > 0) setShow(false)
      if (window.scrollY <= 5) setShow(true)
    }
    window.addEventListener('scroll', throttle(scrollListener, 100))
    return () => window.removeEventListener('scroll', throttle(scrollListener, 100))
  }, [])

  return {
    renderUkBanner: Boolean(originCountry) && originCountry === 'GB' && show && notDismissed,
    dismissBanner,
  }
}

export function UkBanner() {
  const { renderUkBanner, dismissBanner } = useRenderUkBanner()
  const openDisclaimer = useOpenModal(ApplicationModal.UK_DISCLAIMER)

  return (
    <BannerConatner show={renderUkBanner}>
      <BannerWrapper>
        <BannerTextWrapper lineHeight="24px">{`${t`UK disclaimer:`} ${bannerText}`}</BannerTextWrapper>
        <ReadMoreWrapper>
          <ThemedText.BodySecondary lineHeight="24px" color="accent1" onClick={openDisclaimer}>
            <Trans>Read more</Trans>
          </ThemedText.BodySecondary>
        </ReadMoreWrapper>
      </BannerWrapper>
      <Flex alignContent="center" justifyContent="center" width="2%">
        <CloseIcon onClick={dismissBanner} width={18} height={18} />
      </Flex>
    </BannerConatner>
  )
}
