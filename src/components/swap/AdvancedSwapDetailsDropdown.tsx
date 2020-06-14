import React from 'react'
import { animated, useSpring } from 'react-spring'
import styled from 'styled-components'
import useLast from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div`
  padding-top: calc(16px + 2rem);
  padding-bottom: 20px;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;
`

const AnimatedFooter = animated(AdvancedDetailsFooter)

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const style = useSpring({
    from: { transform: 'translateY(-100%)' },
    to: { transform: trade ? 'translateY(0%)' : 'translateY(-100%)' }
  })

  const lastTrade = useLast(trade)

  return (
    <AnimatedFooter style={style}>
      <AdvancedSwapDetails {...rest} trade={lastTrade} />
    </AnimatedFooter>
  )
}
