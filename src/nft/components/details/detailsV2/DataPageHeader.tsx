import styled from 'styled-components/macro'

import { containerStyles } from './shared'

const HeaderContainer = styled.div`
  height: 96px;
  flex-shrink: 0;

  ${containerStyles}

  padding-left: 0px;
`

export const DataPageHeader = () => {
  return <HeaderContainer>Header</HeaderContainer>
}
