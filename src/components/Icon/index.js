import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Wrapper = styled.div.attrs(({ theme, variant, fillColor }) => ({
  backgroundColor:
    variant === 'filled' ? (fillColor === 'green' ? theme.connectedGreen : theme.mineshaftGray) : 'transparent'
}))`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  height: ${({ size }) => (size ? size : '32px')};
  width: ${({ size }) => (size ? size : '32px')};
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 12px;
`

export const IconStyled = styled.img.attrs(({ theme, variant }) => ({}))``

function Icon({ children, variant, fillColor, icon, size, ...rest }) {
  return (
    <Wrapper size={size} variant={variant} fillColor={fillColor}>
      {children ? children : <IconStyled src={icon} alt="Icon" />}
    </Wrapper>
  )
}

Icon.propTypes = {
  variant: PropTypes.oneOf(['default', 'filled']),
  fillColor: PropTypes.oneOf(['default', 'green'])
}

Icon.defaultProps = {
  variant: 'default'
}

export default Icon
