import React, { Component } from 'react';
import Web3 from 'web3';

import Head from './components/Head'
import NetworkStatus from './components/NetworkStatus'
import HelperMessages from './components/HelperMessages'
import SelectToken from './components/SelectToken'
import './App.css';

import {exchangeABI} from './helpers/exchangeABI.js'
import {tokenABI} from './helpers/tokenABI.js'
import {factoryABI} from './helpers/factoryABI.js'

var localweb3;

class App extends Component {
  constructor (props) {
    super(props)
    if (typeof props.metamask !== 'undefined'){
      localweb3 = new Web3(window.web3.currentProvider)
    } else {
      localweb3 = null
    }

    const uniExchangeAddress = '0xcDc30C3b02c5776495298198377D2Fc0fd6B1F1C';
    const uniExchangeContract = new localweb3.eth.Contract(exchangeABI, uniExchangeAddress);

    const swapExchangeAddress = '0x4632a7Cd732c625dcc48d75E289c209422e1D2B7';
    const swapExchangeContract = new localweb3.eth.Contract(exchangeABI, swapExchangeAddress);

    const uniTokenAddress = '0x350E5DD084ecF271e8d3531D4324443952F47756';
    const uniTokenContract = new localweb3.eth.Contract(tokenABI, uniTokenAddress);

    const swapTokenAddress = '0x8B2A87F8243f23C33fb97E23a21Ae8EDB3b71AcA';
    const swapTokenContract = new localweb3.eth.Contract(tokenABI, swapTokenAddress);

    const factoryAddress = '0xD6D22d102A4237F3D35361BC022a78789E6174Aa';
    const factoryContract = new localweb3.eth.Contract(factoryABI, factoryAddress);

    this.state = {
      uniExchangeAddress: '0xcDc30C3b02c5776495298198377D2Fc0fd6B1F1C',
      swapExchangeAddress: '0x4632a7Cd732c625dcc48d75E289c209422e1D2B7',
      uniTokenAddress: '0x350E5DD084ecF271e8d3531D4324443952F47756',
      swapTokenAddress: '0x8B2A87F8243f23C33fb97E23a21Ae8EDB3b71AcA',
      currentMaskAddress: '0x0000000000000000000000000000000000000000',
      factoryAddress: '0xD6D22d102A4237F3D35361BC022a78789E6174Aa',
      uniExchange: uniExchangeContract,
      uniToken: uniTokenContract,
      swapExchange: swapExchangeContract,
      swapToken: swapTokenContract,
      factory: factoryContract,
      ethBalance: 0,
      tokenBalance: 0,
      tokenAllowance: null,
      invariant1: 0,
      marketEth1: 0,
      marketTokens1: 0,
      invariant2: 0,
      marketEth2: 0,
      marketTokens2: 0,
      rate: 0,
      fee: 0,
      cost: 0,
      networkMessage: '',
      locked: false,
      connected: false,
      interaction: 'disconnected',
      exchangeType: 'ETH to Token',
      input: 0,
      output: 0,
      inputToken: { value: 'ETH',
                    label: 'ETH',
                    clearableValue: false
                  },
      outputToken: { value: 'UNI',
                     label: 'UNI',
                     clearableValue: false
                  }
    }
  }

  componentWillMount(){
    this.getMetaMaskAddress();
    this.checkNetwork();
  }

  componentDidMount(){
    this.getAccountInfo();
    this.getMarketInfo('output', 'UNI');
    // setInterval(this.helloWorld, 2000);
  }

  // helloWorld = () => {
  //   console.log('Hello World')
  // }

  getAccountInfo = () => {
    this.getEthBalance();
    this.getTokenBalance();
    this.getAllowance();
  }

  getMarketInfo = (type, symbol) => {
    this.getInvarient(type, symbol);
    this.getMarketEth(type, symbol);
    this.getMarketTokens(type, symbol);
  }

  getMetaMaskAddress = () => {
    localweb3.eth.getAccounts((error, result) => {
      if(!error)
          this.setState({currentMaskAddress: result[0]})
      else
        this.setState({locked: true})
    })
  }

  getEthBalance = () => {
    localweb3.eth.getBalance(this.state.currentMaskAddress, (error, balance) => {
      this.setState({ethBalance: balance});
    });
  }

  getTokenBalance = () => {
    this.state.uniToken.methods.balanceOf(this.state.currentMaskAddress).call((error, balance) => {
      var amount = balance;
      this.setState({tokenBalance: amount});
    });
  }

