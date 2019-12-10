import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

const ButtonStyled = styled.button.attrs(({ small, success, disabled, theme }) => ({
  backgroundColor: disabled
    ? theme.disabledButton
    : success && !small
    ? `rgba(39, 174, 96, 0.1)`
    : success && small
    ? theme.connectedGreen
    : theme.royalBlue,
  border: success && !disabled ? `1px solid ${theme.connectedGreen};` : `none`,
  color: disabled ? theme.disabledText : success && !small ? theme.connectedGreen : theme.white,
  borderRadius: small ? `12px` : `20px`,
  cursor: disabled || success ? `auto` : `pointer`,
  padding: small ? `8px 0` : `18px 0`,
  width: '100%'
}))`
  user-select: none;
  font-size: 1rem;
  outline: none;
  font-weight: 600;
  width: ${({ width }) => width};
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ color }) => color};
  cursor: ${({ cursor }) => cursor};
  &:hover,
  &:focus {
    background-color: ${({ success, disabled, backgroundColor }) =>
      !disabled && !success && darken(0.05, backgroundColor)};
  }

  &:focus {
    box-shadow: 0 0 0 1pt #165bbb;
  }

  :active {
    background-color: ${({ success, disabled, backgroundColor }) =>
      !disabled && !success && darken(0.1, backgroundColor)};
  }
`

export default function Button({ children, small, disabled, success, loading, loadingText, confirmationText }) {
  return (
    <ButtonStyled small={small} disabled={disabled} success={success}>
      {success && confirmationText ? confirmationText : loading ? loadingText : children}
    </ButtonStyled>
  )
}
