import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Route, Switch, useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import { ApplicationModal } from '../state/application/reducer'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import LimitOrder from './LimitOrder'
import { RedirectPathToLimitOrderOnly, RedirectToLimitOrder } from './LimitOrder/redirects'
import Market from './Market'
import { RedirectToMarket } from './Market/redirects'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import StakingModal from './Stake/StakingModal'
import { RedirectPathToSwapOnly } from './Swap/redirects'
import SwapWidget from './SwapWidget'

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
  align-content: stretch;
  min-height: 100vh;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg0};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}

  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;
  order: 0;
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  background: ${({ theme }) =>
    theme.darkMode
      ? 'url(images/Dapp-background-final-dark.png) no-repeat fixed'
      : 'url(images/Dapp-background-final-white.png) no-repeat fixed'};
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  background-position: left bottom;

  @media screen and (max-width: 1280px) {
    background-position: left 0 bottom 90px;
    background-size: 100% auto;
  }
`

const TopLevelModals = () => {
  const open = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const toggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  return <AddressClaimModal isOpen={open} onDismiss={toggle} />
}

const Application = () => (
  <AppWrapper>
    <HeaderWrapper>
      <Header />
    </HeaderWrapper>
    <BodyWrapper>
      <Popups />
      <Polling />
      <TopLevelModals />
      <Switch>
        <Route exact strict path="/limitorder/:outputCurrency" component={RedirectToLimitOrder} />
        <Route exact strict path="/limitorder" component={LimitOrder} />
        <Route exact strict path="/swap/:outputCurrency" component={RedirectToMarket} />
        <Route path="/swap" component={Market} />
        <Route exact strict path="/pool" component={Pool} />
        <Route exact strict path="/pool/:tokenId" component={PositionPage} />
        <Route exact strict path="/stake/:tokenId" component={StakingModal} />
        <Route exact strict path="/unstake/:tokenId/remove" component={StakingModal} />
        <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
        <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} />
        <Route exact strict path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?" component={RedirectDuplicateTokenIds} />
        <Route component={RedirectPathToLimitOrderOnly} />
        <Route component={RedirectPathToSwapOnly} />
      </Switch>
    </BodyWrapper>
  </AppWrapper>
)

const Widget = () => (
  <AppWrapper>
    <Switch>
      <Route exact strict path="/swap-widget/dark" component={SwapWidget} />
      <Route exact strict path="/swap-widget/light" component={SwapWidget} />
    </Switch>
  </AppWrapper>
)

export default function App() {
  const { pathname } = useLocation()
  const isApp = !pathname.includes('swap-widget')

  return (
    <ErrorBoundary>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>{isApp ? <Application /> : <Widget />}</Web3ReactManager>
    </ErrorBoundary>
  )
}
