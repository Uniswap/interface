import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.neutral2};
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
  gap: 16px;
`

export default function SwapHeader({
  autoSlippage,
  chainId,
  trade,
  activeTab = 'swap',
  setActiveTab,
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
  activeTab?: 'swap' | 'send'
  setActiveTab?: (tab: 'swap' | 'send') => void
}) {
  const swapIsActive = activeTab === 'swap'
  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        <ThemedText.SubHeader
          color={swapIsActive ? 'neutral1' : 'neutral2'}
          onClick={() => setActiveTab && setActiveTab('swap')}
        >
          <Trans>Swap</Trans>
        </ThemedText.SubHeader>
        <SwapBuyFiatButton />
        <ThemedText.SubHeader
          color={swapIsActive ? 'neutral2' : 'neutral1'}
          onClick={() => setActiveTab && setActiveTab('send')}
        >
          <Trans>Send</Trans>
        </ThemedText.SubHeader>
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} trade={trade} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
