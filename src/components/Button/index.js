import React from 'react'
import { Button as RebassButton } from 'rebass/styled-components'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

const variants = {
  primary: {
    padding: '8px 12px',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    backgroundColor: 'blue5',
    color: 'white',
    cursor: 'pointer',
    outline: 'none',
    border: '1px solid',
    borderColor: 'blue5',
    ':hover,:focus': {
      backgroundColor: 'blue6',
      borderColor: 'blue6'
    },
    ':focus': {
      boxShadow: '0 0 0 1pt #2D47A6'
    },
    ':active': {
      backgroundColor: 'blue7',
      borderColor: 'blue7'
    },
    ':disabled': {
      backgroundColor: 'grey2',
      color: 'grey3',
      cursor: 'auto',
      borderColor: 'grey2'
    }
  },

  secondary: {
    backgroundColor: 'none',
    border: '1px solid',
    borderColor: 'blue5',
    color: 'blue5',
    ':hover': {
      backgroundColor: 'grey1'
    },
    ':active, :focus': {
      backgroundColor: 'grey1'
    },
    ':disabled': {
      opacity: 0.5,
      backgroundColor: 'transparent',
      cursor: 'auto'
    }
  },

  dull: {
    color: 'grey8',
    borderColor: 'grey2',
    backgroundColor: 'grey2',
    ':hover, :active': {
      backgroundColor: 'grey3',
      borderColor: 'grey3',
      boxShadow: 'none'
    },
    ':focus': {
      backgroundColor: 'grey3',
      borderColor: 'grey3',
      boxShadow: 'none'
    }
  },

  hollow: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'grey8',
    ':hover, :active': {
      backgroundColor: 'transparent'
    },
    ':focus': {
      backgroundColor: 'grey1'
    }
  },

  success: {
    border: '1px solid',
    borderColor: 'green2',
    color: 'green2',
    backgroundColor: 'green1',
    ':hover, :focus, :active': {
      backgroundColor: 'green1',
      cursor: 'auto',
      boxShadow: 'none',
      borderColor: 'green2'
    },
    ':disabled': {
      backgroundColor: 'green1',
      cursor: 'auto',
      boxShadow: 'none',
      borderColor: 'green2'
    }
  }
}

const roundedStyles = {
  borderRadius: '20px'
}

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

export default function Button({ disabled, children, variant, rounded, ...rest }) {
  return (
    <RebassButton
      sx={{ ...variants.primary, ...variants[variant], ...(rounded && roundedStyles) }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </RebassButton>
  )
}

export function ButtonDropwdown({ disabled, children, variant, rounded, ...rest }) {
  return (
    <RebassButton
      sx={{ ...variants.primary, ...variants[variant], ...(rounded && roundedStyles) }}
      disabled={disabled}
      {...rest}
    >
      <ContentWrapper>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </ContentWrapper>
    </RebassButton>
  )
}
