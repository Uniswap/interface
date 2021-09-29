import React from 'react'
import { useRouteMatch } from 'react-router'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import PoweredByIconLight from 'components/Icons/PoweredByIconLight'
import PoweredByIconDark from 'components/Icons/PoweredByIconDark'
import { useDarkModeManager } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import SocialLinks from './SocialLinks'

const StyledPoweredBy = styled.div<{ isAboutpage?: boolean }>`
  position: fixed;
  bottom: 96px;
  right: 16px;
  z-index: 3;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0;
  border-radius: 4px;

  @media only screen and (min-width: 768px) {
    position: fixed;
    top: auto;
    bottom: 96px;
    right: 16px;
  }

  @media only screen and (min-width: 1000px) {
    top: auto;
    bottom: 96px;
    right: 32px;
  }

  @media only screen and (min-width: 1200px) {
    top: auto;
    bottom: 24px;
    right: 32px;
  }

  @media only screen and (min-width: 1366px) {
    background: rgba(64, 68, 79, 0.2);
    padding: 16px;
    flex-direction: column;
    position: absolute;
    top: 16px;
    bottom: auto;
    right: 16px;
  }

  ${({ isAboutpage }) => `
    ${isAboutpage ? `display: none;` : ``}
  `}
`

const PoweredByLink = styled(ExternalLink)`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }

  @media only screen and (min-width: 1366px) {
    flex-direction: column;
    justify-content: center;
  }
`

const PoweredByIcon = styled.div`
  opacity: 0.4;

  @media only screen and (min-width: 1366px) {
    opacity: 1;
  }
`

const PoweredByText = styled.div`
  opacity: 0.4;
  color: ${({ theme }) => theme.subText};
  font-size: 10px;
  font-weight: 400;
  margin-bottom: 0;
  margin-right: 8px;

  @media only screen and (min-width: 1366px) {
    opacity: 1;
    margin-bottom: 8px;
    margin-right: 0;
  }
`

const SocialLinksWrapper = styled.div`
  opacity: 1;
  margin-left: 6px;
  padding-left: 6px;
  border-left: solid 0.6px ${({ theme }) => theme.subText};

  @media only screen and (min-width: 1366px) {
    margin-top: 14px;
    margin-left: 0;
    padding-left: 0;
    border: none;
  }
`

export default function PoweredBy() {
  const [darkMode] = useDarkModeManager()
  const aboutPage = useRouteMatch('/about')
  const above768 = useMedia('(min-width: 768px)')

  return (
    <StyledPoweredBy isAboutpage={aboutPage?.isExact}>
      <PoweredByLink href="https://kyber.network/">
        <PoweredByText>
          <Trans>Powered By</Trans>
        </PoweredByText>
        <PoweredByIcon>
          {darkMode ? (
            above768 ? (
              <PoweredByIconDark />
            ) : (
              <PoweredByIconDark width={48} />
            )
          ) : above768 ? (
            <PoweredByIconLight />
          ) : (
            <PoweredByIconLight width={48} />
          )}
        </PoweredByIcon>
      </PoweredByLink>
      <SocialLinksWrapper>
        <SocialLinks />
      </SocialLinksWrapper>
    </StyledPoweredBy>
  )
}
