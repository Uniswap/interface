import React from 'react'
import styled from 'styled-components'
import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding-top: 20px;
  padding-bottom: ${({ show }) => (show ? '18px' : '0')};
  margin-top: ${({ show }) => (show ? '24px' : '0')};
  width: 100%;
  max-width: 425px;
  border-radius: 8px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.background};
  z-index: -1;
  border: solid 1px ${({ theme }) => theme.border2};
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
