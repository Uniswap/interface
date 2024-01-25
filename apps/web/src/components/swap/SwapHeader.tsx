import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useLimitsEnabled } from 'featureFlags/flags/limits'
import { useSendEnabled } from 'featureFlags/flags/send'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { ButtonText } from 'theme/components'
import { isIFramed } from 'utils/isIFramed'

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
  const sendEnabled = useSendEnabled() && !isIFramed()
  const { chainId, currentTab, setCurrentTab } = useSwapAndLimitContext()
  const {
    derivedSwapInfo: { trade, autoSlippage },
  } = useSwapContext()

  // Limits is only available on mainnet for now
  if (chainId !== ChainId.MAINNET && currentTab === SwapTab.Limit) {
    setCurrentTab(SwapTab.Swap)
  }

  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        <StyledTextButton
          as="h1"
          role="button"
          tabIndex={0}
          $isActive={currentTab === SwapTab.Swap}
          onClick={() => setCurrentTab(SwapTab.Swap)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
              e.preventDefault()
              setCurrentTab(SwapTab.Swap)
            }
          }}
        >
          <Trans>Swap</Trans>
        </StyledTextButton>
        <SwapBuyFiatButton />
        {sendEnabled && (
          <StyledTextButton $isActive={currentTab === SwapTab.Send} onClick={() => setCurrentTab(SwapTab.Send)}>
            <Trans>Send</Trans>
          </StyledTextButton>
        )}
        {limitsEnabled && chainId === ChainId.MAINNET && (
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
