import React from 'react'
import styled from 'styled-components'
import PoweredByIconLight from 'components/Icons/PoweredByIconLight'
import PoweredByIconDark from 'components/Icons/PoweredByIconDark'
import { ExternalLink } from '../../theme'
import { useDarkModeManager } from 'state/user/hooks'
import { useRouteMatch } from 'react-router'

const StyledPoweredBy = styled.div<{ isAboutpage?: boolean }>`
  position: absolute;
  display: none;
  opacity: 0.7;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }

  @media only screen and (min-width: 768px) {
    position: fixed;
    display: block;
    top: auto;
    bottom: 96px;
    right: 16px;
    z-index: -1;
  }

  @media only screen and (min-width: 1200px) {
    position: fixed;
    display: block;
    top: auto;
    bottom: 24px;
    right: 16px;
    z-index: -1;
  }

  @media only screen and (min-width: 1366px) {
    position: absolute;
    display: block;
    top: 16px;
    bottom: auto;
    right: 16px;
  }

  ${({ isAboutpage }) => `
    ${isAboutpage ? `display: none;` : ``}
  `}
`

export default function PoweredBy() {
  const [darkMode] = useDarkModeManager()
  const aboutPage = useRouteMatch('/about')

  return (
    <StyledPoweredBy isAboutpage={aboutPage?.isExact}>
      <ExternalLink href="https://kyber.network/">
        {darkMode ? <PoweredByIconDark /> : <PoweredByIconLight />}
      </ExternalLink>
    </StyledPoweredBy>
  )
}
