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
  background-color: ${({ theme }) => theme.blue1};
  color: white;
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.blue1)};
    background-color: ${({ theme }) => darken(0.05, theme.blue1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.blue1)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.blue1)};
    background-color: ${({ theme }) => darken(0.1, theme.blue1)};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text3}
    cursor: auto;
    box-shadow: none;
  }
`

export const ButtonLight = styled(Base)`
  background-color: ${({ theme }) => theme.blue5};
  color: ${({ theme }) => theme.blue1};
  font-size: 20px;
  font-weight: 500;
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && darken(0.05, theme.blue5)};
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, theme.blue5)};
  }
  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, theme.blue5)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && darken(0.1, theme.blue5)};
    background-color: ${({ theme, disabled }) => !disabled && darken(0.1, theme.blue5)};
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
  background-color: ${({ theme }) => theme.pink2};
  color: white;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.pink2)};
    background-color: ${({ theme }) => darken(0.05, theme.pink2)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.pink2)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.pink2)};
    background-color: ${({ theme }) => darken(0.1, theme.pink2)};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.pink2};
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonEmpty = styled(Base)`
  border: 1px solid #edeef2;
  background-color: transparent;
  color: black;

  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.bg3};
  }
  &:hover {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.bg3};
  }
  &:active {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.bg3};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonWhite = styled(Base)`
  border: 1px solid #edeef2;
  background-color: ${({ theme }) => theme.bg1};
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
  background-color: ${({ theme }) => lighten(0.5, theme.green1)};
  border: 1px solid ${({ theme }) => theme.green1};

  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

const ButtonErrorStyle = styled(Base)`
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red1};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.red1)};
    background-color: ${({ theme }) => darken(0.05, theme.red1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.red1)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.red1)};
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
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
    <ButtonPrimary {...rest} disabled={disabled}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonPrimary>
  )
}

export function ButtonDropwdownLight({ disabled = false, children, ...rest }) {
  return (
    <ButtonEmpty {...rest} disabled={disabled}>
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
