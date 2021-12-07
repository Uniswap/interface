import React from 'react'
import styled from 'styled-components'
import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  padding: ${({ show }) => (show ? '12px 16px' : '0')};
  margin-top: ${({ show }) => (show ? '36px' : '0')};
  width: 100%;
  max-width: 425px;
  border-radius: 8px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.background};
  z-index: -1;
  border: solid 1px ${({ theme }) => theme.border};
  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(calc(-100% - 50px))')};
  max-height: ${({ show }) => (show ? 'auto' : '0')};
  transition: height 300ms ease-in-out, transform 300ms;
  overflow: hidden;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter show={Boolean(trade)}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
