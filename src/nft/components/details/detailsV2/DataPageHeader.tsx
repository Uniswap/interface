import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { containerStyles } from './shared'

const HeaderContainer = styled.div`
  height: 96px;
  flex-shrink: 0;
  padding-left: 0px;

  ${containerStyles}

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

export const DataPageHeader = () => {
  return <HeaderContainer>Header</HeaderContainer>
}
