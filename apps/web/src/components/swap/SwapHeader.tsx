import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useLimitsEnabled } from 'featureFlags/flags/limits'
import { useSendEnabled } from 'featureFlags/flags/send'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { isIFramed } from 'utils/isIFramed'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'
import { SwapTab } from './constants'
import { SwapHeaderTabButton } from './styled'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 4px;
  color: ${({ theme }) => theme.neutral2};
`

const HeaderButtonContainer = styled(RowFixed)`
  gap: 16px;
  padding-bottom: 8px;
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
        <SwapHeaderTabButton
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
        </SwapHeaderTabButton>
        {limitsEnabled && chainId === ChainId.MAINNET && (
          <SwapHeaderTabButton $isActive={currentTab === SwapTab.Limit} onClick={() => setCurrentTab(SwapTab.Limit)}>
            <Trans>Limit</Trans>
          </SwapHeaderTabButton>
        )}
        {sendEnabled && (
          <SwapHeaderTabButton $isActive={currentTab === SwapTab.Send} onClick={() => setCurrentTab(SwapTab.Send)}>
            <Trans>Send</Trans>
          </SwapHeaderTabButton>
        )}
        <SwapBuyFiatButton />
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} trade={trade.trade} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
