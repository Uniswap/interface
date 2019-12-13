import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import PropTypes from 'prop-types'

const ButtonStyled = styled.button.attrs(({ size, success, width, disabled, theme }) => ({
  backgroundColor: disabled ? theme.disabledButton : success ? `rgba(39, 174, 96, 0.1)` : theme.royalBlue,
  border: success
    ? `1px solid ${theme.connectedGreen};`
    : disabled
    ? `1px solid ${theme.disabledButton};`
    : `1px solid ${theme.royalBlue};`,
  color: disabled ? theme.disabledText : success ? theme.connectedGreen : theme.white,
  borderRadius: size === 'large' ? `20px` : `12px`,
  cursor: disabled || success ? `auto` : `pointer`,
  height: size === 'small' ? `32px` : `58px`,
  width: width === 'fit' ? 'fit-content' : '100%'
}))`
  user-select: none;
  font-size: 16px;
  outline: none;
  font-weight: 600;
  /* width: ${({ width }) => width}; */
  height: ${({ height }) => height};
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
    box-shadow: 0 0 0 1pt ${({ backgroundColor }) => darken(0.3, backgroundColor)};
  }
  }

  :active {
    background-color: ${({ success, disabled, backgroundColor }) =>
      !disabled && !success && darken(0.1, backgroundColor)};
  }
`

export default function Button({ children, size, width, disabled, success, ...rest }) {
  return (
    <ButtonStyled size={size} width={width} disabled={disabled} success={success} {...rest}>
      {children}
    </ButtonStyled>
  )
}

Button.propTypes = {
  size: PropTypes.oneOf(['small', 'large']),
  width: PropTypes.oneOf(['fit', 'full'])
}

Button.defaultProps = {
  size: 'small',
  width: 'fit',
  disabled: false,
  success: false
}
