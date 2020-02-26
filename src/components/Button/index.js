import React from 'react'
import { Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components'
import { darken } from 'polished'

import { RowBetween } from '../Row'
import { ChevronDown } from 'react-feather'

const Base = styled(RebassButton)`
  padding: ${({ padding }) => (padding ? padding : '16px')};
  width: ${({ width }) => (width ? width : '100%')};
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  border-radius: 20px;
  outline: none;
  border: 1px solid transparent;
  color: white;
  cursor: pointer;
  &:disabled {
    cursor: auto;
  }
`

export const ButtonPrimary = styled(Base)`
  background-color: ${({ theme }) => theme.royalBlue};
  color: white;
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.royalBlue)};
    background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.royalBlue)};
    background-color: ${({ theme }) => darken(0.1, theme.royalBlue)};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.royalBlue};
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonSecondary = styled(Base)`
  background-color: #ebf4ff;
  color: #2172e5;
  border-radius: 8px;
  padding: 10px;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, '#ebf4ff')};
    background-color: ${({ theme }) => darken(0.05, '#ebf4ff')};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, '#ebf4ff')};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, '#ebf4ff')};
    background-color: ${({ theme }) => darken(0.1, '#ebf4ff')};
  }
  &:disabled {
    background-color: ${({ theme }) => '#ebf4ff'};
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonEmpty = styled(Base)`
  border: 1px solid #edeef2;
  background-color: transparent;
  color: black;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, '#edeef2')};
  }
  &:hover {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, '#edeef2')};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, '#edeef2')};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export function ButtonDropwdown({ disabled, children, ...rest }) {
  return (
    <ButtonPrimary {...rest}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonPrimary>
  )
}
