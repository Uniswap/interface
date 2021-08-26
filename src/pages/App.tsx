import {  WETH9 } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { USDC } from 'constants/tokens'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import useCopyClipboard from 'hooks/useCopyClipboard'
import React, { useState } from 'react'
import { Clipboard } from 'react-feather'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { IconWrapper } from 'theme/components'
import Web3 from 'web3'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { ApplicationModal } from '../state/application/actions'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import CreateProposal from './CreateProposal'
import Earn from './Earn'
import Manage from './Earn/Manage'
import { GainsTracker } from './GainsTracker/GainsTracker'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import { Suite } from './Suite/Suite'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import Vote from './Vote'
import { routerAbi, routerAddress } from './Vote/routerAbi'
import VotePage from './Vote/VotePage'
import VotePageV2 from './Vote/VotePageV2'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`
const StyledInput = styled.input`
* {
  display:flex;
  max-width: 275px;
  width: 100%;
  cursor: pointer;
  background-color: #eaeaeb;
  border:none;
  color:#222;
  font-size: 14px;
  border-radius: 5px;
  padding: 15px 45px 15px 15px;
  font-family: 'Montserrat', sans-serif;
  box-shadow: 0 3px 15px #b8c6db;
  -moz-box-shadow: 0 3px 15px #b8c6db;
  -webkit-box-shadow: 0 3px 15px #b8c6db;
}
  `

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0px 16px;
  align-items: center;
  flex: 1;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6rem 16px 16px 16px;
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


const VideoWrapper = styled.video`
  position: fixed;
  left: 0;
  height:100%;
  min-width: 100%;
  min-height: 100%;
`

export default function App() {
const [showContracts ,setShowContracts ] =useState(false);
const [clip, setClip] = useCopyClipboard(undefined)
const stream = './trump.mp4'

  return (
    <ErrorBoundary>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <VideoWrapper loop autoPlay muted>
            <source src={stream} type={'video/mp4'}></source>
          </VideoWrapper>
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
              <Route exact strict path="/gains-tracker" component={GainsTracker} />
              <Route exact strict path="/suite" component={Suite} />
              <Route exact strict path="/gains" component={VotePage} />
              <Route exact strict path="/gains/:governorIndex/:id" component={VotePage} />
              <Route exact strict path="/vote" component={Vote} />
              <Route exact strict path="/vote/:governorIndex/:id" component={VotePageV2} />
              <Route exact strict path="/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
              <Route exact strict path="/uni" component={Earn} />
              <Route exact strict path="/uni/:currencyIdA/:currencyIdB" component={Manage} />

              <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
              <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/swap" component={Swap} />

              <Route exact strict path="/pool/v2/find" component={PoolFinder} />
              <Route exact strict path="/pool/v2" component={PoolV2} />
              <Route exact strict path="/pool" component={Pool} />
              <Route exact strict path="/pool/:tokenId" component={PositionPage} />

              <Route exact strict path="/add/v2/:currencyIdA?/:currencyIdB?" component={RedirectDuplicateTokenIdsV2} />
              <Route
                exact
                strict
                path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                component={RedirectDuplicateTokenIds}
              />

              <Route
                exact
                strict
                path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                component={AddLiquidity}
              />

              <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
              <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} />

              <Route exact strict path="/migrate/v2" component={MigrateV2} />
              <Route exact strict path="/migrate/v2/:address" component={MigrateV2Pair} />

              <Route exact strict path="/create-proposal" component={CreateProposal} />
              <Route component={RedirectPathToSwapOnly} />
            </Switch>
            <Marginer />
          </BodyWrapper>
          
        </AppWrapper>
      </Web3ReactManager>
      {showContracts && (
          <Row style={{display:'flex', flexFlow: 'column', position:'fixed',  bottom: '10%', right:'0%'}}>
          <div onClick={() => {
            setClip('0x99d36e97676a68313ffdc627fd6b56382a2a08b6')
        }} style={{fontSize:12, cursor: 'pointer'}}>
          <img width={'30px'} src={'https://babytrumptoken.com/images/Baby_Trump_Transpa.png'} alt="logo" />
          <Row >
            <AutoColumn>
              <TYPE.main>Baby Trump</TYPE.main>
            <StyledInput value={'0x99d36e97676a68313ffdc627fd6b56382a2a08b6'} /> 
            </AutoColumn>
            <AutoColumn>
            <Clipboard style={{marginTop:13}} />
            </AutoColumn>
          </Row>
          </div>
          <div onClick={() => {
            setClip('0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013')
            alert(`Successfully copied Stimulus Check (0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013) to clipboard`)
          }} style={{fontSize:12, paddingTop:5, cursor: 'pointer'}}>
          <img width={'30px'} src={'https://babytrumptoken.com/images/CoinGecko.png'} alt="logo" />
          <Row >
            <AutoColumn>
            <TYPE.main>Stimulus Check</TYPE.main>
            <StyledInput value={'0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013'} /> 
            </AutoColumn>
            <AutoColumn>
              <Clipboard style={{marginTop:13}} />
            </AutoColumn>
          </Row>
          </div>
          <div onClick={() => {
            alert(`Trump Gold is coming soon to a place near you.`)
          }} style={{fontSize:12, paddingTop:5, cursor: 'not-allowed'}}>
          <img width={'30px'} src={'https://babytrumptoken.com/images/CoinGecko.png'} alt="logo" />
          <Row >
            <AutoColumn>
            <TYPE.main>Trump Gold</TYPE.main>
            <StyledInput value={'COMING SOON'} /> 
            </AutoColumn>
            <AutoColumn>
              <Clipboard style={{marginTop:13}} />
            </AutoColumn>
          </Row>
          </div>
          </Row>
    )}
    </ErrorBoundary>
  )
}