  getAllowance = () => {
    // this.state.uniToken.methods.allowance(this.state.currentMaskAddress, this.uniExchangeAddress).call().then(function(result, error){
    //   var amount = result
    //   this.setState({tokenAllowance: amount});
    // })
  }

  tokenToExchangeFactoryLookup = (tokenAddress) => {
    this.state.factory.methods.tokenToExchangeLookup(tokenAddress).call((error, exchangeAddress) => {
        console.log(exchangeAddress)
    });
  }

  checkNetwork() {
    localweb3.eth.net.getNetworkType((err, networkId) => {
      console.log("Connected to " + networkId)
      switch (networkId) {
        case "main":
          this.setState({networkMessage: 'Ethereum Mainet', connected: false, interaction: 'disconnected'});
          break;
        case "morden":
         this.setState({networkMessage: 'Morden testnet', connected: false, interaction: 'disconnected'});
         break;
        case "ropsten":
          this.setState({networkMessage: 'Ropsten testnet', connected: false, interaction: 'disconnected'});
          break;
        case "rinkeby":
          this.setState({networkMessage: '', connected: true, interaction: 'connected'});
          break;
        case "kovan":
          this.setState({networkMessage: 'Kovan testnet', connected: false, interaction: 'disconnected'});
          break;
        default:
          this.setState({networkMessage: 'an Unknown network', connected: false, interaction: 'disconnected'});
      }
    })
  }

  getInvarient = (type, symbol) => {
    var exchange;
    if(symbol === 'UNI') {
      exchange = this.state.uniExchange;
    } else if(symbol === 'SWAP') {
      exchange = this.state.swapExchange;
    }

    if (type === 'input') {
      exchange.methods.invariant().call().then((result, error) => {
        this.setState({invariant1: result});
        // console.log("invariant1: " + result);
      })
    } else if (type === 'output') {
        exchange.methods.invariant().call().then((result, error) => {
          this.setState({invariant2: result});
          // console.log("invariant2: " + result);
        })
    }
  }

  getMarketEth = (type, symbol) => {
    var exchange;
    if(symbol === 'UNI') {
      exchange = this.state.uniExchange;
    } else if(symbol === 'SWAP') {
      exchange = this.state.swapExchange;
    }

    if (type === 'input') {
      exchange.methods.ethInMarket().call().then((result, error) => {
        this.setState({marketEth1: result});
        // console.log("marketEth1: " + result);
      })
    } else if (type === 'output') {
        exchange.methods.ethInMarket().call().then((result, error) => {
          this.setState({marketEth2: result});
          // console.log("marketEth2: " + result);
        })
    }
  }

  getMarketTokens = (type, symbol) => {
    var exchange;
    if(symbol === 'UNI') {
      exchange = this.state.uniExchange;
    } else if(symbol === 'SWAP') {
      exchange = this.state.swapExchange;
    }

    if (type === 'input') {
      exchange.methods.tokensInMarket().call().then((result, error) => {
        this.setState({marketTokens1: result});
        // console.log("marketTokens1: " + result);
      })
    } else if (type === 'output') {
        exchange.methods.tokensInMarket().call().then((result, error) => {
          this.setState({marketTokens2: result});
          // console.log("marketTokens2: " + result);
        })
    }
  }

  onSelectToken = (selected, type) => {
    // console.log(selected)
    // console.log(type)
    this.setState({input: 0, output:0, rate:0, fee: 0, interaction: 'connected'})
    var marketType = '';
    if (type === 'input') {
      this.setState({inputToken: selected});
      if (selected.value === this.state.outputToken.value) {
        marketType = 'Invalid';
        this.setState({interaction: 'error1'});
      } else if (selected.value === 'ETH'){
          marketType = 'ETH to Token';
          this.getMarketInfo('output', this.state.outputToken.value);
      } else if (this.state.outputToken.value === 'ETH'){
          marketType = 'Token to ETH';
          this.getMarketInfo('input', selected.value);
      } else{
          marketType = 'Token to Token';
          this.getMarketInfo('input', selected.value);
          this.getMarketInfo('output', this.state.outputToken.value);
      }
    } else if (type === 'output'){
      this.setState({outputToken: selected});
      if (selected.value === this.state.inputToken.value) {
        marketType = 'Invalid';
        this.setState({interaction: 'error1'});
      } else if (selected.value === 'ETH'){
          marketType = 'Token to ETH';
          this.getMarketInfo('input', this.state.outputToken.value);
      } else if (this.state.inputToken.value === 'ETH'){
          marketType = 'ETH to Token';
          this.getMarketInfo('output', selected.value);
      } else{
          marketType = 'Token to Token';
          this.getMarketInfo('input', this.state.inputToken.value);
          this.getMarketInfo('output', selected.value);
      }
    }
    console.log(type + ': ' + selected.value);
    console.log('Exchange Type: ' + marketType);
    this.setState({exchangeType: marketType});
  }

