import React from 'react'
import styled from 'styled-components'
import { darken, lighten } from 'polished'

import { RowBetween } from '../Row'
import { ChevronDown } from 'react-feather'
import { Button as RebassButton } from 'rebass/styled-components'

const Base = styled(RebassButton)`
  padding: ${({ padding }) => (padding ? padding : '18px')};
  width: ${({ width }) => (width ? width : '100%')};
  font-weight: 500;
  text-align: center;
  border-radius: 20px;
  border-radius: ${({ borderRadius }) => borderRadius && borderRadius};
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
    background-color: ${({ theme }) => theme.outlineGrey};
    color: ${({ theme }) => theme.darkGray}
    cursor: auto;
    box-shadow: none;
  }
`

export const ButtonSecondary = styled(Base)`
  background-color: #ebf4ff;
  color: #2172e5;
  font-size: 16px;
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

export const ButtonPink = styled(Base)`
  background-color: ${({ theme }) => theme.darkPink};
  color: white;

  padding: 10px;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.darkPink)};
    background-color: ${({ theme }) => darken(0.05, theme.darkPink)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.darkPink)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.darkPink)};
    background-color: ${({ theme }) => darken(0.1, theme.darkPink)};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.darkPink};
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

export const ButtonWhite = styled(Base)`
  border: 1px solid #edeef2;
  background-color: ${({ theme }) => theme.panelBackground};
  };
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

const ButtonConfirmedStyle = styled(Base)`
  background-color: ${({ theme }) => lighten(0.5, theme.connectedGreen)};
  border: 1px solid ${({ theme }) => theme.connectedGreen};

  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

const ButtonErrorStyle = styled(Base)`
  background-color: ${({ theme }) => theme.salmonRed};
  border: 1px solid ${({ theme }) => theme.salmonRed};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.salmonRed)};
    background-color: ${({ theme }) => darken(0.05, theme.salmonRed)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.salmonRed)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.salmonRed)};
    background-color: ${({ theme }) => darken(0.1, theme.salmonRed)};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export function ButtonConfirmed({ children, confirmed, ...rest }) {
  if (confirmed) {
    return <ButtonConfirmedStyle {...rest}>{children}</ButtonConfirmedStyle>
  } else {
    return <ButtonPrimary {...rest}>{children}</ButtonPrimary>
  }
}

export function ButtonError({ children, error, ...rest }) {
  if (error) {
    return <ButtonErrorStyle {...rest}>{children}</ButtonErrorStyle>
  } else {
    return <ButtonPrimary {...rest}>{children}</ButtonPrimary>
  }
}

export function ButtonDropwdown({ disabled = false, children, ...rest }) {
  return (
    <ButtonPrimary {...rest}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonPrimary>
  )
}

export function ButtonDropwdownLight({ disabled = false, children, ...rest }) {
  return (
    <ButtonEmpty {...rest}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonEmpty>
  )
}

export function ButtonRadio({ active, children, ...rest }) {
  if (!active) {
    return <ButtonWhite {...rest}>{children}</ButtonWhite>
  } else {
    return <ButtonPrimary {...rest}>{children}</ButtonPrimary>
  }
}
