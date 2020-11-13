import { transparentize } from 'polished'
import styled from 'styled-components'

export const GovernanceText = styled.span`
  color: ${({ theme }) => transparentize(0.6, theme.text5)};
`
