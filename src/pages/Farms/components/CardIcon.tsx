import React from 'react'
import styled from 'styled-components'

interface CardIconProps {
  children?: React.ReactNode
}

// eslint-disable-next-line react/prop-types
const CardIcon: React.FC<CardIconProps> = ({ children }) => <StyledCardIcon>{children}</StyledCardIcon>

const StyledCardIcon = styled.div`
  background-color: ${({ theme }) => theme.grey200};
  font-size: 36px;
  height: 80px;
  width: 80px;
  border-radius: 40px;
  align-items: center;
  display: flex;
  justify-content: center;
  box-shadow: inset 4px 4px 8px ${({ theme }) => theme.grey300}, inset -6px -6px 12px ${({ theme }) => theme.grey100};
  margin: 0 auto ${({ theme }) => theme.spacing[3]}px;
`

export default CardIcon
