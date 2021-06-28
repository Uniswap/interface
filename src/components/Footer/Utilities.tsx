import React from 'react'
import styled from 'styled-components'

import ToggleDarkMode from './ToggleDarkMode'
import LanguageSelector from './LanguageSelector'
import SocialLinks from './SocialLinks'
import { useRouteMatch } from 'react-router'

const StyledUtilities = styled.div<{ isAboutpage?: boolean }>`
  display: flex;
  padding: 20px 18px;
  opacity: 0.8;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }

  ${({ theme, isAboutpage }) => theme.mediaWidth.upToLarge`
    ${isAboutpage ? `display: none;` : ``}
    padding: 0 18px;
    height: fit-content;
    z-index: 99;
  `}
`

export default function Utilities() {
  const aboutPage = useRouteMatch('/about')

  return (
    <StyledUtilities isAboutpage={aboutPage?.isExact}>
      <ToggleDarkMode />
      <LanguageSelector />
      <SocialLinks />
    </StyledUtilities>
  )
}
