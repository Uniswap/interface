import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import UniHead from '../components/UniHead'
import Header from '../components/Header';
import ConnectionHelper from '../components/ConnectionHelper'
import Exchange from '../components/Exchange';
import RateAndFee from '../components/RateAndFee';
import Purchase from '../components/Purchase';
import About from '../components/About';
import Links from '../components/Links';
import SharePurchase from '../components/SharePurchase';

import Swap from './Swap';
import './App.scss';

class App extends Component {
  renderMain() {
    return (
      <div className="app">
        <UniHead />
        <Header metamask={this.props.metamask}/>
        <ConnectionHelper
          metamask={this.props.metamask}
          approveAllowance={this.approveAllowance}
          toggleAbout={this.toggleAbout}
        />
        <Exchange
          getAccountInfo={this.getAccountInfo}
          getMarketInfo={this.getMarketInfo}
          symbolToTokenContract={this.symbolToTokenContract}
          symbolToExchangeAddress={this.symbolToExchangeAddress}
        />
        <RateAndFee
          exchangeRate={this.props.exchange.rate}
          outputTokenValue={this.props.exchange.outputToken.value}
          inputTokenValue={this.props.exchange.inputToken.value}
          exchangeFee={this.props.exchange.fee}
        />
        <Purchase
          symbolToExchangeContract={this.symbolToExchangeContract}
          symbolToTokenAddress={this.symbolToTokenAddress}
        />
        {/* <Visualization /> */}
        <Links
          toggleInvest={this.toggleInvest}
          location={this}
          symbolToTokenContract={this.symbolToTokenContract}
          symbolToExchangeContract={this.symbolToExchangeContract}
          symbolToExchangeAddress={this.symbolToExchangeAddress}
        />
        <SharePurchase
          symbolToTokenContract={this.symbolToTokenContract}
          symbolToExchangeContract={this.symbolToExchangeContract}
          symbolToTokenAddress={this.symbolToTokenAddress}
          symbolToExchangeAddress={this.symbolToExchangeAddress}
        />
        <About toggleAbout={this.toggleAbout} location={this}/>
      </div>
    )
  }

  render() {
    return (
      <Switch>
        <Route exact path="/swap" component={Swap} />
        <Route exact path="/send" component={Swap} />
        <Route exact path="/pool" component={Swap} />
      </Switch>
    )
  }
}

export default connect(
  state => ({
    web3Store: state.web3Store,
    exchangeContracts: state.exchangeContracts,
    tokenContracts: state.tokenContracts,
    exchange: state.exchange,
  }),
)(App);
