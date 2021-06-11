import styled from 'styled-components'
import { DarkCard } from '../Card'

export const Card = styled(DarkCard)`
  width: 100%;
`

export const Divider = styled.div`
  height: 100%;
  width: 1px;
  background: ${props => props.theme.bg5};
`
