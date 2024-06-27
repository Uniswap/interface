import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

import { TickerPosition } from '.'

const PriceContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`
const TickerText = styled(motion.div)<{ $tickerPosition: TickerPosition }>`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => `${props.color}`};
  text-align: ${({ $tickerPosition }) => ($tickerPosition === TickerPosition.RIGHT ? 'left' : 'right')};
`
const TickerContainer = styled(motion.div)<{ $tickerPosition: TickerPosition; size: number }>`
  pointer-events: none;
  position: absolute;
  display: flex;
  flex-direction: row;
  ${({ $tickerPosition, size }) =>
    $tickerPosition === TickerPosition.RIGHT ? `left: ${size * 1.25}px` : `right: ${size * 0.6}px`};
  gap: 20px;
`
const PricePercentChange = styled(motion.div)`
  display: flex;
  flex-direction: row;
  align-items: center;
`
export function Ticker(props: {
  color: string
  pricePercentChange: number
  ticker: string
  tickerPosition: TickerPosition
  size: number
  children?: React.ReactNode
  animate: string
}) {
  const { formatDelta } = useFormatter()
  const priceVariants = {
    rest: { opacity: 0, x: 0 },
    hover: { opacity: 1, x: 8 },
  }
  return (
    <TickerContainer
      initial="rest"
      variants={priceVariants}
      animate={props.animate}
      $tickerPosition={props.tickerPosition}
      size={props.size}
    >
      <PriceContainer>
        <TickerText color={props.color} $tickerPosition={props.tickerPosition}>
          {props.ticker}
        </TickerText>
        <PricePercentChange>
          <DeltaArrow delta={props.pricePercentChange} />
          <ThemedText.BodySecondary>{formatDelta(props.pricePercentChange)}</ThemedText.BodySecondary>
        </PricePercentChange>
      </PriceContainer>
    </TickerContainer>
  )
}
