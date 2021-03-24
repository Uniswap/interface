import React from 'react'
import styled from 'styled-components'

import ToggleDarkMode from './ToggleDarkMode'
import LanguageSelector from './LanguageSelector'
import SocialLinks from './SocialLinks'

const StyledUtilities = styled.div`
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
