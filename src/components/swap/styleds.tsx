import { loadingOpacityMixin } from 'components/Loader/styled'
import { TooltipContainer } from 'components/Tooltip'
import { transparentize } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import TradePrice from './TradePrice'

export const Wrapper = styled.div`
  position: relative;
  padding: 8px;
`

export const ArrowWrapper = styled.div<{ clickable: boolean; redesignFlag: boolean }>`
  padding: 4px;
  border-radius: 12px;
  height: ${({ redesignFlag }) => (redesignFlag ? '40px' : '32px')};
  width: ${({ redesignFlag }) => (redesignFlag ? '40px' : '32px')};
  position: relative;
  margin-top: -14px;
  margin-bottom: ${({ redesignFlag }) => (redesignFlag ? '-18px' : '-14px')};
  left: calc(50% - 16px);
  /* transform: rotate(90deg); */
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundSurface : theme.deprecated_bg1)};
  border: 4px solid;
  border-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.backgroundModule : theme.deprecated_bg0)};

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

export const TransactionDetailsLabel = styled(ThemedText.DeprecatedBlack)`
  border-bottom: 1px solid ${({ theme }) => theme.deprecated_bg2};
  padding-bottom: 0.5rem;
`

export const ResponsiveTooltipContainer = styled(TooltipContainer)<{ origin?: string; width?: string }>`
  background-color: ${({ theme }) => theme.deprecated_bg0};
  border: 1px solid ${({ theme }) => theme.deprecated_bg2};
  padding: 1rem;
  width: ${({ width }) => width ?? 'auto'};

  ${({ theme, origin }) => theme.mediaWidth.upToExtraSmall`
    transform: scale(0.8);
    transform-origin: ${origin ?? 'top left'};
  `}
`

export const StyledTradePrice = styled(TradePrice)<{ $loading: boolean }>`
  ${loadingOpacityMixin}
`
