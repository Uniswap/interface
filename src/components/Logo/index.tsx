import React from 'react'
import {useDarkModeManager} from "../../state/user/hooks";
import styled from 'styled-components'

import WhiteLogo from '../../assets/svg/logo_white.svg'
import BlueLogo from '../../assets/svg/logo_blue.svg'

const UniIcon = styled.div`
  width: 150px;
  margin: 0 auto;
  
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
    img { 
      width: 4.5rem;
    }
  `};
`

export default function Logo({...rest}: { style?: React.CSSProperties }) {
  const [isDark] = useDarkModeManager();

  return (
    <UniIcon>
      <img src={isDark ? WhiteLogo : BlueLogo} alt="logo" />
    </UniIcon>
  )
}
