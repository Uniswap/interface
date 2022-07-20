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
  border: 1px solid ${({ theme }) => theme.deprecated_bg2};
  background-color: ${({ theme }) => theme.deprecated_bg1};
`

export const LightGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_bg2};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_bg3};
`

export const DarkGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_bg2};
`

export const DarkCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_bg0};
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
  color: ${({ theme }) => theme.deprecated_blue2};
  border-radius: 12px;
`
