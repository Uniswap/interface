import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'
import PropTypes from 'prop-types'

export const CardStyled = styled.div.attrs(({ theme, variant, pink }) => ({
  backgroundColor: pink ? lighten(0.3, theme.uniswapPink) : theme.cardBackground,
  border: variant === 'outlined' ? `1px solid ${pink ? theme.uniswapPink : theme.cardBorder}` : 'none'
}))`
  height: 100%
  width: 100%;
  padding: 22px;
  border-radius: 20px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border: ${({ border }) => border};
`

function Card({ children, variant, pink }) {
  return (
    <CardStyled variant={variant} pink={pink}>
      {children}
    </CardStyled>
  )
}

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'outlined']),
  pink: PropTypes.bool
}

Card.defaultProps = {
  variant: 'default',
  pink: false
}

export default Card
