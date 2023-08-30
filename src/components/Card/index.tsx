import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const Card = styled(Box)<{ width?: string; padding?: string; border?: string; $borderRadius?: string }>`
  width: ${({ width }) => width ?? '100%'};
  padding: ${({ padding }) => padding ?? '1rem'};
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '16px'};
  border: ${({ border }) => border};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface2};
`

export const GrayCard = styled(Card)`
  background-color: ${({ theme }) => theme.surface2};
`

export const DarkGrayCard = styled(Card)`
  background-color: ${({ theme }) => theme.surface3};
`

export const DarkCard = styled(Card)`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface2};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.deprecated_yellow3};
  font-weight: 535;
`

export const BlueCard = styled(Card)`
  background-color: ${({ theme }) => theme.accent2};
  color: ${({ theme }) => theme.accent1};
  border-radius: 12px;
`
