import { Text } from 'rebass'
import styled from 'styled-components'

export const ClickableText = styled(Text)`
  :hover {
    cursor: pointer;
  }
  color: ${({ theme }) => theme.primary1};
`
