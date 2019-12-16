import React from 'react'
import { Box } from 'rebass/styled-components'


function Card({ children, variant, ...rest }) {
  const variants = {}

  variants.primary = {
    padding: '1rem',
    borderRadius: '20px',
    backgroundColor: 'grey4',
  }

  variants.outlined = {
    ...variants.primary,
    border: '1px solid',
    borderColor: 'blue5'
  }

  variants.pink = {
    ...variants.primary,
    backgroundColor: 'pink2',
    color: 'pink1',
  }

  variants.pinkOutlined = {
    ...variants.primary,
    ...variants.outlined,
    ...variants.pink,
    borderColor: 'pink1'
  }
  

  return (
    <Box sx={variants[variant] || variants.primary} {...rest}>
      {children}
    </Box>
  )
}

export default Card
