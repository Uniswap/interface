import { ChainId } from '@uniswap/sdk-core'
import { Trans } from 'i18n'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/hooks'
import styled from 'styled-components'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isIFramed } from 'utils/isIFramed'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'
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
  const [triggerBuyFlow, setTriggerBuyFlow] = useState(false)

  useEffect(() => {
    setCurrentTab(PathnameToTab[pathname] ?? SwapTab.Swap)
    if (pathname === '/buy') {
      setTriggerBuyFlow(true)
    }
  }, [pathname, setCurrentTab])

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventNameLocal.SwapTabClicked, { tab })
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
          <Trans i18nKey="common.swap" />
        </SwapHeaderTabButton>
        {chainId === ChainId.SEPOLIA && (
          <SwapHeaderTabButton
            $isActive={currentTab === SwapTab.Limit}
            onClick={() => {
              onTabClick(SwapTab.Limit)
            }}
          >
            <Trans i18nKey="swap.limit" />
          </SwapHeaderTabButton>
        )}
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
        <SwapBuyFiatButton triggerBuyFlow={triggerBuyFlow} setTriggerBuyFlow={setTriggerBuyFlow} />
      </HeaderButtonContainer>
      {currentTab === SwapTab.Swap && (
        <RowFixed>
          <SettingsTab autoSlippage={autoSlippage} chainId={chainId} compact={compact} trade={trade.trade} />
        </RowFixed>
      )}
    </StyledSwapHeader>
  )
}
