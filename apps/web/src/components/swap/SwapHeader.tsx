import { ChainId } from '@uniswap/sdk-core'
import { Trans } from 'i18n'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/hooks'
import styled from 'styled-components'

import { sendAnalyticsEvent } from 'analytics'
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isIFramed } from 'utils/isIFramed'
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
  const { chainId, currentTab, setCurrentTab } = useSwapAndLimitContext()
  const {
    derivedSwapInfo: { trade, autoSlippage },
  } = useSwapContext()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Limits is only available on mainnet for now
    if (PathnameToTab[pathname] === SwapTab.Limit && chainId !== ChainId.MAINNET) {
      navigate(`/${SwapTab.Swap}`, { replace: true })
      return
    }

    setCurrentTab(PathnameToTab[pathname] ?? SwapTab.Swap)
  }, [chainId, navigate, pathname, setCurrentTab])

  const onTabClick = useCallback(
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
            onTabClick(SwapTab.Swap)
          }}
        >
          <Trans>Swap</Trans>
        </SwapHeaderTabButton>
        {chainId === ChainId.MAINNET && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Limit}
            onClick={() => {
              onTabClick(SwapTab.Limit)
            }}
          >
            <Trans>Limit</Trans>
          </SwapHeaderTabButton>
        )}
        {!isIFramed() && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Send}
            onClick={() => {
              onTabClick(SwapTab.Send)
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
