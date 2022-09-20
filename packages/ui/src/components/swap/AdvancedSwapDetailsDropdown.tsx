import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean; display?: boolean }>`
  // padding-top: calc(16px + 2rem);
  // padding-bottom: 16px;
  // margin-top: -2rem;
  width: 100%;
  // max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  // z-index: -1;
  display: ${({ display }) => (display ? 'block' : 'none')}
transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)
  const [display, setDisplay] = useState(true)
  const transitionEndCallback = useCallback(() => {
    if (!Boolean(trade)) {
      setDisplay(false)
    } else {
      setDisplay(true)
    }
  }, [trade])
  return (
    <AdvancedDetailsFooter show={Boolean(trade)} onTransitionEnd={transitionEndCallback} display={display}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
