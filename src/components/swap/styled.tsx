import { transparentize } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { css } from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

import { useIsDarkMode } from '../../theme/components/ThemeToggle'
import { AutoColumn } from '../Column'

export const PageWrapper = styled.div`
  padding: 68px 8px 0px;
  max-width: 480px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

// Mostly copied from `AppBody` but it was getting too hard to maintain backwards compatibility.
const SwapWrapperOuter = styled.main<{ isDark?: boolean }>`
  position: relative;
  z-index: ${Z_INDEX.default};
  border: 1px solid ${({ theme }) => theme.surface3};
  transition: transform 250ms ease;
  border-radius: 24px;

  &:before {
    content: ' ';
    display: flex;
    position: absolute;
    inset: 0;
    transform: scale(1.1);
    filter: blur(50px);
    background-color: rgba(252, 114, 255, 0.075);
    z-index: -2;
  }

  &:hover {
    border: 1px solid ${({ theme }) => theme.surface3};
  }
`

export const SwapWrapper = (props: React.ComponentProps<typeof SwapWrapperOuter>) => {
  return (
    <SwapWrapperOuter {...props}>
      <SwapWrapperInner>{props.children}</SwapWrapperInner>
    </SwapWrapperOuter>
  )
}

const SwapWrapperInner = styled.div`
  border-radius: 24px;
  background: ${({ theme }) => theme.surface1};
  z-index: -1;
  padding: 8px;
  padding-top: 12px;
`

export const UniswapPopoverContainer = styled.div`
  padding: 18px;
  color: ${({ theme }) => theme.neutral1};
  font-weight: 485;
  font-size: 12px;
  line-height: 16px;
  word-break: break-word;
  background: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};
  position: relative;
  overflow: hidden;
`

const springDownKeyframes = `@keyframes spring-down {
  0% { transform: translateY(-80px); }
  25% { transform: translateY(4px); }
  50% { transform: translateY(-1px); }
  75% { transform: translateY(0px); }
  100% { transform: translateY(0px); }
}`

const backUpKeyframes = `@keyframes back-up {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-80px); }
}`

export const UniswapXShine = (props: any) => {
  const isDarkMode = useIsDarkMode()
  return <UniswapXShineInner {...props} style={{ opacity: isDarkMode ? 0.15 : 0.05, ...props.style }} />
}

const UniswapXShineInner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(130deg, transparent 20%, ${({ theme }) => theme.accent1}, transparent 80%);
  opacity: 0.15;
`

// overflow hidden to hide the SwapMustacheShadow
export const SwapOptInSmallContainer = styled.div<{ visible: boolean; shouldAnimate: boolean }>`
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  overflow: hidden;
  margin-top: -14px;
  transform: translateY(${({ visible }) => (visible ? 0 : -80)}px);
  transition: all ease 400ms;
  animation: ${({ visible, shouldAnimate }) =>
    !shouldAnimate ? '' : visible ? `spring-down 900ms ease forwards` : 'back-up 200ms ease forwards'};

  ${springDownKeyframes}
  ${backUpKeyframes}
`

export const UniswapXOptInLargeContainerPositioner = styled.div`
  position: absolute;
  top: 211px;
  right: ${-320 - 15}px;
  width: 320px;
  align-items: center;
  min-height: 170px;
  display: flex;
  pointer-events: none;
`

export const UniswapXOptInLargeContainer = styled.div<{ visible: boolean }>`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transform: ${({ visible }) => `translateY(${visible ? 0 : -6}px)`};
  transition: all ease-in 300ms;
  transition-delay: ${({ visible }) => (visible ? '350ms' : '0')};
  pointer-events: ${({ visible }) => (visible ? 'auto' : 'none')};
`

export const SwapMustache = styled.main`
  position: relative;
  background: ${({ theme }) => theme.surface1};
  border-radius: 16px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-top-width: 0;
  padding: 18px;
  padding-top: calc(12px + 18px);
  z-index: 0;
  transition: transform 250ms ease;
`

export const SwapMustacheShadow = styled.main`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 16px;
  height: 100%;
  width: 100%;
  transform: translateY(-100%);
  box-shadow: 0 0 20px 20px ${({ theme }) => theme.surface2};
  background: red;
`

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
  margin-top: 8px;
`
