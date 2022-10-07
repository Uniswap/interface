import { TooltipContainer } from 'components/Tooltip'
import { transparentize } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { AutoColumn } from '../Column'

export const PageWrapper = styled.div<{ redesignFlag: boolean; navBarFlag: boolean }>`
  padding: ${({ navBarFlag }) => (navBarFlag ? '68px 8px 0px' : '0px 8px')};
  max-width: 480px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: ${({ navBarFlag }) => (navBarFlag ? '48px' : '0px')};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: ${({ navBarFlag }) => (navBarFlag ? '20px' : '0px')};
  }
`

// Mostly copied from `AppBody` but it was getting too hard to maintain backwards compatibility.
export const SwapWrapper = styled.main<{ margin?: string; maxWidth?: string; redesignFlag: boolean }>`
  position: relative;
  background: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundSurface : theme.deprecated_bg0)};
  border-radius: ${({ redesignFlag }) => (redesignFlag ? '16px' : '24px')};
  border: 1px solid ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundOutline : 'transparent')};
  padding: 8px;
  z-index: ${Z_INDEX.deprecated_content};
  box-shadow: ${({ redesignFlag }) =>
    !redesignFlag &&
    '0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.01)'};
`

export const ArrowWrapper = styled.div<{ clickable: boolean; redesignFlag: boolean }>`
  border-radius: 12px;
  height: ${({ redesignFlag }) => (redesignFlag ? '40px' : '32px')};
  width: ${({ redesignFlag }) => (redesignFlag ? '40px' : '32px')};
  position: relative;
  margin-top: ${({ redesignFlag }) => (redesignFlag ? '-18px' : '-14px')};
  margin-bottom: ${({ redesignFlag }) => (redesignFlag ? '-18px' : '-14px')};
  margin-left: auto;
  margin-right: auto;
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundInteractive : theme.deprecated_bg1)};
  border: 4px solid;
  border-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundSurface : theme.deprecated_bg0)};

  z-index: 2;
  ${({ clickable }) =>
    clickable
      ? css`
          :hover {
            cursor: pointer;
            opacity: 0.8;
          }
        `
      : null}
`

export const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.deprecated_bg3};
`

export const ErrorText = styled(Text)<{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.deprecated_red1
      : severity === 2
      ? theme.deprecated_yellow2
      : severity === 1
      ? theme.deprecated_text1
      : theme.deprecated_text2};
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  max-width: 220px;
  overflow: hidden;
  text-align: right;
`

// styles
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const SwapCallbackErrorInner = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.deprecated_red1)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  padding: 3rem 1.25rem 1rem 1rem;
  margin-top: -2rem;
  color: ${({ theme }) => theme.deprecated_red1};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

const SwapCallbackErrorInnerAlertTriangle = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.deprecated_red1)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  border-radius: 12px;
  min-width: 48px;
  height: 48px;
`

export function SwapCallbackError({ error }: { error: ReactNode }) {
  return (
    <SwapCallbackErrorInner>
      <SwapCallbackErrorInnerAlertTriangle>
        <AlertTriangle size={24} />
      </SwapCallbackErrorInnerAlertTriangle>
      <p style={{ wordBreak: 'break-word' }}>{error}</p>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.95, theme.deprecated_primary3)};
  color: ${({ theme }) => theme.deprecated_primaryText1};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`

export const ResponsiveTooltipContainer = styled(TooltipContainer)<{ origin?: string; width?: string }>`
  background-color: ${({ theme }) => theme.deprecated_bg0};
  border: 1px solid ${({ theme }) => theme.deprecated_bg2};
  padding: 1rem;
  width: ${({ width }) => width ?? 'auto'};

  ${({ theme, origin }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    transform: scale(0.8);
    transform-origin: ${origin ?? 'top left'};
  `}
`
