import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

interface ContainerProps {
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// eslint-disable-next-line react/prop-types
const Container: React.FC<ContainerProps> = ({ children, size = 'md' }) => {
  const { siteWidth } = useContext(ThemeContext)
  let width: number
  switch (size) {
    case 'sm':
      width = siteWidth / 2
      break
    case 'md':
      width = (siteWidth * 2) / 3
      break
    case 'lg':
    default:
      width = siteWidth
  }
  return <StyledContainer width={width}>{children}</StyledContainer>
}

interface StyledContainerProps {
  width: number
}

const StyledContainer = styled.div<StyledContainerProps>`
  box-sizing: border-box;
  margin: 0 auto;
  max-width: ${props => props.width}px;
  padding: 0 ${({ theme }) => theme.spacing[4]}px;
  width: 100%;
`

export default Container
