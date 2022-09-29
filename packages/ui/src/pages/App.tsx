import bg from 'assets/svg/background.svg'
import LiquidityDetail from 'components/LiquidityDetail'
import { WrongNetworkProtector } from 'components/WrongNetworkProtector'
import React, { Suspense } from 'react'
import { isMobile } from 'react-device-detect'
import { Route, Switch } from 'react-router-dom'
import { Box } from 'rebass'
import styled from 'styled-components'

import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
// import URLWarning from '../components/Header/URLWarning'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { ApplicationModal } from '../state/application/actions'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
  RedirectToAddLiquidity
} from './AddLiquidity/redirects'
import FarmList from './Farm'
import Liquidity from './Liquidity'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import Vote from './Vote'
import VotePage from './Vote/VotePage'

const AppWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-size: 0.6rem;
  position: relative;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div<{ mobile?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  // padding-top: 5rem;
  padding-top: calc(3rem + 0.33333vw);
  align-items: center;
  flex: 1;
  z-index: 10;
  ${({ mobile }) => (mobile ? `overflow: hidden auto;` : '')}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem;
    padding-top: 4rem;
  `};

  z-index: 1;
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
  return (
    <Suspense fallback={null}>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <AppWrapper>
        <Box
          sx={{
            position: 'fixed',
            background: `url(${bg})`,
            width: '100vw',
            height: '100vh',
            backgroundRepeat: 'no-repeat',
            backgroundPositionX: '50%'
          }}
        ></Box>
        {/* <URLWarning /> */}
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <BodyWrapper mobile={isMobile}>
          <Popups />
          <Polling />
          <TopLevelModals />
          <Web3ReactManager>
            <Switch>
              <Route exact strict path="/swap" component={Swap} />
              <Route exact strict path="/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
              <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
              <Route exact strict path="/find" component={PoolFinder} />
              <Route
                exact
                strict
                path="/liquidity"
                component={() => (
                  <WrongNetworkProtector>
                    <Liquidity />
                  </WrongNetworkProtector>
                )}
              />
              <Route
                exact
                strict
                path="/manager"
                component={() => (
                  <WrongNetworkProtector>
                    <Liquidity />
                  </WrongNetworkProtector>
                )}
              />
              {/* <Route exact strict path="/tele" component={Earn} /> */}
              <Route exact strict path="/vote" component={Vote} />
              <Route exact strict path="/create" component={RedirectToAddLiquidity} />
              <Route
                exact
                path="/add"
                component={() => (
                  <WrongNetworkProtector>
                    <AddLiquidity />
                  </WrongNetworkProtector>
                )}
              />
              <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/add/:currencyIdA/:currencyIdB/:stable" component={RedirectDuplicateTokenIds} />
              <Route
                exact
                path="/create"
                component={() => (
                  <WrongNetworkProtector>
                    <AddLiquidity />
                  </WrongNetworkProtector>
                )}
              />
              <Route exact path="/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
              {/* <Route exact strict path="/remove/v1/:address" component={RemoveV1Exchange} /> */}
              <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
              <Route
                exact
                strict
                path="/remove/:currencyIdA/:currencyIdB/:stable"
                component={() => (
                  <WrongNetworkProtector>
                    <RemoveLiquidity />
                  </WrongNetworkProtector>
                )}
              />
              <Route
                exact
                strict
                path="/liquidity/:currencyIdA/:currencyIdB"
                component={() => (
                  <WrongNetworkProtector>
                    <LiquidityDetail />
                  </WrongNetworkProtector>
                )}
              />
              <Route
                exact
                strict
                path="/liquidity/:currencyIdA/:currencyIdB/:stable"
                component={() => (
                  <WrongNetworkProtector>
                    <LiquidityDetail />
                  </WrongNetworkProtector>
                )}
              />
              {/*    <Route exact strict path="/migrate/v1" component={MigrateV1} />
              <Route exact strict path="/migrate/v1/:address" component={MigrateV1Exchange} /> */}
              <Route exact strict path="/vote/:id" component={VotePage} />
              <Route exact strict path="/farm" component={FarmList} />
              <Route component={RedirectPathToSwapOnly} />
            </Switch>
          </Web3ReactManager>
          <Marginer />
        </BodyWrapper>
      </AppWrapper>
    </Suspense>
  )
}
