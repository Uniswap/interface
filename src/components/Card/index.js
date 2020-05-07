import React from 'react'
import styled from 'styled-components'
import { Text } from 'rebass'
import { Box } from 'rebass/styled-components'

const Card = styled(Box)`
  width: 100%;
  border-radius: 16px;
  padding: 1.25rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.advancedBG};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.advancedBG};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.yellow2};
  font-weight: 500;
`

export const PinkCard = styled(Card)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.pink2};
  font-weight: 500;
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => theme.blue5};
  color: ${({ theme }) => theme.blue1};
  border-radius: 12px;
  width: fit-content;
`

export const BlueCard = ({ children }) => {
  return (
    <BlueCardStyled>
      <Text fontWeight={500} color="#2172E5">
        {children}
      </Text>
    </BlueCardStyled>
  )
}
