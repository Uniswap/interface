import styled from 'styled-components/macro'

import { containerStyles, containerXPadding } from './shared'

const HeaderContainer = styled.div`
  height: 96px;
  flex-shrink: 0;

  ${containerStyles}
  ${containerXPadding}
`

export const DataPageHeader = () => {
  return <HeaderContainer>Header</HeaderContainer>
}
