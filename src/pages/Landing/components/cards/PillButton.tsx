import { motion, MotionProps } from 'framer-motion'
// import { ArrowRight } from 'react-feather'
import styled from 'styled-components'

import { Box } from '../Generics'
import { ArrowRight } from '../Icons'

const Button = styled(motion.button)`
  display: flex;
  padding: 12px 16px;
  border-radius: 24px;
  gap: 8px;
  align-items: center;
  justify-content: center;
  border: 0;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  cursor: pointer;
  flex: none;
`

const Slider = styled(motion.div)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

const Label = styled.span`
  color: ${(props) => props.color};
  /* Button Label/1 */
  font-family: Basel;
  font-size: 20px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px; /* 120% */
  flex: none;
`
type OpacityProps = {
  opacity: number
}

const Opacity = styled(motion.div)<OpacityProps & MotionProps>`
  flex: 0;
  display: flex;
  overflow: visible;
  opacity: ${(props) => props.opacity};
`

type PillButtonProps = {
  label: string
  icon: React.ReactNode
  // @ts-ignore
  color?: any
  onClick?: () => void
}

export function PillButton(props: PillButtonProps) {
  const variants = {
    intial: {
      x: 0,
    },
    hover: {
      x: -24,
    },
  }
  const icnVars = {
    intial: {
      opacity: 1,
    },
    hover: {
      opacity: 0,
    },
  }

  const arrowVars = {
    intial: {
      opacity: 0,
    },
    hover: {
      opacity: 1,
    },
  }

  return (
    <Button whileHover="hover" initial="initial" transition={{ delayChildren: 0 }}>
      <Slider variants={variants}>
        <Opacity opacity={1} variants={icnVars}>
          {props.icon}
        </Opacity>
        <Label color={props.color}>{props.label}</Label>
        <Opacity opacity={0} variants={arrowVars}>
          <Box width="0px" overflow="visible">
            <ArrowRight size="24px" fill={props.color} />
          </Box>
        </Opacity>
      </Slider>
    </Button>
  )
}
