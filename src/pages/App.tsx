import Loader from 'components/Loader'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import styled from 'styled-components/macro'

import AddressClaimModal from '../components/claim/AddressClaimModal'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import { ApplicationModal } from '../state/application/reducer'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import Earn from './Earn'
import Manage from './Earn/Manage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import Swap from './Swap'
import {
  OpenClaimAddressModalAndRedirectToSwap,
  RedirectPathToSwapOnly,
  RedirectToCharts,
  RedirectToSwap,
  RedirectToVote,
} from './Swap/redirects'
import XTTPresale from './XTTPresale'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0 16px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4rem 8px 16px 8px;
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
  console.log('Version: 1.0.2')
  return (
    <ErrorBoundary>
      {/*<Route component={GoogleAnalyticsReporter} />*/}
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
            <Suspense fallback={<Loader />}>
              <Switch>
                <Route exact strict path="/create-proposal">
                  <Redirect to="/vote/create-proposal" />
                </Route>
                <Route exact strict path="/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
                <Route exact strict path="/uni" component={Earn} />
                <Route exact strict path="/uni/:currencyIdA/:currencyIdB" component={Manage} />

                <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/swap" component={Swap} />
                <Route exact strict path="/xtt-presale" component={XTTPresale} />

                <Route exact strict path="/pool/find" component={PoolFinder} />
                <Route exact strict path="/pool" component={PoolV2} />
                <Route exact strict path="/add/:currencyIdA?/:currencyIdB?" component={RedirectDuplicateTokenIdsV2} />
                <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                <Route exact strict path="/vote" component={RedirectToVote} />
                <Route exact strict path="/charts" component={RedirectToCharts} />
                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Suspense>
            <Marginer />
          </BodyWrapper>
        </AppWrapper>
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
