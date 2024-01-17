import { motion } from 'framer-motion'
import styled from 'styled-components'

import { Box } from '../Generics'
import { PriceArrowDown, PriceArrowUp, PriceNeutral } from '../Icons'
import { isNegative } from './utils'

const PriceContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`
const TickerText = styled(motion.div)`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => `${props.color}`};
`
const TickerContainer = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  display: flex;
  flex-direction: row;
  gap: 20px;
`
const PricePercentChangeText = styled(motion.div)`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => `${props.color}`};
`

const PricePercentChange = styled(motion.div)`
  display: flex;
  flex-direction: row;
`
export function Ticker(props: {
  color: string
  PricePercentChange: number
  ticker: string
  size: number
  children?: React.ReactNode
  animate: string
}) {
  const priceVariants = {
    rest: { opacity: 0, x: 0 },
    hover: { opacity: 1, x: 8 },
  }
  return (
    <TickerContainer initial="rest" variants={priceVariants} animate={props.animate}>
      <Box flex="none" width={`${props.size}px`} height={`${props.size}px`} />
      <PriceContainer>
        <TickerText color={props.color}>{props.ticker}</TickerText>
        <PricePercentChange>
          {(props.PricePercentChange | 0) === 0 ? (
            <PriceNeutral />
          ) : isNegative(props.PricePercentChange) ? (
            <PriceArrowDown />
          ) : (
            <PriceArrowUp />
          )}
          <PricePercentChangeText>{props.PricePercentChange}</PricePercentChangeText>
        </PricePercentChange>
      </PriceContainer>
    </TickerContainer>
  )
}
