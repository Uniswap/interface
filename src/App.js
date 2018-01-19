import React, { Component } from 'react';
import Web3 from 'web3';

import Head from './components/Head'
import NetworkStatus from './components/NetworkStatus'
import HelperMessages from './components/HelperMessages'
import SelectToken from './components/SelectToken'
import './App.css';

import {exchangeABI} from './helpers/exchangeABI.js'
import {tokenABI} from './helpers/tokenABI.js'

var localweb3;

class App extends Component {
  constructor (props) {
    super(props)
    if (typeof props.metamask !== 'undefined'){
      localweb3 = new Web3(window.web3.currentProvider)
    } else {
      localweb3 = null
    }

    const exchangeAddress = '0xcDc30C3b02c5776495298198377D2Fc0fd6B1F1C';
    const uniContract = new localweb3.eth.Contract(exchangeABI, exchangeAddress);

    const tokenAddress = '0x350E5DD084ecF271e8d3531D4324443952F47756';
    const tokenContract = new localweb3.eth.Contract(tokenABI, tokenAddress);

    this.state = {
      exchangeAddress: '0xcDc30C3b02c5776495298198377D2Fc0fd6B1F1C',
      tokenAddress: '0x350E5DD084ecF271e8d3531D4324443952F47756',
      currentMaskAddress: '0x0000000000000000000000000000000000000000',
      uniswapContract: uniContract,
      tokenContract: tokenContract,
      ethBalance: 0,
      tokenBalance: 0,
      tokenAllowance: null,
      invariant: 0,
      marketEth: 0,
      marketTokens: 0,
      rate: 0,
      fee: 0,
      cost: 0,
      networkMessage: '',
      locked: false,
      connected: false,
      interaction: 'disconnected',
      input: 0,
      output: 0,
      inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
      outputToken: { value: 'OMG', label: 'OMG', clearableValue: false }
    }

    this.onInputChange = this.onInputChange.bind(this);
    this.ethToTokenRate = this.ethToTokenRate.bind(this);
    this.getMarketInfo = this.getMarketInfo.bind(this);
  }

  componentWillMount(){
    this.getMetaMaskAddress();
    this.checkNetwork();
    this.getMarketInfo();
  }

  componentDidMount(){
    this.getAccountInfo();
  }

  getAccountInfo(){
    setTimeout(() => {
      this.getEthBalance();
      this.getTokenBalance();
      this.getAllowance();
    }, 1000);
  }

  getMarketInfo(){
    this.getInvarient();
    this.getMarketEth();
    this.getMarketTokens();
  }

  getRate(){
    this.ethToTokenRate(1);
  }

  getMetaMaskAddress() {
    var self = this;
    localweb3.eth.getAccounts(function(error, result){
      if(!error)
          self.setState({currentMaskAddress: result[0]})
      else
        self.setState({locked: true})
    })
  }

  getEthBalance() {
    var self = this;
    localweb3.eth.getBalance(this.state.currentMaskAddress, function(error, balance) {
      self.setState({ethBalance: balance});
    });
  }

  getTokenBalance() {
    var self = this;
    this.state.tokenContract.methods.balanceOf(this.state.currentMaskAddress).call(function(error, balance) {
      var amount = balance;
      self.setState({tokenBalance: amount});
    });
  }

  getAllowance() {
    // var self = this;
    // this.state.tokenContract.methods.allowance(this.state.currentMaskAddress, this.exchangeAddress).call().then(function(result, error){
    //   var amount = result
    //   self.setState({tokenAllowance: amount});
    // })
  }

  checkNetwork() {
    var self = this;

    localweb3.eth.net.getNetworkType((err, networkId) => {
      console.log("Connected to " + networkId)
      switch (networkId) {
        case "main":
          self.setState({networkMessage: 'Ethereum Mainet', connected: false, interaction: 'disconnected'});
          break;
        case "morden":
         self.setState({networkMessage: 'Morden testnet', connected: false, interaction: 'disconnected'});
         break;
        case "ropsten":
          self.setState({networkMessage: 'Ropsten testnet', connected: false, interaction: 'disconnected'});
          break;
        case "rinkeby":
          self.setState({networkMessage: '', connected: true, interaction: 'connected'});
          break;
        case "kovan":
          self.setState({networkMessage: 'Kovan testnet', connected: false, interaction: 'disconnected'});
          break;
        default:
          self.setState({networkMessage: 'an Unknown network', connected: false, interaction: 'disconnected'});
      }
    })
  }

  getInvarient() {
    var self = this;
    this.state.uniswapContract.methods.invariant().call().then(function(result, error){
      self.setState({invariant: result});
      // console.log("invariant: " + result);
    })
  }

  getMarketEth() {
    var self = this
    this.state.uniswapContract.methods.ethInMarket().call().then(function(result, error){
      self.setState({marketEth: result});
      // console.log("marketEth: " + result);
    })
  }

  getMarketTokens() {
    var self = this
    this.state.uniswapContract.methods.tokensInMarket().call().then(function(result, error){
      self.setState({marketTokens: result});
      // console.log("marketTokens: " + result);
    })
  }

  onSelectToken = (selected, type) => {
    console.log(selected)
    console.log(type)
    if (type === 'input'){
      this.setState({inputToken: selected});
      // do something here to update invariants and values
    } else if (type === 'output'){
      this.setState({outputToken: selected});
      // do something here to update invariants and values
    }
  }

