import React from 'react'
import { Box } from 'rebass/styled-components'

const variants = {
  primary: {
    padding: '1rem',
    borderRadius: '20px',
    backgroundColor: 'grey1',
    border: '1px solid',
    borderColor: 'grey1'
  },
  pink: {
    backgroundColor: 'pink2',
    color: 'pink1'
  },
  yellow: {
    backgroundColor: 'yellow2'
  },
  red: {
    backgroundColor: 'red2'
  }
}

const outlinedStyles = {
  primary: {
    border: '1px solid',
    borderColor: 'blue2'
  },

  pink: {
    border: '1px solid',
    borderColor: 'pink1'
  }
}

const shadowStyles = {
  small: {
    boxShadow: 'small'
  },
  large: {
    boxShadow: 'large'
  }
}

function Card({ children, variant, outlined, shadow, ...rest }) {
  return (
    <Box
      sx={{
        ...variants.primary,
        ...variants[variant],
        ...(shadow && shadowStyles[shadow]),
        ...(outlined && (outlinedStyles[outlined] || outlinedStyles[variant] || outlinedStyles.primary))
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
export default Card
