import ToastContainer, { setToast } from 'components/Toast'
import { SupportedChainId } from 'constants/chains'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { useActiveWeb3React } from 'hooks/web3'
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
import { RedirectPathToLimitOrderOnly, RedirectPathToSwapOnly } from './LimitOrder/redirects'
import Market from './Market'
import { PositionPage } from './Pool/PositionPage'
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

export default function App() {
  const { pathname } = useLocation()
  const showFallbackRoute =
    !pathname.includes('swap') && !pathname.includes('limitorder') && !pathname.includes('balance')
  const { chainId } = useActiveWeb3React()

  return (
    <ErrorBoundary>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>
        <Switch>
          <Route exact strict path="/darkswapwidget" component={SwapWidget} />
          <Route exact strict path="/lightswapwidget" component={SwapWidget} />
          <AppWrapper>
            <ToastContainer />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <BodyWrapper>
              <Popups />
              <Polling />
              <TopLevelModals />
              <Route
                exact
                strict
                path="/balance/:action/:currencyIdA?/:currencyIdB?/:feeAmount?"
                component={RedirectDuplicateTokenIds}
              />
              <Route
                exact
                path="/limitorder"
                component={chainId !== SupportedChainId.BASE ? LimitOrder : RedirectPathToSwapOnly}
              />
              <Route exact strict path="/limitorder/:tokenId" component={PositionPage} />
              <Route exact path="/swap" component={Market} />
              {showFallbackRoute && (
                <Route
                  component={chainId !== SupportedChainId.BASE ? RedirectPathToLimitOrderOnly : RedirectPathToSwapOnly}
                />
              )}
            </BodyWrapper>
          </AppWrapper>
        </Switch>
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
