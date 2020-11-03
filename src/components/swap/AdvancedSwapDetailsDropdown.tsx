import React from 'react'
import styled from 'styled-components'
import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: 8px;
  padding-bottom: 16px;
  width: 100%;
  max-width: 400px;
  color: ${({ theme }) => theme.purple3};
  background-color: #181520;
  z-index: -1;
  border: 8px solid transparent;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-image: url(${border8pxRadius}) 8;

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter show={Boolean(trade)}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