  onInputChange = (event) => {
    var inputValue = event.target.value;
    var marketType = this.state.exchangeType;

    if (marketType === 'Invalid'){
      this.setState({input: inputValue, output: 0, interaction: 'error1'});
    } else if(inputValue && inputValue !== 0 && inputValue !== '0'){
        this.setState({input: inputValue, interaction: 'input'});
        this.getExchangeRate(inputValue);
    } else {
        this.setState({input: inputValue, output: 0, interaction: 'connected'});
    }
  }

  getExchangeRate = (input) => {
    if (this.state.exchangeType === 'ETH to Token') {
      console.log('Getting Rate: ETH to ' + this.state.outputToken.value);
      this.ethToTokenRate(input);
    } else if (this.state.exchangeType === 'Token to ETH') {
      console.log('Getting Rate: ETH to ' + this.state.outputToken.value);
      this.tokenToEthRate(input);
    } else if (this.state.exchangeType === 'Token to Token') {
      console.log('Getting Rate: ' + this.state.inputToken.value + ' to '  + this.state.outputToken.value);
      this.tokenToTokenRate(input);
    }
  }

  purchaseTokens = () => {
    if (this.state.exchangeType === 'ETH to Token') {
      this.ethToTokenPurchase();
    } else if (this.state.exchangeType === 'Token to ETH') {
      this.tokenToEthPurchase();
    } else if (this.state.exchangeType === 'Token to Token') {
      this.tokenToTokenPurchase();
    }
  }

  ethToTokenRate = (ethInput) => {
    var ethInMarket = +this.state.marketEth2;
    var tokensInMarket = +this.state.marketTokens2;
    var invar = +this.state.invariant2;
    var ethIn = ethInput*10**18;
    var exchangeFee = ethIn/500;
    var ethSold = ethIn - exchangeFee;
    var newEthInMarket = ethInMarket + ethSold;
    var newTokensInMarket = invar/newEthInMarket;
    var tokensOut = tokensInMarket - newTokensInMarket;
    var adjustedTokensOut = tokensOut * 0.98;
    var buyRate = adjustedTokensOut/ethIn;
    this.setState({rate: buyRate,
                   fee: exchangeFee,
                   output: adjustedTokensOut
                   });
  }

  tokenToEthRate = (tokenInput) => {
    var ethInMarket = +this.state.marketEth1;
    var tokensInMarket = +this.state.marketTokens1;
    var invar = +this.state.invariant1;
    var tokensIn = tokenInput*10**18;
    var exchangeFee = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee;
    var newTokensInMarket = tokensInMarket + tokensSold;
    var newEthInMarket = invar/newTokensInMarket;
    var ethOut = ethInMarket - newEthInMarket;
    var adjustedEthOut = ethOut * 0.98;
    var buyRate = adjustedEthOut/tokensIn;
    this.setState({rate: buyRate,
                   fee: exchangeFee,
                   output: adjustedEthOut
                   });
  }

  tokenToTokenRate = (tokenInput) => {
    // Token to ETH on Exchange 1
    var ethInMarket1 = +this.state.marketEth1;
    var tokensInMarket1 = +this.state.marketTokens1;
    var invar1 = +this.state.invariant1;
    var tokensIn = tokenInput*10**18;
    var exchangeFee1 = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee1;
    var newTokensInMarket1 = tokensInMarket1 + tokensSold;
    var newEthInMarket1 = invar1/newTokensInMarket1;
    var ethToExchange2 = ethInMarket1 - newEthInMarket1;
    // ETH to Token on Exchange 2
    var ethInMarket2 = +this.state.marketEth2;
    var tokensInMarket2 = +this.state.marketTokens2;
    var invar2 = +this.state.invariant2;
    var exchangeFee2 = ethToExchange2/500;
    var ethSold = ethToExchange2 - exchangeFee2;
    var newEthInMarket2 = ethInMarket2 + ethSold;
    var newTokensInMarket2 = invar2/newEthInMarket2;
    var tokensOut = tokensInMarket2 - newTokensInMarket2;
    var adjustedTokensOut = tokensOut * 0.98;
    var buyRate = adjustedTokensOut/tokensIn;
    this.setState({rate: buyRate,
                   fee: exchangeFee1,
                   output: adjustedTokensOut
                   });
  }

