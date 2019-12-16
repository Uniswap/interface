import React from 'react'
import { Button as RebassButton } from 'rebass/styled-components'


export default function Button({ children, variant, ...rest }) {

  const variants = {}
  
  variants.primary = {
    padding: '8px 12px',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    backgroundColor: 'blue1',
    color: 'white',
    cursor: 'pointer',
    outline: 'none',
    ':hover,:focus': {
      backgroundColor: 'blue2',
    },
    ':focus': {
      boxShadow: '0 0 0 1pt #2D47A6' 
    },
    ':active': {
      backgroundColor: 'blue3'
    },
    ':disabled': {
      backgroundColor: 'grey2',
      color: 'grey3',
      cursor: 'auto'
    }
  }

  // handled with disabled attribute set below
  variants.disabled =  {
    ...variants.primary,
  }

  variants.success = {
    ...variants.primary,
    border: '1px solid',
    borderColor: 'green2',
    color: 'green2',
    backgroundColor: 'green1',
    '&:hover, :focus, :active': {
      backgroundColor: "green1",
      cursor: 'auto',
      boxShadow: 'none'
    }
  } 
  

  return (
    <RebassButton sx={variants[variant] || variants.primary} disabled={variant === 'disabled'} {...rest}>
      {children}
    </RebassButton>
  )
}
