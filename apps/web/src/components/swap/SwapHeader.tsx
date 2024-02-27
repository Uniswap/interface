import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useLimitsEnabled } from 'featureFlags/flags/limits'
import { useSendEnabled } from 'featureFlags/flags/send'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { isIFramed } from 'utils/isIFramed'

import { sendAnalyticsEvent } from 'analytics'
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'
import { SwapTab } from './constants'
import { SwapHeaderTabButton } from './styled'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 12px;
  padding-right: 4px;
  color: ${({ theme }) => theme.neutral2};
`

const HeaderButtonContainer = styled(RowFixed)<{ compact: boolean }>`
  gap: ${({ compact }) => (compact ? 0 : 16)}px;

  ${SwapHeaderTabButton} {
    ${({ compact }) => compact && 'padding: 8px 12px;'}
  }
`

const PathnameToTab: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/send': SwapTab.Send,
  '/limit': SwapTab.Limit,
}

export default function SwapHeader({ compact, syncTabToUrl }: { compact: boolean; syncTabToUrl: boolean }) {
  const limitsEnabled = useLimitsEnabled()
  const sendEnabled = useSendEnabled() && !isIFramed()
  const { chainId, currentTab, setCurrentTab } = useSwapAndLimitContext()
  const {
    derivedSwapInfo: { trade, autoSlippage },
  } = useSwapContext()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (PathnameToTab[pathname] === SwapTab.Limit && (!limitsEnabled || chainId !== ChainId.MAINNET)) {
      navigate(`/${SwapTab.Swap}`, { replace: true })
      return
    }

    setCurrentTab(PathnameToTab[pathname] ?? SwapTab.Swap)
  }, [chainId, limitsEnabled, navigate, pathname, setCurrentTab])

  // Limits is only available on mainnet for now
  if (chainId !== ChainId.MAINNET && currentTab === SwapTab.Limit) {
    setCurrentTab(SwapTab.Swap)
  }

  const onTab = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent('Swap Tab Clicked', { tab })
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true })
      } else {
        setCurrentTab(tab)
      }
    },
    [navigate, setCurrentTab, syncTabToUrl]
  )

  return (
    <StyledSwapHeader>
      <HeaderButtonContainer compact={compact}>
        <SwapHeaderTabButton
          as={pathname === '/swap' ? 'h1' : 'button'}
          role="button"
          tabIndex={0}
          $isActive={currentTab === SwapTab.Swap}
          onClick={() => {
            onTab(SwapTab.Swap)
          }}
        >
          <Trans>Swap</Trans>
        </SwapHeaderTabButton>
        {limitsEnabled && chainId === ChainId.MAINNET && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Limit}
            onClick={() => {
              onTab(SwapTab.Limit)
            }}
          >
            <Trans>Limit</Trans>
          </SwapHeaderTabButton>
        )}
        {sendEnabled && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Send}
            onClick={() => {
              onTab(SwapTab.Send)
            }}
          >
            <Trans>Send</Trans>
          </SwapHeaderTabButton>
        )}
        <SwapBuyFiatButton />
      </HeaderButtonContainer>
      {currentTab === SwapTab.Swap && (
        <RowFixed>
          <SettingsTab autoSlippage={autoSlippage} chainId={chainId} compact={compact} trade={trade.trade} />
        </RowFixed>
      )}
    </StyledSwapHeader>
  )
}
