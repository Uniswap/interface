import { transparentize } from 'polished'
import { ReactNode } from 'react'

import { AlertTriangle } from 'react-feather'
import styled, { css, keyframes } from 'styled-components/macro'
import { Text } from 'rebass'
import { AutoColumn } from '../Column'
import { TYPE } from 'theme'

export const Wrapper = styled.div`
  position: relative;
  padding: 8px;
`

export const ArrowWrapper = styled.div<{ clickable: boolean }>`
  padding: 4px;
  border-radius: 12px;
  height: 32px;
  width: 32px;
  position: relative;
  margin-top: -14px;
  margin-bottom: -14px;
  left: calc(50% - 16px);
  /* transform: rotate(90deg); */
  background-color: ${({ theme }) => theme.bg1};
  border: 4px solid ${({ theme }) => theme.bg0};
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
  background-color: ${({ theme }) => theme.bg3};
`

export const ErrorText = styled(Text)<{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.red1
      : severity === 2
      ? theme.yellow2
      : severity === 1
      ? theme.text1
      : theme.text2};
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
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  padding: 3rem 1.25rem 1rem 1rem;
  margin-top: -2rem;
  color: ${({ theme }) => theme.red1};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

const SwapCallbackErrorInnerAlertTriangle = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
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
  background-color: ${({ theme }) => transparentize(0.95, theme.primary3)};
  color: ${({ theme }) => theme.primaryText1};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`

export const AdvancedSwapDetailsContainer = styled(AutoColumn)<{ dim: boolean }>`
  padding: 0 0.5rem 0.5rem 0.5rem;
  position: relative;

  opacity: ${({ dim }) => (dim ? '0.5' : '1')};
  filter: ${({ dim }) => (dim ? 'grayscale(100%)' : '')};
  transition: opacity 0.2s ease, filter 0.2s ease;
  will-change: opacity filter;
`

const pulse = keyframes`
  0% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.1;
  }
`

export const DimmableText = styled(TYPE.black)<{ dim: boolean }>`
  color: ${({ theme, dim }) => (dim ? 'transparent' : theme.text1)};
  background-color: ${({ theme, dim }) => (dim ? theme.text2 : 'transparent')};
  opacity: 1;

  animation: ${pulse} infinite ease-in-out;
  animation-duration: ${({ dim }) => (dim ? '1s' : '0')};
`

export const LoadingPlaceholder = styled.div<{ width: number }>`
  height: 15px;
  width: ${({ width }) => `${width}px`};
  opacity: 1;
  animation: ${pulse} 1s infinite ease-in-out;
  background-color: ${({ theme }) => theme.text2};
`

export const RoutingDiagramWrapper = styled(AutoColumn)`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  border-bottom: 1px solid ${({ theme }) => theme.bg2};

  width: 100%;
  padding: 0.5rem 0;
`
