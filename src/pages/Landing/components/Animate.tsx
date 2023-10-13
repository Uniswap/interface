import { motion } from 'framer-motion'

type RiseInProps = {
  delay?: number
  children?: React.ReactNode
}

export const RiseInText = (props: RiseInProps) => {
  return (
    <motion.span
      initial={{ opacity: 0, rotate: 2, rotateX: -45, y: 100 }}
      animate={{ opacity: 1, rotate: 0, rotateX: 0, y: 0 }}
      transition={{ delay: props.delay, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {props.children}
    </motion.span>
  )
}

export const RiseIn = (props: RiseInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: 2, rotateX: -45, y: 100 }}
      animate={{ opacity: 1, rotate: 0, rotateX: 0, y: 0 }}
      transition={{ delay: props.delay, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
      style={{ flex: 'none', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
    >
      {props.children}
    </motion.div>
  )
}

export const FadeIn = (props: RiseInProps) => {
  return (
    <motion.span
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ delay: props.delay, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {props.children}
    </motion.span>
  )
}

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

type RotateProps = {
  duration?: number
  reverse?: boolean
  children?: React.ReactNode
}

export const Rotate = (props: RotateProps) => {
  return (
    <motion.div
      animate={{
        rotate: props.reverse ? [0, 360] : [0, -360],
      }}
      transition={{
        duration: props.duration,
        repeat: Infinity, // repeat animation forever
        ease: 'linear',
      }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {props.children}
    </motion.div>
  )
}
