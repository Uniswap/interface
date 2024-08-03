import { RowBetween, RowFixed } from 'components/Row'
import SettingsTab from 'components/Settings'
import SwapBuyFiatButton from 'components/swap/SwapBuyFiatButton'
import { SwapHeaderTabButton } from 'components/swap/styled'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isIFramed } from 'utils/isIFramed'

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
  '/buy': SwapTab.Buy,
}

export default function SwapHeader({ compact, syncTabToUrl }: { compact: boolean; syncTabToUrl: boolean }) {
  const { initialChainId, currentTab, setCurrentTab } = useSwapAndLimitContext()
  const {
    derivedSwapInfo: { trade, autoSlippage },
  } = useSwapContext()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [triggerBuyFlow, setTriggerBuyFlow] = useState(false)
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregatorWeb)

  useEffect(() => {
    if (pathname === '/buy') {
      setCurrentTab(forAggregatorEnabled ? SwapTab.Buy : SwapTab.Swap)
    } else if (pathname === '/send' && isIFramed()) {
      // Redirect to swap if send tab is iFramed (we do not allow the send tab to be iFramed due to clickjacking protections)
      // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
      setCurrentTab(SwapTab.Swap)
    } else {
      setCurrentTab(PathnameToTab[pathname] ?? SwapTab.Swap)
    }
    if (pathname === '/buy' && !forAggregatorEnabled) {
      setTriggerBuyFlow(true)
    }
  }, [forAggregatorEnabled, pathname, setCurrentTab])

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventNameLocal.SwapTabClicked, { tab })
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true })
      } else {
        setCurrentTab(tab)
      }
    },
    [navigate, setCurrentTab, syncTabToUrl],
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
          <Trans i18nKey="common.swap" />
        </SwapHeaderTabButton>
        <SwapHeaderTabButton
          $isActive={currentTab === SwapTab.Limit}
          onClick={() => {
            onTabClick(SwapTab.Limit)
          }}
        >
          <Trans i18nKey="swap.limit" />
        </SwapHeaderTabButton>
        {!isIFramed() && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Send}
            onClick={() => {
              onTabClick(SwapTab.Send)
            }}
          >
            <Trans i18nKey="common.send.button" />
          </SwapHeaderTabButton>
        )}
        {forAggregatorEnabled ? (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Buy}
            onClick={() => {
              onTabClick(SwapTab.Buy)
            }}
          >
            <Trans i18nKey="common.buy.label" />
          </SwapHeaderTabButton>
        ) : (
          <SwapBuyFiatButton triggerBuyFlow={triggerBuyFlow} setTriggerBuyFlow={setTriggerBuyFlow} />
        )}
      </HeaderButtonContainer>
      {currentTab === SwapTab.Swap && (
        <RowFixed>
          <SettingsTab autoSlippage={autoSlippage} chainId={initialChainId} compact={compact} trade={trade.trade} />
        </RowFixed>
      )}
    </StyledSwapHeader>
  )
}
