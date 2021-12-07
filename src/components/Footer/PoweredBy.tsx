import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import PoweredByIconLight from 'components/Icons/PoweredByIconLight'
import PoweredByIconDark from 'components/Icons/PoweredByIconDark'
import { useDarkModeManager } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import SocialLinks from './SocialLinks'

const StyledPoweredBy = styled.div`
  position: fixed;
  bottom: 96px;
  right: 16px;
  z-index: 3;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 8px 16px;
  border-radius: 4px;
  background: ${({ theme }) => `${theme.bg3}33`};
  :hover {
    background: ${({ theme }) => `${theme.bg3}50`};
  }

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
    padding: 16px;
    flex-direction: column;
    position: absolute;
    top: 16px;
    bottom: auto;
    right: 16px;
  }
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

const PoweredByText = styled.div`
  color: ${({ theme }) => theme.poweredByText};
  font-size: 10px;
  font-weight: 400;
  margin-bottom: 0;
  margin-right: 8px;

  @media only screen and (min-width: 1366px) {
    margin-bottom: 8px;
    margin-right: 0;
  }
`

const SocialLinksWrapper = styled.div`
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
  const above768 = useMedia('(min-width: 768px)')

  if (!above768) return null

  return (
    <StyledPoweredBy>
      <PoweredByLink href="https://kyber.network/">
        <PoweredByText>
          <Trans>Powered By</Trans>
        </PoweredByText>
        <div>
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
        </div>
      </PoweredByLink>
      <SocialLinksWrapper>
        <SocialLinks />
      </SocialLinksWrapper>
    </StyledPoweredBy>
  )
}
