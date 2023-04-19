import styled from 'styled-components/macro'

import { containerStyles } from './shared'

const TraitsContainer = styled.div`
  height: 528px;
  padding: 16px 20px;

  ${containerStyles}
`

export const DataPageTraits = () => {
  return <TraitsContainer>Traits</TraitsContainer>
}
