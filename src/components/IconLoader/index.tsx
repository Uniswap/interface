import React from 'react'
import styled, { keyframes } from 'styled-components'
import CardIcon from '../CardIcon'

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const StyledLoader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const StyledYam = styled.div`
  font-size: 32px;
  position: relative;
  animation: 1s ${spin} infinite;
`

const StyledText = styled.div`
  color: ${({ theme }) => theme.grey400};
`

interface LoaderProps {
  text?: string
}

export default function Loader({ text }: LoaderProps) {
  return (
    <StyledLoader>
      <CardIcon>
        <StyledYam>
          <span role="img" aria-label="load-icon">
            🦄
          </span>
        </StyledYam>
      </CardIcon>
      {!!text && <StyledText>{text}</StyledText>}
    </StyledLoader>
  )
}
