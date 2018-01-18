import React, { Component } from 'react';
import Web3 from 'web3';

import Head from './components/Head'
import NetworkStatus from './components/NetworkStatus'
import HelperMessages from './components/HelperMessages'
import SelectToken from './components/SelectToken'
import './App.css';

import {uniswapABI, tokenABI} from './helpers/abi.js'

var localweb3;

class App extends Component {
  constructor (props) {
    super(props)
    if (typeof props.metamask !== 'undefined'){
      localweb3 = new Web3(window.web3.currentProvider)
    } else {
      localweb3 = null
    }

    const uniswapAddress = '0x60e5f3cd0381c501971b6fbbddaa49cfd58a4fa1';
    const uniContract = new localweb3.eth.Contract(uniswapABI, uniswapAddress);

    const tokenAddress = '0xca9901076d02f89794262869aad1340bd45d8489';
    const tokenContract = new localweb3.eth.Contract(tokenABI, tokenAddress);

    this.state = {
      uniswapAddress: '0x60e5f3cd0381c501971b6fbbddaa49cfd58a4fa1',
      tokenAddress: '0xca9901076d02f89794262869aad1340bd45d8489',
      uniswapContract: uniContract,
      tokenContract: tokenContract,
      ethBalance: 0,
      tokenBalance: 0,
      tokenAllowance: null,
      currentMaskAddress: '0x0000000000000000000000000000000000000000',
      minimumTokensPurchased: null,
      minimumEthPurchased: null,
      invariant: 0,
      marketEth: 0,
      marketTokens: 0,
      tokenBuyRate: 0,
      ethBuyRate: 0,
      tokenCost: 0,       //eth price of tokens
      ethCost: 0,        //token price of eth
      tokenFee: 0,
      ethFee: 0,
      networkMessage: '',
      locked: false,
      connected: false,
      interaction: 'disconnected',
      input: 0,
      output: 0,
      inputToken: { value: 'ETH', label: 'ETH', clearableValue: false },
      outputToken: { value: 'OMG', label: 'OMG', clearableValue: false }
    }

    this.onBuyEthInputChange = this.onBuyEthInputChange.bind(this);
    this.onBuyTokensInputChange = this.onBuyTokensInputChange.bind(this);
    this.tokenBuyRate = this.tokenBuyRate.bind(this);
    this.ethBuyRate = this.ethBuyRate.bind(this);
  }

  componentWillMount(){
    this.getMetaMaskAddress();
    this.checkNetwork();
    this.getInvarient();
    this.getMarketEth();
    this.getMarketTokens();
  }

  componentDidMount(){
    this.getAccountInfo();
    this.getContractInfo();
  }

  getAccountInfo(){
    setTimeout(() => {
      this.getEthBalance();
      this.getTokenBalance();
      this.getAllowance();
    }, 1000);
  }

