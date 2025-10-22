import { transparentize } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { css } from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

import { useIsDarkMode } from '../../theme/components/ThemeToggle'
import { AutoColumn } from '../Column'
import meshSrc from '../About/images/Mesh.png'

export const PageWrapper = styled.div`
  position: relative;
  padding: 68px 8px 0px;
  max-width: 520px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
    max-width: 480px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
    max-width: 100%;
  }
`

// Gradient background for swap page
export const SwapGradientBackground = styled.div<{ isDarkMode: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  z-index: -2;
  pointer-events: none;
  ${({ isDarkMode }) =>
    isDarkMode
      ? css`
          background: linear-gradient(rgba(8, 10, 24, 0) 0%, rgb(8 10 24 / 100%) 45%);
        `
      : css`
          background: linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255 255 255 /100%) 45%);
        `};
`

// Glow effect behind swap card
export const SwapGlowContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
`

export const SwapGlow = styled.div`
  position: absolute;
  top: 100px;
  border-radius: 50%;
  max-width: 700px;
  width: 100%;
  height: 700px;
  animation: pulse 4s ease-in-out infinite;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  /* Blurred gradient layer */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(101.8% 4091.31% at 0% 0%, #E81899 0%, #FC72FF 100%);
    border-radius: 50%;
    filter: blur(150px);
    opacity: 0.7;
  }

  /* Mesh texture overlay (not blurred) */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url(${meshSrc});
    border-radius: 50%;
    opacity: 0.5;
    mix-blend-mode: overlay;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1) translateZ(0);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05) translateZ(0);
    }
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 500px;
    height: 500px;

    &::before {
      filter: blur(100px);
    }
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 350px;
    height: 350px;

    &::before {
      filter: blur(80px);
    }
  }
`

// Mostly copied from `AppBody` but it was getting too hard to maintain backwards compatibility.
const SwapWrapperOuter = styled.main<{ isDark?: boolean }>`
  position: relative;
  width: 100%;
  max-width: 480px;
  z-index: ${Z_INDEX.default};
  border: 1px solid ${({ theme, isDark }) => (isDark ? 'rgba(232, 24, 153, 0.3)' : theme.surface3)};
  transition: all 250ms ease;
  border-radius: 24px;
  box-shadow: ${({ isDark }) =>
    isDark
      ? '0 0 40px rgba(232, 24, 153, 0.2), 0 0 80px rgba(252, 114, 255, 0.15)'
      : '0 4px 12px rgba(0, 0, 0, 0.05)'};

  &:before {
    content: ' ';
    display: flex;
    position: absolute;
    inset: 0;
    transform: scale(1.1);
    filter: blur(50px);
    background: ${({ isDark }) =>
      isDark
        ? 'radial-gradient(circle at center, rgba(232, 24, 153, 0.15), rgba(252, 114, 255, 0.08))'
        : 'rgba(252, 114, 255, 0.075)'};
    z-index: -2;
  }

  &:hover {
    border: 1px solid ${({ theme, isDark }) => (isDark ? 'rgba(232, 24, 153, 0.5)' : theme.surface3)};
    box-shadow: ${({ isDark }) =>
      isDark
        ? '0 0 50px rgba(232, 24, 153, 0.25), 0 0 100px rgba(252, 114, 255, 0.2)'
        : '0 4px 16px rgba(0, 0, 0, 0.08)'};
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
