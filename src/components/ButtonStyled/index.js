import React from 'react'
import { Button as RebassButton } from 'rebass/styled-components'
import styled from 'styled-components'
import { ChevronDown } from 'react-feather'

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

const Dull = styled(Base)`
  background-color: ${({ theme }) => theme.colors.grey2};
  border-color: ${({ theme }) => theme.colors.grey2};
  color: black;
  &:hover,
  :focus {
    background-color: ${({ theme }) => theme.colors.grey3};
    border-color: ${({ theme }) => theme.colors.grey3};
  }
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.colors.grey4};
  }
  &:active {
    background-color: ${({ theme }) => theme.colors.grey3};
    border-color: ${({ theme }) => theme.colors.grey3};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.grey2};
    color: ${({ theme }) => theme.colors.grey3};
    cursor: auto;
    border-color: ${({ theme }) => theme.colors.grey2};
  }
`

export default function ButtonStyled({ children, ...rest }) {
  return <Base {...rest}>{children}</Base>
}

export function ButtonStyledSecondary({ children, ...rest }) {
  return <Secondary {...rest}>{children}</Secondary>
}

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

export function ButtonDropwdown({ disabled, children, ...rest }) {
  return (
    <Base {...rest}>
      <ContentWrapper>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </ContentWrapper>
    </Base>
  )
}

export function ButtonDropwdownSecondary({ disabled, children, ...rest }) {
  return (
    <Secondary {...rest}>
      <ContentWrapper>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </ContentWrapper>
    </Secondary>
  )
}

export function ButtonDropwdownDull({ disabled, children, ...rest }) {
  return (
    <Dull {...rest}>
      <ContentWrapper>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </ContentWrapper>
    </Dull>
  )
}