  getContractInfo(){
    setTimeout(() => {
      this.ethBuyRate(1);
      this.tokenBuyRate(1);
    }, 1000);
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
      var ethValue = (balance/10**18);
      var roundedValue=Math.round(ethValue*10000)/10000;
      self.setState({ethBalance: roundedValue});
    });
  }

  getTokenBalance() {
    var self = this;
    this.state.tokenContract.methods.balanceOf(this.state.currentMaskAddress).call(function(error, balance) {
      var amount = balance/10**6;
      self.setState({tokenBalance: amount});
    });
  }

  getAllowance() {
    var self = this;
    // this.state.tokenContract.methods.allowance(this.state.currentMaskAddress, this.uniswapAddress).call().then(function(result, error){
    //   var amount = result/10**6
    //   self.setState({tokenAllowance: amount});
    // })
  }

  checkNetwork() {
    var self = this;

    localweb3.eth.net.getNetworkType((err, networkId) => {
      console.log(networkId)
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
    })
  }
  getMarketEth() {
    var self = this
    this.state.uniswapContract.methods.totalEthQuantity().call().then(function(result, error){
      self.setState({marketEth: result});
    })
  }
  getMarketTokens() {
    var self = this
    this.state.uniswapContract.methods.totalTokenQuantity().call().then(function(result, error){
      self.setState({marketTokens: result});
    })
  }

  tokenBuyRate(buyTokensInput) {
    if(buyTokensInput >= this.state.marketTokens/10**6) {
      this.setState(
        {tokenBuyRate: 0,
         tokenCost: 0,
         tokenFee: 0,
         tokenBuyError: 'Not enough tokens'
        });
    }
    else{
      var tokensPurchased = buyTokensInput;
      var invar = this.state.invariant/10**24;
      var totalTokens = this.state.marketTokens/10**6;
      var totalEth = this.state.marketEth/10**18;
      var newTotalEth = invar/(totalTokens-tokensPurchased);
      var fee = (newTotalEth - totalEth)/500;
      var ethRequired = newTotalEth - totalEth + fee;
      var rate = tokensPurchased/ethRequired;
      //add 1% to cost displayed, some people will get more tokens than purchased
      //less TX's will fail the minTokens smart contract check
      var adjustedTokenCost = ethRequired*1.01;
      this.setState(
        {tokenBuyRate: rate,
         tokenCost: adjustedTokenCost,
         tokenFee: fee
         });
    }
  }

  ethBuyRate(buyEthInput) {
    if(buyEthInput >= this.state.marketEth/10**18) {
      this.setState(
        {ethBuyRate: 0,
         ethCost: 0,
         ethFee: 0,
         ethBuyError: 'Not enough tokens'
        });
    }
    else{
      var ethPurchased = buyEthInput;
      var invar = this.state.invariant/10**24;
      var totalEth = this.state.marketEth/10**18;
      var totalTokens = this.state.marketTokens/10**6;
      var newTotalTokens = invar/(totalEth-ethPurchased);
      var fee = (newTotalTokens - totalTokens)/500;
      var tokensRequired = newTotalTokens - totalTokens + fee;
      var rate = ethPurchased/(tokensRequired);
      //add 1% to cost displayed, some people will get more eth than purchased
      //less TX's will fail the minEth smart contract check
      var adjustedEthCost = tokensRequired*1.01;
      this.setState(
        {ethBuyRate: rate,
         ethCost: adjustedEthCost,
         ethFee: fee
         });
    }
  }

  buyTokens() {
    var self = this;
    var minTokens = this.state.minimumTokensPurchased

    localweb3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        self.state.uniswapContract.methods.ethToTokens(minTokens, maxTime).send(
          {from: self.state.currentMaskAddress, value: self.state.tokenCost*10**18},
          function(err, txHash) {})
    });
  }

  buyEth() {
    var self = this;
    var minEth = this.state.minimumEthPurchased;
    var minWei = localweb3.utils.toWei(minEth);
    var tokensSold = this.state.ethCost*10**6;

    localweb3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        self.state.uniswapContract.methods.tokenToEth(tokensSold, minWei, maxTime).send(
          {from: self.state.currentMaskAddress},
          function(err, txHash) {})
    });
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

  onBuyTokensInputChange = (event) => {
    var buyTokensInput = event.target.value;
    if(buyTokensInput && buyTokensInput !== 0){
      this.setState({ minimumTokensPurchased: buyTokensInput });
      this.tokenBuyRate(buyTokensInput);
    }
  }

  onBuyEthInputChange = (event) => {
    var buyEthInput = event.target.value;
    if(buyEthInput && buyEthInput !== 0){
      this.setState({ minimumEthPurchased: buyEthInput, input: buyEthInput, output: this.state.tokenBuyRate.toFixed(3)*buyEthInput, interaction: 'input'});
      this.ethBuyRate(buyEthInput);
    } else {
      this.setState({input: buyEthInput, output: this.state.tokenBuyRate.toFixed(3)*buyEthInput, interaction: 'connected'});
    }
  }

  render() {
    console.log(localweb3)
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
            <input type="number" value={this.state.input} placeholder="0" onChange={this.onBuyEthInputChange} onChange={this.onBuyEthInputChange} />
            <SelectToken token={this.state.inputToken} onSelectToken={this.onSelectToken} type="input" />
            <p className="dropdown">{'<'}</p>
          </div>
          <div className="arrow border pa2">
            <p>→</p>
          </div>
          <div className="value border pa2">
            <input type="number" value={this.state.output} placeholder="0" onChange={this.onBuyTokensInputChange}/>
            <SelectToken token={this.state.outputToken} onSelectToken={this.onSelectToken} type="output"/>
            <p className="dropdown">{'<'}</p>
          </div>
        </section>
        <section className="rate border pa2">
          <span className="rate-info">
            <p>Rate</p>
            <p>{this.state.tokenBuyRate.toFixed(3)} UNI/ETH</p>
          </span>
          <span className="rate-info">
            <p>Cost</p>
            <p>{this.state.tokenCost.toFixed(5)} ETH</p>
          </span>
          <span className="rate-info">
            <p>Fee</p>
            <p>{this.state.tokenFee.toFixed(5)} ETH</p>
          </span>
        </section>
        {this.state.interaction === 'input' ?
          <section className="swap border pa2">
            <a href="">{"I want to swap " + this.state.input + " " + this.state.inputToken.value + " for " + this.state.output + " " + this.state.outputToken.value}</a>
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
