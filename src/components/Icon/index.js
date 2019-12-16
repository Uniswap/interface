import React from 'react'
import { Box } from 'rebass/styled-components'


function Icon({ children, variant, icon, fillColor, size = '32px', ...rest }) {

  let variants = {}
  variants.primary = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    height: size,
    width: size,
    borderRadius: '12px'
  }

  variants.filled = {
    ...variants.primary,
    backgroundColor: fillColor
  }

  return (
    <Box  sx={variants[variant] || variants.primary} {...rest}>
      {children ? children : <img src={icon} alt="Icon" />}
    </Box>
  )
}

export default Icon
