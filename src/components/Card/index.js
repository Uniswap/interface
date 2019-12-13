import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import PropTypes from 'prop-types'

export const CardStyled = styled.div.attrs(({ theme, variant, width, padding, pink }) => ({
  backgroundColor: pink ? lighten(0.3, theme.uniswapPink) : theme.cardBackground,
  border: variant === 'outlined' ? `1px solid ${pink ? theme.uniswapPink : theme.cardBorder}` : 'none',
  padding: padding === 'large' ? '2rem' : '1rem',
  width:  'initial'
}))`
  height: 100%
  width: ${({ border }) => border};
  padding: ${({ padding }) => padding};
  border-radius: 20px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border: ${({ border }) => border};
`

function Card({ children, variant, width, padding, pink, ...rest }) {
  return (
    <CardStyled variant={variant} pink={pink} padding={padding} width={width} {...rest}>
      {children}
    </CardStyled>
  )
}

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'outlined']),
  width: PropTypes.oneOf(['default', 'fit']),
  padding: PropTypes.oneOf(['default', 'large']),
  pink: PropTypes.bool
}

Card.defaultProps = {
  variant: 'default',
  width: 'default',
  padding: 'default',
  pink: false
}

export default Card
