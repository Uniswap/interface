import React from 'react'
import styled from 'styled-components'

import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: 10px;
  padding-bottom: 8px;
  margin-top: 10px;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  z-index: -1;
  border: dashed 1px ${({ theme }) => theme.advancedBorder};
  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(calc(-100% - 50px))')};
  transition: transform 300ms ease-in-out;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter show={Boolean(trade)}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
