import React from 'react'
import styled from 'styled-components'

import ToggleDarkMode from './ToggleDarkMode'
import LanguageSelector from './LanguageSelector'
import SocialLinks from './SocialLinks'
import { useRouteMatch } from 'react-router'

const StyledUtilities = styled.div<{ isAboutpage?: boolean }>`
  position: absolute;
  display: flex;
  top: 0;
  right: 0;
  padding: 20px 18px;
  opacity: 0.8;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }

  ${({ theme, isAboutpage }) => theme.mediaWidth.upToMedium`
    ${isAboutpage ? `display: none;` : ``}
    position: fixed;
    top: auto;
    bottom: 4.5rem;
    left: 0;
    right: auto;
    height: fit-content;
  `}
`

export default function Utilities() {
  let aboutPage = useRouteMatch("/about");

  return (
    <StyledUtilities isAboutpage={aboutPage?.isExact}>
      <ToggleDarkMode />
      <LanguageSelector />
      <SocialLinks />
    </StyledUtilities>
  )
}
