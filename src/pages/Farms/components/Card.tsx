import React from 'react'
import styled from 'styled-components'

// eslint-disable-next-line react/prop-types
const Card: React.FC = ({ children }) => <StyledCard>{children}</StyledCard>

const StyledCard = styled.div`
  background: ${({ theme }) => theme.grey200};
  border: 1px solid ${({ theme }) => theme.grey300}ff;
  border-radius: 12px;
  box-shadow: inset 1px 1px 0px ${({ theme }) => theme.grey100};
  display: flex;
  flex: 1;
  flex-direction: column;
`

export default Card
