import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

interface StyledSpacerProps {
  size: number
}

const StyledSpacer = styled.div<StyledSpacerProps>`
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;
`

interface SpacerProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Spacer({ size = 'md' }: SpacerProps) {
  const { spacing } = useContext(ThemeContext)

  let s: number
  switch (size) {
    case 'lg':
      s = spacing[6]
      break
    case 'sm':
      s = spacing[2]
      break
    case 'md':
    default:
      s = spacing[4]
  }

  return <StyledSpacer size={s} />
}
