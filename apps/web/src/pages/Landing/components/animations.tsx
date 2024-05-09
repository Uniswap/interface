import { motion } from 'framer-motion'
import styled, { css, keyframes } from 'styled-components'

const riseInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateY(100px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
`

const RiseInStyles = css<{ count?: number; delay?: number }>`
  opacity: 0;
  animation-name: ${riseInAnimation};
  animation-fill-mode: forwards;
  animation-duration: 1000ms;
  animation-iteration-count: 1;
  animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  animation-delay: ${(props) => 1000 * (props.delay ?? 0)}ms;
`

export const RiseInText = styled.span<{ delay?: number }>`
  display: inline-flex;
  ${RiseInStyles}
`

export const RiseIn = styled.span<{ delay?: number }>`
  display: flex;
  width: 100%;
  flex: none;
  justify-content: center;
  pointer-events: none;
  ${RiseInStyles}
`

const hoverAnimation = keyframes`
 0% { transform: translateY(-4px); opacity: 0.5; }
 50% { transform: translateY(4px); opacity: 1; }
 100% { transform: translateY(-4px); opacity: 0.5; }
`

export const Hover = styled.div`
  position: relative;
  display: inline-block;
  animation-name: ${hoverAnimation};
  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
`

export function Wiggle({ ...props }) {
  const variants = {
    initial: { rotate: 0, scale: 1 },
    animate: { rotate: [20, 0], scale: 1.2, transition: { type: 'spring', stiffness: 200 } },
  }
  return <motion.div {...props} whileHover="animate" initial="initial" variants={variants} />
}
