import React from 'react'
import { Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components'

const Base = styled(RebassButton)`
  padding: 8px 12px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.blue5};
  color: white;
  cursor: pointer;
  outline: none;
  border: 1px solid;
  border-color: ${({ theme }) => theme.colors.blue5};
  &:hover,
  :focus {
    background-color: ${({ theme }) => theme.colors.blue6};
    border-color: ${({ theme }) => theme.colors.blue6};
  }
  &:focus {
    box-shadow: 0 0 0 1pt #2d47a6;
  }
  &:active {
    background-color: ${({ theme }) => theme.colors.blue7};
    border-color: ${({ theme }) => theme.colors.blue7};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.grey2};
    color: ${({ theme }) => theme.colors.grey3};
    cursor: auto;
    border-color: ${({ theme }) => theme.colors.grey2};
  }
`

const Secondary = styled(Base)`
  background-color: transparent;
  border-color: ${({ theme }) => theme.colors.blue5};
  color: ${({ theme }) => theme.colors.blue5};

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey1};
  }
  &:active, :focus {
    background-color: ${({ theme }) => theme.colors.grey1}
  }
  &:disabled {
    opacity: 0.5,
    background-color: transparent,
    cursor: 'auto'
  }
`

export default function ButtonStyled({ children, ...rest }) {
  return <Base {...rest}>{children}</Base>
}

export function ButtonStyledSecondary({ children, ...rest }) {
  return <Secondary {...rest}>{children}</Secondary>
}
