import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'

export enum SwapTab {
  SWAP = 'Swap',
  PAY = 'Pay',
}

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.neutral2};
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
  gap: 16px;
`

const TabButton = styled(ThemedText.SubHeader)<{ $active: boolean }>`
  color: ${({ theme, $active }) => ($active ? theme.neutral1 : theme.neutral2)};
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`

export default function SwapHeader({
  autoSlippage,
  chainId,
  trade,
  activeTab,
  onSelectTab,
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
  activeTab?: SwapTab
  onSelectTab?: (tab: SwapTab) => void
}) {
  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        <TabButton
          $active={activeTab === SwapTab.SWAP}
          onClick={() => {
            onSelectTab?.(SwapTab.SWAP)
          }}
        >
          <Trans>Swap</Trans>
        </TabButton>
        <SwapBuyFiatButton />
        <TabButton
          $active={activeTab === SwapTab.PAY}
          onClick={() => {
            onSelectTab?.(SwapTab.PAY)
          }}
        >
          Pay
        </TabButton>
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} trade={trade} activeTab={activeTab} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
