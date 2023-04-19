import styled from 'styled-components/macro'

import { containerStyles } from './shared'

const DescriptionContainer = styled.div`
  height: 288px;
  padding: 16px 20px 20px;

  ${containerStyles}
`

export const DataPageDescription = () => {
  return <DescriptionContainer>Description</DescriptionContainer>
}
