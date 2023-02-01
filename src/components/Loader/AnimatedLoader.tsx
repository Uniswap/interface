import styled, { keyframes } from 'styled-components'

import LoadingLogo from 'assets/svg/kyber_logo.svg'

const loadingAnimation = keyframes`
  0% { transform: rotate(0deg) }
  50% { transform: rotate(180deg) }
  100% { transform: rotate(360deg) }
`

const Wrapper = styled.div<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  display: inline-block;
  overflow: hidden;
  background: transparent;
`

const Inner = styled.div<{ size: number }>`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0; /* see note above */
  > div {
    position: absolute;
    animation: ${loadingAnimation} 1s linear infinite;
    width: ${({ size }) => size * 0.8}px;
    height: ${({ size }) => size * 0.8}px;
    top: ${({ size }) => size * 0.1}px;
    left: ${({ size }) => size * 0.1}px;
    border-radius: 50%;
    box-shadow: 0 ${({ size }) => (size >= 200 ? '3px' : '2px')} 0 0 ${({ theme }) => theme.primary};
    transform-origin: ${({ size }) => `${size * 0.4}px ${size * 0.41}px`};
    box-sizing: content-box;
  }
`

function AnimateLoader({ size = 160 }: { size?: number }) {
  return (
    <Wrapper size={size}>
      <Inner size={size}>
        <div />
        <div />
        <img src={LoadingLogo} width="30%" alt="" />
      </Inner>
    </Wrapper>
  )
}

export default AnimateLoader
