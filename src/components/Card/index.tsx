import React from 'react'
import styled from 'styled-components'
import { CardProps, Text } from 'rebass'
import { Box } from 'rebass/styled-components'
import useTheme from 'hooks/useTheme'

const Card = styled(Box)<{ padding?: string; border?: string; borderRadius?: string }>`
  width: 100%;
  border-radius: 20px;
  padding: 1.25rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const BlackCard = styled(Card)`
  background-color: ${({ theme }) => theme.buttonBlack};
`

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const LightGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.background};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.buttonGray};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.border};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.yellow2};
  font-weight: 500;
`

export const WarningCard = styled(Card)`
  background-color: rgba(255, 153, 1, 0.15);
  color: ${({ theme }) => theme.warning};
  font-weight: 500;
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => `${theme.primary}33`};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  width: fit-content;
`

export const DarkCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
`

export const BlueCard = ({ children, ...rest }: CardProps) => {
  const theme = useTheme()
  return (
    <BlueCardStyled {...rest}>
      <Text fontWeight={500} color={theme.text}>
        {children}
      </Text>
    </BlueCardStyled>
  )
}
