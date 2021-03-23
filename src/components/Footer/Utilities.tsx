import React from 'react'
import styled from 'styled-components'

import ToggleDarkMode from './ToggleDarkMode'
import LanguageSelector from './LanguageSelector'
import SocialLinks from './SocialLinks'

const StyledUtilities = styled.div`
  position: fixed;
  display: flex;
  left: 0;
  bottom: 0;
  padding: 1rem;
  opacity: 0.8;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

export default function Utilities() {
  return (
    <StyledUtilities>
      <ToggleDarkMode />
      <LanguageSelector />
      <SocialLinks />
    </StyledUtilities>
  )
}
