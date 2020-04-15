import React from 'react'
import styled from 'styled-components'
import { Text } from 'rebass'
import { Box } from 'rebass/styled-components'

const Card = styled(Box)`
  width: 100%;
  border-radius: 8px;
  padding: 1rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg3};
`

export const GreyCard = styled(Card)`
  background-color: rgba(255, 255, 255, 0.6);
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 190, 30, 0.3);
  color: ${({ theme }) => theme.yellow2};
  fontweight: 500;
`

export const PinkCard = styled(Card)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.pink2};
  fontweight: 500;
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => theme.blue5};
  color: ${({ theme }) => theme.blue1};
  border-radius: 12px;
  padding: 8px;
  width: fit-content;
`

export const BlueCard = ({ children }) => {
  return (
    <BlueCardStyled>
      <Text textAlign="center" fontWeight={500} color="#2172E5">
        {children}
      </Text>
    </BlueCardStyled>
  )
}
