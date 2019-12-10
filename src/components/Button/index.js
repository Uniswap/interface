import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import PropTypes from 'prop-types'

const ButtonStyled = styled.button.attrs(({ size, success, disabled, theme }) => ({
  backgroundColor: disabled ? theme.disabledButton : success ? `rgba(39, 174, 96, 0.1)` : theme.royalBlue,
  border: success && !disabled ? `1px solid ${theme.connectedGreen};` : `none`,
  color: disabled ? theme.disabledText : success ? theme.connectedGreen : theme.white,
  borderRadius: size === 'small' ? `12px` : `20px`,
  cursor: disabled || success ? `auto` : `pointer`,
  padding: size === 'small' ? `8px 0` : `18px 0`,
  width: size === 'small' ? '90px' : size === 'large' ? '256px' : '100%'
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

export default function Button({ children, size, disabled, success }) {
  return (
    <ButtonStyled size={size} disabled={disabled} success={success}>
      {children}
    </ButtonStyled>
  )
}

Button.propTypes = {
  size: PropTypes.oneOf(['small', 'large', 'full'])
}

Button.defaultProps = {
  size: 'full',
  disabled: false,
  success: false
}
