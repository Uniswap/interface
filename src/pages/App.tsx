import { ApolloProvider } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { ChainId } from 'dxswap-sdk'
import React, { Suspense } from 'react'
import { Route, Switch, HashRouter } from 'react-router-dom'
import styled from 'styled-components'
import { defaultSubgraphClient, subgraphClients } from '../apollo/client'
import Header from '../components/Header'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds, RedirectOldAddLiquidityPathStructure } from './AddLiquidity/redirects'
import LiquidityMining from './LiquidityMining'
import CreateLiquidityMining from './LiquidityMining/Create'
import LiquidityMiningAggregation from './LiquidityMining/Aggregation'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  z-index: 4;
  height: 86px;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 172px);
  width: 100%;
  padding-top: 50px;
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

export default function App() {
  const { chainId } = useWeb3React()

  return (
    <Suspense fallback={null}>
      <ApolloProvider client={subgraphClients[chainId as ChainId] || defaultSubgraphClient}>
        <HashRouter>
          <Route component={DarkModeQueryParamReader} />
          <AppWrapper>
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <BodyWrapper>
              <Popups />
              <Web3ReactManager>
                <Switch>
                  <Route exact strict path="/swap" component={Swap} />
                  <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                  <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                  <Route exact strict path="/find" component={PoolFinder} />
                  <Route exact strict path="/pool" component={Pool} />
                  <Route exact strict path="/create" component={AddLiquidity} />
                  <Route exact path="/add" component={AddLiquidity} />
                  {/* <Route exact strict path="/governance" component={GovPages} /> */}
                  {/* <Route exact strict path="/governance/:asset/pairs" component={GovPages} /> */}
                  <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                  <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                  <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                  <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                  <Route exact strict path="/liquidity-mining" component={LiquidityMining} />
                  <Route exact strict path="/liquidity-mining/create" component={CreateLiquidityMining} />
                  <Route exact strict path="/liquidity-mining/:aggregationId" component={LiquidityMiningAggregation} />
                  <Route component={RedirectPathToSwapOnly} />
                </Switch>
              </Web3ReactManager>
              <Marginer />
            </BodyWrapper>
          </AppWrapper>
        </HashRouter>
      </ApolloProvider>
    </Suspense>
  )
}
