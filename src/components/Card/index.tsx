import { Box } from 'rebass/styled-components'
import styled from 'styled-components/macro'

const Card = styled(Box)<{ width?: string; padding?: string; border?: string; $borderRadius?: string }>`
  width: ${({ width }) => width ?? '100%'};
  padding: ${({ padding }) => padding ?? '1rem'};
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '16px'};
  border: ${({ border }) => border};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.backgroundInteractive};
  background-color: ${({ theme }) => theme.deprecated_bg1};
`

export const GrayCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_bg3};
`

export const DarkGrayCard = styled(Card)`
  background-color: ${({ theme }) => theme.backgroundInteractive};
`

export const DarkCard = styled(Card)`
  background-color: ${({ theme }) => theme.backgroundSurface};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.deprecated_bg3};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.deprecated_yellow3};
  font-weight: 500;
`

export const BlueCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_primary5};
  color: ${({ theme }) => theme.accentAction};
  border-radius: 12px;
`
