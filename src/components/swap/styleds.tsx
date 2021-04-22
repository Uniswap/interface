import { transparentize } from 'polished'
import React from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components'
import { Text } from 'rebass'
import { AutoColumn } from '../Column'

export const Wrapper = styled.div`
  position: relative;
`

export const ArrowWrapper = styled.div<{ clickable: boolean }>`
  padding: 2px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const SwitchTokensAmountsContainer = styled.div`
  background-image: linear-gradient(180deg, rgba(41, 38, 67, 0) 0%, rgba(68, 65, 99, 0.5) 100%);
  width: 37px;
  height: 37px;
  box-sizing: border-box;
  position: absolute;
  left: 50%;
  top: -16px;
  transform: translateX(-50%);
  z-index: 2;
  border-radius: 50%;
  border: solid 4px ${props => props.theme.dark1};
  cursor: pointer;
  transition: opacity 0.2s ease;
  ::before {
    border-radius: 50%;
    background-color: ${({ theme }) => theme.bg1And2};
    content: '';
    z-index: -1;
    top: 1px;
    left: 1px;
    bottom: 1px;
    right: 1px;
    position: absolute;
  }
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
      : theme.green1};
`

export const StyledBalanceMaxMini = styled.button`
  cursor: pointer;
  outline: none;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.purple3};
  display: flex;
  align-items: center;
  padding: 0;
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  width: 220px;
  overflow: hidden;
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

export function SwapCallbackError({ error }: { error: string }) {
  return (
    <SwapCallbackErrorInner>
      <SwapCallbackErrorInnerAlertTriangle>
        <AlertTriangle size={24} />
      </SwapCallbackErrorInnerAlertTriangle>
      <p>{error}</p>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary1)};
  color: ${({ theme }) => theme.primary1};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`