  onInputChange = (event) => {
    this.getMarketInfo();
    var inputValue = event.target.value;
    if(inputValue && inputValue !== 0){
      this.ethToTokenRate(inputValue);
      this.setState({input: inputValue, interaction: 'input'});
    } else {
      this.setState({input: inputValue, output: 0, interaction: 'connected'});
    }
  }

  ethToTokenRate(ethInput) {
    var ethInMarket = +this.state.marketEth;
    var tokensInMarket = +this.state.marketTokens;
    var invar = +this.state.invariant;
    var ethIn = ethInput*10**18;
    var exchangeFee = ethIn/500;
    var ethSold = ethIn - exchangeFee;
    var newEthInMarket = ethInMarket + ethSold;
    var newTokensInMarket = invar/newEthInMarket;
    var tokensOut = tokensInMarket - newTokensInMarket;
    var adjustedTokensOut = tokensOut * 0.99
    var buyRate = adjustedTokensOut/ethIn;
    this.setState({rate: buyRate,
                   fee: exchangeFee,
                   output: adjustedTokensOut
                   });
  }

  ethToTokenPurchase() {
    var self = this;
    var minTokens = this.state.output/10**18;
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var ethSold = this.state.input;
    var weiSold = localweb3.utils.toWei(ethSold);

    localweb3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var timeout = time + 300; //current block time + 5mins

        self.state.uniswapContract.methods.ethToTokenSwap(minTokensInt, timeout).send(
          {from: self.state.currentMaskAddress, value: weiSold},
          function(err, txHash) {})
    });
  }

  tokenToEthRate(tokenInput) {
    var ethInMarket = +this.state.marketEth;
    var tokensInMarket = +this.state.marketTokens;
    var invar = +this.state.invariant;
    var tokensIn = tokenInput*10**18;
    var exchangeFee = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee;
    var newTokensInMarket = tokensInMarket + tokensSold;
    var newEthInMarket = invar/newTokensInMarket;
    var ethOut = ethInMarket - newEthInMarket;
    var adjustedEthOut = ethOut * 0.99;
    var buyRate = adjustedEthOut/tokensIn;
    this.setState({rate: buyRate,
                   fee: exchangeFee,
                   output: adjustedEthOut
                   });
  }

  // tokenToTokenRate(tokenInput) {
  //   var ethInMarket = +this.state.marketEth;
  //   var tokensInMarket = +this.state.marketTokens;
  //   var invar = +this.state.invariant;
  //   var ethIn = tokenInput*10**18;
  //   var exchangeFee = ethIn/500;
  //   var ethSold = ethIn - exchangeFee;
  //   var newEthInMarket = ethInMarket + ethSold;
  //   var newTokensInMarket = invar/newEthInMarket;
  //   var tokensOut = tokensInMarket - newTokensInMarket;
  //   var buyRate = tokensOut/ethIn;
  //   this.setState({rate: buyRate,
  //                  fee: exchangeFee,
  //                  output: tokensOut
  //                  });
  // }

  render() {
    //console.log(localweb3)
    return (
      <div className={this.state.connected ? "App" : "App dim"}>
        <Head />
        <section className="title">
          <div className="logo border pa2">
            <span role="img" aria-label="Unicorn">🦄</span>
          </div>
          <NetworkStatus network={this.state.networkMessage} connected={this.state.connected} address={this.state.currentMaskAddress}/>
        </section>
        <HelperMessages interaction={this.state.interaction} inputToken={this.state.inputToken} outputToken={this.state.outputToken}/>
        <section className="order">
          <div className="value border pa2">
            <input type="number" value={this.state.input} placeholder="0" onChange={this.onInputChange} />
            <SelectToken token={this.state.inputToken} onSelectToken={this.onSelectToken} type="input" />
            <p className="dropdown">{'<'}</p>
          </div>
          <div className="arrow border pa2">
            <p>→</p>
          </div>
          <div className="value border pa2">
            <input type="number" value={this.state.output/10**18} placeholder="0"/>
            <SelectToken token={this.state.outputToken} onSelectToken={this.onSelectToken} type="output"/>
            <p className="dropdown">{'<'}</p>
          </div>
        </section>
        <section className="rate border pa2">
          <span className="rate-info">
            <p>Rate</p>
            <p>{this.state.rate} {this.state.outputToken.value + "/" + this.state.inputToken.value}</p>
          </span>
          <span className="rate-info">
            <p>Fee</p>
            <p>{this.state.fee/10**18} {this.state.inputToken.value}</p>
          </span>
        </section>
        {this.state.interaction === 'input' ?
          <section className="swap border pa2">
            <a href="#" role="button" onClick={() => {this.ethToTokenPurchase() }}>
              {"I want to swap " + this.state.input + " " + this.state.inputToken.value + " for " + this.state.output/10**18 + " " + this.state.outputToken.value}
            </a>
          </section>
          : <section className="swap hidden border pa2"></section>}
        <section className="links">
          <a href="" className="link border pa2">
            <p className="underline">Provide Liquidity to collect fees</p>
            <p>+</p>
          </a>
          <a href="" className="link border pa2">
            <p className="underline">Add a new token</p>
            <p>+</p>
          </a>
        </section>
        <section className="links">
          <a href="" className="link border pa2">
            <p className="underline">About</p>
            <p>↘</p>
          </a>
        </section>
      </div>
    );
  }
}

export default App;
