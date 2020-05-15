import React, { HTMLProps, useCallback } from 'react'
import ReactGA from 'react-ga'
import styled, { keyframes } from 'styled-components'
import { darken } from 'polished'
import { X } from 'react-feather'

export const Button = styled.button.attrs<{ warning: boolean }, { backgroundColor: string }>(({ warning, theme }) => ({
  backgroundColor: warning ? theme.red1 : theme.primary1
}))`
  padding: 1rem 2rem 1rem 2rem;
  border-radius: 3rem;
  cursor: pointer;
  user-select: none;
  font-size: 1rem;
  border: none;
  outline: none;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ theme }) => theme.white};
  width: 100%;

  :hover,
  :focus {
    background-color: ${({ backgroundColor }) => darken(0.05, backgroundColor)};
  }

  :active {
    background-color: ${({ backgroundColor }) => darken(0.1, backgroundColor)};
  }

  :disabled {
    background-color: ${({ theme }) => theme.bg1};
    color: ${({ theme }) => theme.text4};
    cursor: auto;
  }
`

export const CloseIcon = styled(X)<{ onClick: () => void }>`
  cursor: pointer;
`

const StyledLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary1};
  font-weight: 500;

  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Link({ onClick, as, ref, target, href, rel, ...rest }: HTMLProps<HTMLAnchorElement>) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick && onClick(event) // first call back into the original onClick
      if (!href) return
      event.preventDefault()
      // send a ReactGA event and then trigger a location change
      ReactGA.outboundLink({ label: href }, () => {
        window.location.href = href
      })
    },
    [href, onClick]
  )
  return (
    <StyledLink
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      href={href}
      onClick={handleClick}
      {...rest}
    />
  )
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.img`
  animation: 2s ${rotate} linear infinite;
  width: 16px;
  height: 16px;
`

export const Hover = styled.div`
  :hover {
    cursor: pointer;
  }
`
