import { darken } from 'polished'
import React, { HTMLProps, useCallback } from 'react'
import { ArrowLeft, ExternalLink as LinkIconFeather, X } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, keyframes } from 'styled-components'

export const ButtonText = styled.button`
  outline: none;
  border: none;
  font-size: inherit;
  padding: 0;
  margin: 0;
  background: none;
  cursor: pointer;

  :hover {
    opacity: 0.7;
  }
`

export const Button = styled.button.attrs<{ warning: boolean }, { backgroundColor: string }>(({ warning, theme }) => ({
  backgroundColor: warning ? theme.red1 : theme.primary,
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
    background-color: ${({ theme }) => theme.buttonGray};
    color: ${({ theme }) => theme.text2} !important;
    cursor: auto;
  }
`

export const CloseIcon = styled(X)<{ onClick: () => void }>`
  cursor: pointer;
`

// for wrapper react feather icons
export const IconWrapper = styled.div<{ stroke?: string; size?: string; marginRight?: string; marginLeft?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size ?? '20px'};
  height: ${({ size }) => size ?? '20px'};
  margin-right: ${({ marginRight }) => marginRight ?? 0};
  margin-left: ${({ marginLeft }) => marginLeft ?? 0};
  & > * {
    stroke: ${({ theme, stroke }) => stroke ?? theme.blue1};
  }
`

// A button that triggers some onClick result, but looks like a link.
export const LinkStyledButton = styled.button<{ disabled?: boolean }>`
  border: none;
  text-decoration: none;
  background: none;

  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  color: ${({ theme, disabled }) => (disabled ? theme.text2 : theme.primary)};
  font-weight: 500;

  :hover {
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :focus {
    outline: none;
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :active {
    text-decoration: none;
  }
`

// An internal link from the react-router-dom library that is correctly styled
export const StyledInternalLink = styled(Link)`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary};
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

export const ExternalLinkNoLineHeight = styled(ExternalLink)`
  line-height: 0;
`

const StyledLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary};
  font-weight: 500;

  @media (hover: hover) {
    :hover {
      text-decoration: underline;
    }
  }

  :focus {
    outline: none;
  }

  :active {
    text-decoration: none;
  }
`

const LinkIconWrapper = styled.a`
  text-decoration: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;

  :hover {
    text-decoration: none;
    opacity: 0.7;
  }

  :focus {
    outline: none;
    text-decoration: none;
  }

  :active {
    text-decoration: none;
  }
`

export const LinkIcon = styled(LinkIconFeather)<{ color?: string }>`
  height: 16px;
  width: 18px;
  stroke: ${({ theme, color }) => color || theme.primary};
`

/**
 * Outbound link that handles firing google analytics events
 */
export function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  onClick,
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick && onClick(event)
      // don't prevent default, don't redirect if it's a new tab
      if (target === '_blank' || event.ctrlKey || event.metaKey) {
      } else {
        event.preventDefault()
      }
    },
    [target, onClick],
  )
  return <StyledLink target={target} rel={rel} href={href} onClick={handleClick} {...rest} />
}

export function ExternalLinkIcon({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  color,
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref' | 'onClick'> & { href: string; color?: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // don't prevent default, don't redirect if it's a new tab
      if (target === '_blank' || event.ctrlKey || event.metaKey) {
        console.debug('Fired outbound link event', href)
      } else {
        event.preventDefault()

        window.location.href = href
      }
    },
    [href, target],
  )
  return (
    <LinkIconWrapper target={target} rel={rel} href={href} onClick={handleClick} {...rest}>
      <LinkIcon color={color} />
    </LinkIconWrapper>
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

const BackArrowLink = styled(StyledInternalLink)`
  color: ${({ theme }) => theme.text};
`
export function BackArrow({ to }: { to: string }) {
  return (
    <BackArrowLink to={to}>
      <ArrowLeft />
    </BackArrowLink>
  )
}

export const CustomLightSpinner = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export const HideMedium = styled.span`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    ${css`
      display: none;
    `}
  `};
`

export const MediumOnly = styled.span`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    ${css`
      display: block;
    `}
  `};
`

export const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

export const HideExtraSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

export const SmallOnly = styled.span`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
  `};
`

export const ExtraSmallOnly = styled.span`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: block;
  `};
`

export const UppercaseText = styled.span`
  text-transform: uppercase;
`
