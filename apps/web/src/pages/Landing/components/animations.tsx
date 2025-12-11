import { motion } from 'framer-motion'
import { css, deprecatedStyled, keyframes } from 'lib/styled-components'

type RiseInProps = {
  delay?: number
  children?: React.ReactNode
}

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

export const RiseInText = deprecatedStyled.span<{ delay?: number }>`
  display: inline-flex;
  ${RiseInStyles}
`

export const RiseIn = deprecatedStyled.span<{ delay?: number }>`
  display: flex;
  width: 100%;
  flex: none;
  justify-content: center;
  pointer-events: none;
  ${RiseInStyles}
`

export const Hover = (props: RiseInProps) => {
  return (
    <motion.div
      animate={{
        y: ['-4px', '4px', '-4px'],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity, // repeat animation forever
        ease: 'easeInOut',
      }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {props.children}
    </motion.div>
  )
}
