import { MinimalPositionCard } from 'components/Stake'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { useEffect } from 'react'
import ReactGA from 'react-ga'
import { Route, Switch } from 'react-router-dom'
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
import AddLiquidity from './AddLiquidity/index'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import Earn from './Earn'
import Manage from './Earn/Manage'
import LimitOrder from './LimitOrder'
import {
  OpenClaimAddressModalAndRedirectToLimitOrder,
  RedirectPathToLimitOrderOnly,
  RedirectToLimitOrder,
} from './LimitOrder/redirects'
import Market from './Market'
import { RedirectToMarket } from './Market/redirects'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import Stake from './Stake/index'
import StakingModal from './Stake/StakingModal'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import Vote from './Vote'
import VotePage from './Vote/VotePage'

const TRACKING_ID = 'UA-249910106-2'
ReactGA.initialize(TRACKING_ID)

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 45px;
  align-items: center;
  flex: 1;
  z-index: 1;
  overflow: hidden;
  max-height: 100vh;

  @media screen and (max-width: 1592px) {
    overflow: auto;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6rem 16px 16px 16px;
    margin-bottom: 60px;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: 2;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

function TopLevelModals() {
  const open = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const toggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  return <AddressClaimModal isOpen={open} onDismiss={toggle} />
}

export default function App() {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  return (
    <ErrorBoundary>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>
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
              <Route
                exact
                strict
                path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                component={RedirectDuplicateTokenIds}
              />
              <Route component={RedirectPathToLimitOrderOnly} />
              <Route component={RedirectPathToSwapOnly} />
            </Switch>
            <Marginer />
          </BodyWrapper>
        </AppWrapper>
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