  ethToTokenPurchase = () => {
    var exchange;
    if(this.state.outputToken.value === 'UNI') {
      exchange = this.state.uniExchange;
      console.log('ETH to UNI purchase');
    } else if(this.state.outputToken.value === 'SWAP') {
      exchange = this.state.swapExchange;
      console.log('ETH to SWAP purchase');
    }

    var minTokens = this.state.output/10**18;
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var ethSold = this.state.input;
    var weiSold = localweb3.utils.toWei(ethSold);

    localweb3.eth.getBlock('latest', (error, blockInfo) => {
        var time = blockInfo.timestamp;
        var timeout = time + 300; //current block time + 5mins

        exchange.methods.ethToTokenSwap(minTokensInt, timeout).send(
          {from: this.state.currentMaskAddress, value: weiSold})
          .on('transactionHash', console.log('Transaction Hash created'))
          .on('receipt', (receipt) => {console.log(receipt)})  //Success
          .on('confirmation', (confirmationNumber, receipt) => {console.log(confirmationNumber)})  //Transaction Mined - Not working?
          .on('error', console.error);
    });
  }

  tokenToEthPurchase = () => {
    var exchange;
    if(this.state.inputToken.value === 'UNI') {
      exchange = this.state.uniExchange;
      console.log('ETH to UNI purchase');
    } else if(this.state.inputToken.value === 'SWAP') {
      exchange = this.state.swapExchange;
      console.log('ETH to SWAP purchase');
    }

    var minEth = this.state.output/10**18;
    var minEthInt = localweb3.utils.toWei(minEth);
    var tokensSold = this.state.input;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);

    localweb3.eth.getBlock('latest', (error, blockInfo) => {
        var time = blockInfo.timestamp;
        var timeout = time + 300; //current block time + 5mins

        exchange.methods.tokenToEthSwap(tokensSoldInt, minEthInt, timeout).send(
          {from: this.state.currentMaskAddress})
          .on('transactionHash', console.log('Transaction Hash created'))
          .on('receipt', (receipt) => {console.log(receipt)})  //Transaction submitted to blockchain
          .on('confirmation', (confirmationNumber, receipt) => {console.log(confirmationNumber)})  //Transaction Mined - Not working?
          .on('error', console.error);
    });
  }

  tokenToTokenPurchase = () => {
    var exchange;
    var tokenOutAddress;
    if(this.state.inputToken.value === 'UNI') {
      exchange = this.state.uniExchange;
      tokenOutAddress = this.state.swapTokenAddress;
      console.log('UNI to SWAP purchase');
    } else if(this.state.inputToken.value === 'SWAP') {
      exchange = this.state.swapExchange;
      tokenOutAddress = this.state.uniTokenAddress;
      console.log('SWAP to UNI purchase');
    }

    var minTokens = this.state.output/10**18;
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var tokensSold = this.state.input;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);

    localweb3.eth.getBlock('latest', (error, blockInfo) => {
        var time = blockInfo.timestamp;
        var timeout = time + 300; //current block time + 5mins

        exchange.methods.tokenToTokenSwap(tokenOutAddress, tokensSoldInt, minTokensInt, timeout).send(
          {from: this.state.currentMaskAddress})
          .on('transactionHash', console.log('Transaction Hash created'))
          .on('receipt', (receipt) => {console.log(receipt)})  //Success
          .on('confirmation', (confirmationNumber, receipt) => {console.log(confirmationNumber)})  //Transaction Mined - Not working?
          .on('error', console.error);
    });
  }

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
            <a href="#" role="button" onClick={() => {this.purchaseTokens() }}>
              {"I want to swap " + this.state.input + " " + this.state.inputToken.value + " for " + this.state.output/10**18 + " " + this.state.outputToken.value}
            </a>
          </section>
          : <section className="swap hidden border pa2"></section>}
        <section className="links">
          <a href="" className="link border pa2">
            <p className="underline">Provide liquidity to collect fees</p>
            <p>+</p>
          </a>
          <a href="" className="link border pa2">
            <p className="underline">Launch a new exchange</p>
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
