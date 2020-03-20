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
  border: 1px solid ${({ theme }) => theme.outlineGrey};
`

export const GreyCard = styled(Card)`
  background-color: rgba(255, 255, 255, 0.9);
`

const BlueCardStyled = styled(Card)`
  background-color: #ebf4ff;
  color: #2172e5;
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
