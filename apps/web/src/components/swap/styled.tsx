import { AutoColumn } from 'components/deprecated/Column'
import styled, { css } from 'lib/styled-components'
import { transparentize } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { Flex, styled as TamaguiStyled } from 'ui/src'

export const PageWrapper = TamaguiStyled(Flex, {
  pt: '$spacing60',
  px: '$spacing8',
  pb: '$spacing40',
  width: '100%',
  maxWidth: 480,
  $lg: {
    pt: '$spacing48',
  },
  $md: {
    pt: '$spacing20',
  },
})

export const ArrowWrapper = styled.div<{ clickable: boolean }>`
  border-radius: 12px;
  height: 40px;
  width: 40px;
  position: relative;
  margin-top: -18px;
  margin-bottom: -18px;
  margin-left: auto;
  margin-right: auto;
  background-color: ${({ theme }) => theme.surface2};
  border: 4px solid;
  border-color: ${({ theme }) => theme.surface1};

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
  background-color: ${({ theme }) => transparentize(0.9, theme.critical)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  padding: 3rem 1.25rem 1rem 1rem;
  margin-top: -2rem;
  color: ${({ theme }) => theme.critical};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 535;
  }
`

const SwapCallbackErrorInnerAlertTriangle = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.critical)};
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
  background-color: ${({ theme }) => transparentize(0.95, theme.accent1)};
  color: ${({ theme }) => theme.accent1};
  padding: 12px;
  border-radius: 12px;
`

export const SwapSection = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  height: 120px;
  line-height: 20px;
  padding: 16px;
  position: relative;
  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.surface2};
  }
  &:hover:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }
  &:focus-within:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
  }
`

export const ArrowContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`
