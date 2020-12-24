import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import URLWarning from '../components/Header/URLWarning'
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
import Earn from './Earn'
import Manage from './Earn/Manage'
import MigrateV1 from './MigrateV1'
import MigrateV1Exchange from './MigrateV1/MigrateV1Exchange'
import RemoveV1Exchange from './MigrateV1/RemoveV1Exchange'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'

import Vote from './Vote'
import VotePage from './Vote/VotePage'
import Home from './Home'
import { RedirectPathToHomeOnly } from './Home/redirects'
import Lend from './Lend'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 60px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 2rem;
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
        <URLWarning />
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <BodyWrapper>
          <Popups />
          <Polling />
          <TopLevelModals />
          <Web3ReactManager>
            <Switch>
              <Route exact strict path="/home" component={Home} />
              <Route exact strict path="/compound/lending" component={Lend} />
              <Route exact strict path="/sushiswap/swap" component={Swap} />
              <Route exact strict path="/sushiswap/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/sushiswap/create" component={RedirectToAddLiquidity} />
              <Route exact strict path="/sushiswap/pool" component={Pool} />
              <Route exact path="/sushiswap/add" component={AddLiquidity} />
              <Route exact path="/sushiswap/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/sushiswap/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
              <Route exact path="/sushiswap/create" component={AddLiquidity} />
              <Route exact path="/sushiswap/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/sushiswap/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
              <Route
                exact
                strict
                path="/sushiswap/remove/:tokens"
                component={RedirectOldRemoveLiquidityPathStructure}
              />
              <Route exact strict path="/sushiswap/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
              <Route exact strict path="/sushiswap/vote/:id" component={VotePage} />
              <Route exact strict path="/uniswap/swap" component={Swap} />
              <Route exact strict path="/uniswap/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
              <Route exact strict path="/uniswap/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/uniswap/send" component={RedirectPathToSwapOnly} />
              <Route exact strict path="/uniswap/find" component={PoolFinder} />
              <Route exact strict path="/uniswap/pool" component={Pool} />
              <Route exact strict path="/uniswap/uni" component={Earn} />
              <Route exact strict path="/uniswap/vote" component={Vote} />
              <Route exact strict path="/uniswap/create" component={RedirectToAddLiquidity} />
              <Route exact path="/uniswap/add" component={AddLiquidity} />
              <Route exact path="/uniswap/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/uniswap/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
              <Route exact path="/uniswap/create" component={AddLiquidity} />
              <Route exact path="/uniswap/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
              <Route exact path="/uniswap/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
              <Route exact strict path="/uniswap/remove/v1/:address" component={RemoveV1Exchange} />
              <Route exact strict path="/uniswap/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
              <Route exact strict path="/uniswap/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
              <Route exact strict path="/uniswap/migrate/v1" component={MigrateV1} />
              <Route exact strict path="/uniswap/migrate/v1/:address" component={MigrateV1Exchange} />
              <Route exact strict path="/uniswap/uni/:currencyIdA/:currencyIdB" component={Manage} />
              <Route exact strict path="/uniswap/vote/:id" component={VotePage} />
              <Route component={RedirectPathToHomeOnly} />
            </Switch>
          </Web3ReactManager>
          <Marginer />
        </BodyWrapper>
      </AppWrapper>
    </Suspense>
  )
}
