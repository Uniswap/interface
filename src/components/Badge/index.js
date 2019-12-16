import React from 'react'
import { Box } from 'rebass/styled-components'

function Badge({ children, variant, ...rest }) {

  let variants = {}

  variants.primary = {
    padding: '4px 12px',
    borderRadius: '12px',
    width: 'fit-content',
  }

  variants.green = {
    ...variants.primary,
    backgroundColor: 'green1',
    color: 'green2'
  }

  variants.yellow = {
    ...variants.primary,
    backgroundColor: 'yellow2',
    color: 'yellow1'
  }
  
  return <Box sx={variants[variant] || variants.primary} {...rest}>{children}</Box>
}

export default Badge
