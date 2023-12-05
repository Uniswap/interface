import { Trans } from '@lingui/macro'
import { useLimitsEnabled } from 'featureFlags/flags/limits'
import { useSwapContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { ButtonText } from 'theme/components'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import { SwapTab } from './constants'
import SwapBuyFiatButton from './SwapBuyFiatButton'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.neutral2};
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
  gap: 16px;
`

const StyledTextButton = styled(ButtonText)<{ $isActive: boolean }>`
  color: ${({ theme, $isActive }) => ($isActive ? theme.neutral1 : theme.neutral2)};
  gap: 4px;
  font-weight: 485;
  &:focus {
    text-decoration: none;
  }
  &:active {
    text-decoration: none;
  }
`

export default function SwapHeader() {
  const limitsEnabled = useLimitsEnabled()
  const { chainId, derivedSwapInfo, currentTab, setCurrentTab } = useSwapContext()
  const { trade, autoSlippage } = derivedSwapInfo
  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        <StyledTextButton $isActive={currentTab === SwapTab.Swap} onClick={() => setCurrentTab(SwapTab.Swap)}>
          <Trans>Swap</Trans>
        </StyledTextButton>
        <SwapBuyFiatButton />
        {limitsEnabled && (
          <StyledTextButton $isActive={currentTab === SwapTab.Limit} onClick={() => setCurrentTab(SwapTab.Limit)}>
            <Trans>Limit</Trans>
          </StyledTextButton>
        )}
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} trade={trade.trade} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
