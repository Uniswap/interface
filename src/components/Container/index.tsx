import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

interface StyledContainerProps {
  width: number
}

const StyledContainer = styled.div<StyledContainerProps>`
  box-sizing: border-box;
  margin: 0 auto;
  max-width: ${({ width }) => width}px;
  padding: 0 ${({ theme }) => theme.spacing[4]}px;
  width: 100%;
`
interface ContainerProps {
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Container({ children, size = 'md' }: ContainerProps) {
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
