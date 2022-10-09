import styled from 'styled-components'

import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails, AdvancedSwapDetailsProps } from './AdvancedSwapDetails'

const AdvancedDetailsFooter = styled.div<{ show: boolean }>`
  // padding-top: calc(16px + 2rem);
  // padding-bottom: 16px;
  // margin-top: -2rem;
  width: 100%;
  // max-width: 400px;
  padding: ${({ show }) => (show ? '1rem 0' : '0')};
  border-radius: 1rem;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  // z-index: -1;
  opacity: ${({ show }) => (show ? '1' : '0')};
  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  height: ${({ show }) => (show ? 'fit-content' : '0px')};
  transition: all 300ms ease-in-out;
`

export default function AdvancedSwapDetailsDropdown({ trade, ...rest }: AdvancedSwapDetailsProps) {
  const lastTrade = useLastTruthy(trade)

  return (
    <AdvancedDetailsFooter show={Boolean(trade)}>
      <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
    </AdvancedDetailsFooter>
  )
}
