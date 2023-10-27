import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.neutral2};
`
const ClickableText = styled(Text)`
  font-size: 16;
  font-weight: 485;
  color: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.neutral2)};
  :hover {
    cursor: pointer;
  }
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
  gap: 16px;
`
export enum Tab {
  SWAP,
  BUY,
  PAY,
}

export default function SwapHeader({
  selectedTabIndex,
  setSelectedTabIndex,
  autoSlippage,
  chainId,
  trade,
}: {
  selectedTabIndex: number
  setSelectedTabIndex: (index: number) => void
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
}) {
  const tabs = [<Trans key={Tab.SWAP}>Swap</Trans>, <Trans key={Tab.BUY}>Buy</Trans>, <Trans key={Tab.PAY}>Pay</Trans>]

  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        {tabs.map((tabName, index) => (
          <ClickableText key={index} selected={index === selectedTabIndex} onClick={() => setSelectedTabIndex(index)}>
            {tabName}
          </ClickableText>
        ))}
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} trade={trade} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
