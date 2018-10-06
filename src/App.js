import React, { Component } from 'react';
// web3
import Web3 from 'web3';
import { exchangeABI } from './helpers/exchangeABI.js'
import { tokenABI } from './helpers/tokenABI.js'
import { factoryABI } from './helpers/factoryABI.js'
// React Components
import UniHead from './components/UniHead'
import Header from './components/Header';
import ConnectionHelper from './components/ConnectionHelper'
import Exchange from './components/Exchange';
import RateAndFee from './components/RateAndFee';
import Purchase from './components/Purchase';
import About from './components/About';
import Links from './components/Links';
import SharePurchase from './components/SharePurchase';
// import Transactions from './components/Transactions';
import Visualization from './components/Visualization';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import { subscribe } from 'redux-subscriber';
// redux actions
import {  exchangeContractReady } from './ducks/exchange-contract';
import {  tokenContractReady } from './ducks/token-contract';
import {  initializeGlobalWeb3,
          setWeb3ConnectionStatus,
          setCurrentMaskAddress,
          metamaskLocked,
          metamaskUnlocked,
          setInteractionState,
          factoryContractReady,
          toggleAbout,
          toggleInvest } from './ducks/web3';
import {  setInputBalance,
          setOutputBalance,
          setEthPool1,
          setEthPool2,
          setTokenPool1,
          setTokenPool2,
          setAllowanceApprovalState,
          setInvestToken,
          setInvestEthPool,
          setInvestTokenPool,
          setInvestTokenAllowance,
          setInvestShares,
          setUserShares,
          setInvestTokenBalance,
          setInvestEthBalance } from './ducks/exchange';
import './App.css';
import scrollToComponent from 'react-scroll-to-component';

var web3;

class App extends Component {
  constructor (props) {
    super(props)
    if (typeof props.metamask !== 'undefined'){
      web3 = new Web3(window.web3.currentProvider)
    } else {
      web3 = 'undefined'
    }
  }
  // TODO: get rid of redundant web3 === 'undefined' checks in componentWill/DidMount
  componentWillMount() {
    //console.log('props', this.props);
    if(web3 === 'undefined') {
      this.props.setWeb3ConnectionStatus(false);
    } else {
      this.props.initializeGlobalWeb3(web3)
      this.getInfoFirstTime();
    }
  }

  componentDidMount (){
    // basic format to wrap functions you want firing upon a certain state change
    // eslint-disable-next-line no-unused-vars
    const web3Subscriber = subscribe('web3Store.connected', state => {
      if(state.web3Store.connected === true && !state.web3Store.metamaskLocked) {
        this.marketInterval = setInterval(this.getMarketInfo, 10000);
        this.accountInterval = setInterval(this.getAccountInfo, 10000);
        this.userInterval = setInterval(this.getUserAddress, 500);
      } else {
        console.log('web3 not connected, getting user address')
        console.log('this.props.currentMaskAddress', this.props.currentMaskAddress)
        this.otherUserInterval = setInterval(this.getUserAddress, 500);
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    //console.log('nextProps', nextProps)
  }
  // TODO: improve getInfoFirstTime and getUserAddress
  getInfoFirstTime = () => {
    web3.eth.getAccounts(async (error, result) => {
      if(result.length > 0){
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.setWeb3ConnectionStatus(true)
        await this.getContracts();
        this.getAccountInfo();
        this.getMarketInfo();
      } else {
        this.props.metamaskLocked();
        this.props.setWeb3ConnectionStatus(false)
        this.props.setInteractionState('locked');
      }
    })
  }

  getUserAddress = () => {
   this.props.web3Store.web3.eth.getAccounts((error, result) => {
      if (result.length > 0) {
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.setWeb3ConnectionStatus(true);
      }
      else {
        this.props.setCurrentMaskAddress(undefined);
        clearInterval(this.marketInterval);
        clearInterval(this.accountInterval);
        clearInterval(this.userInterval);
        this.props.metamaskLocked();
        this.props.setWeb3ConnectionStatus(false);
        this.props.setInteractionState('locked');
      }
    })
  }

  // could possibly use refactoring
  getContracts = () => {
    const factoryAddress = this.props.web3Store.factoryAddress;
    const factoryContract = new this.props.web3Store.web3.eth.Contract(factoryABI, factoryAddress);
    this.props.factoryContractReady(factoryContract);

    this.props.web3Store.exchangeAddresses.addresses.map(async exchangeAddress => {
      // receive the exchange address, create the exchange contract
      let exchangeContract = await new this.props.web3Store.web3.eth.Contract(exchangeABI, exchangeAddress[1]);
      // send the exchange contract to redux store
      await this.props.exchangeContractReady(exchangeAddress[0], exchangeContract);
    })

    this.props.web3Store.tokenAddresses.addresses.map(async tokenAddress => {
      // receive the token address, create the token contract
      let tokenContract = await new this.props.web3Store.web3.eth.Contract(tokenABI, tokenAddress[1]);
      // send the token contract to redux store
      await this.props.tokenContractReady(tokenAddress[0], tokenContract);
    })
  }

  symbolToTokenAddress = (symbol) => {
    let tokenAddresses = this.props.web3Store.tokenAddresses.addresses;
    for (let i = 0; i < tokenAddresses.length; i++) {
      if (tokenAddresses[i][0] === symbol) {
        return tokenAddresses[i][1];
      }
    }
  }

  symbolToTokenContract = (symbol) => {
    return this.props.tokenContracts[symbol]
  }

  symbolToExchangeAddress = (symbol) => {
    let exchangeAddresses = this.props.web3Store.exchangeAddresses.addresses;
    for (let i = 0; i < exchangeAddresses.length; i++) {
      if (exchangeAddresses[i][0] === symbol) {
        return exchangeAddresses[i][1];
      }
    }
  }

  symbolToExchangeContract = (symbol) => {
    return this.props.exchangeContracts[symbol]
  }

  getMarketInfo = () => {
    switch (this.props.web3Store.exchangeType) {
      case 'ETH to Token':
        this.getExchangeState('output');
        break;
      case 'Token to ETH':
        this.getExchangeState('input');
        break;
      case 'Token to Token':
        this.getExchangeState('input');
        this.getExchangeState('output');
        break;
      default:
    }
  }
  // this quadruplet of functions will end up being shared amongst multiple components
  // will need to bring this out into a higher order component
  // TODO: multiple components currently need this function, we will pass it to them via props
  getAccountInfo = () => {
    switch (this.props.web3Store.exchangeType) {
      case 'ETH to Token':
        this.getEthBalance('input');
        this.getTokenBalance('output');
        break;
      case 'Token to ETH':
        this.getEthBalance('output');
        this.getTokenBalance('input');
        this.getAllowance();
        break;
      case 'Token to Token':
        this.getTokenBalance('input');
        this.getTokenBalance('output');
        this.getAllowance();
        break;
      case 'ETH to ETH':
        this.getEthBalance('input');
        this.getEthBalance('output');
        break;
      case 'Token to itself':
        this.getTokenBalance('input');
        this.getTokenBalance('output');
        this.getAllowance();
        break;
      default:
    }
  }

  getInvestInfo = () => {
    var symbol = this.props.exchange.investToken.value;
    if (symbol != "ETH") {
      var exchange = this.symbolToExchangeContract(symbol);
      var token = this.symbolToTokenContract(symbol);
      var exchangeAddress = this.symbolToExchangeAddress(symbol);

      exchange.methods.ethPool().call().then((result, error) => {
        this.props.setInvestEthPool(result);
      });

      exchange.methods.tokenPool().call().then((result, error) => {
        this.props.setInvestTokenPool(result);
      });

      exchange.methods.totalShares().call().then((result, error) => {
        this.props.setInvestShares(result);
      });

      exchange.methods.getShares(this.props.web3Store.currentMaskAddress).call().then((result, error) => {
        this.props.setUserShares(result);
      });

      token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, result) => {
        this.props.setInvestTokenBalance(result);
      });

      token.methods.allowance(this.props.web3Store.currentMaskAddress, exchangeAddress).call((error, result) => {
        this.props.setInvestTokenAllowance(result);
      });

      this.props.web3Store.web3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, result) => {
        this.props.setInvestEthBalance(result);
      });
    }
  }

  getExchangeState = (type) => {
    var exchange;
    if (type === 'input') {
      exchange = this.symbolToExchangeContract(this.props.exchange.inputToken.value);

      exchange.methods.ethPool().call().then((result, error) => {
        this.props.setEthPool1(result);
      });

      exchange.methods.tokenPool().call().then((result, error) => {
        this.props.setTokenPool1(result);
      });

    } else if (type === 'output') {
        exchange = this.symbolToExchangeContract(this.props.exchange.outputToken.value);

        exchange.methods.ethPool().call().then((result, error) => {
          this.props.setEthPool2(result);
        });

        exchange.methods.tokenPool().call().then((result, error) => {
          this.props.setTokenPool2(result);
        });
    }
  }

  getEthBalance = (type) => {
    if (type === 'input') {
      this.props.web3Store.web3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, result) => {
        this.props.setInputBalance(result);
      });
    } else if (type === 'output') {
        this.props.web3Store.web3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, result) => {
          this.props.setOutputBalance(result);
        });
    }
  }

  getTokenBalance = (type) => {
    var token;
    if (type === 'input') {
      token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, result) => {
        this.props.setInputBalance(result);
      });
    } else if (type === 'output') {
        token = this.symbolToTokenContract(this.props.exchange.outputToken.value);
        token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, result) => {
          this.props.setOutputBalance(result);
        });
    }
  }

  getAllowance = () => {
    var type = this.props.web3Store.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);

      token.methods.allowance(this.props.web3Store.currentMaskAddress, exchangeAddress).call().then((result, error) => {
        if(result === '0'){
          this.props.setAllowanceApprovalState(false)
        }
      })
    }
  }

  approveAllowance = () => {
    var type = this.props.web3Store.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);
      var amount = this.props.web3Store.web3.utils.toWei('100000');

      token.methods.approve(exchangeAddress, amount).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', console.log('Transaction Hash created'))
      .on('receipt', (receipt) => {
        console.log(receipt)
        this.props.setAllowanceApprovalState(true);
      })  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
    }
  }

  tokenToExchangeFactoryLookup = (tokenAddress) => {
    console.log('looking up exchange for token: ', tokenAddress)
    this.props.web3Store.factoryContract.methods.tokenToExchangeLookup(tokenAddress).call().then((result, error) => {
      if(error) {
        console.log(error);
      } else {
        console.log('exchange address: ', result);
      }
    });
  }

  launchExchange = (tokenAddress) => {
    this.props.web3Store.factoryContract.methods.launchExchange(tokenAddress).send({from: this.props.web3Store.currentMaskAddress})
    .on('transactionHash', console.log('Transaction Hash created'))
    .on('receipt', (receipt) => {
      console.log(receipt)
    })  //Transaction Submitted to blockchain
    .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
    .on('error', console.error);
  }

  toggleAbout = () => {
    let current = this.props.web3Store.aboutToggle;
    this.props.toggleAbout(!current);
    setTimeout(this.scrollToAbout, 300);
  }

  scrollToAbout = () => {
    scrollToComponent(this.About, { offset: 0, align: 'top', duration: 500})
  }

  toggleInvest = () => {
    this.getInvestInfo();
    let current = this.props.web3Store.investToggle;
    this.props.toggleInvest(!current);
    setTimeout(this.scrollToInvest, 300);
  }

  scrollToInvest = () => {
    scrollToComponent(this.Links, { offset: 0, align: 'top', duration: 500})
  }

  render() {
    return (
      <div className={this.props.web3Store.connected && !this.props.web3Store.metamaskLocked && this.props.web3Store.interaction !== 'disconnected' ? "App" : "App dim"}>
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
        {//<Transactions transactions={this.state.transactions} interaction={this.props.web3Store.interaction} />
        }
      </div>
    )
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store,
  exchangeContracts: state.exchangeContracts,
  tokenContracts: state.tokenContracts,
  exchange: state.exchange
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setWeb3ConnectionStatus,
    setCurrentMaskAddress,
    metamaskLocked,
    metamaskUnlocked,
    setInteractionState,
    factoryContractReady,
    setInputBalance,
    setOutputBalance,
    setEthPool1,
    setEthPool2,
    setTokenPool1,
    setTokenPool2,
    setAllowanceApprovalState,
    initializeGlobalWeb3,
    toggleAbout,
    toggleInvest,
    exchangeContractReady,
    tokenContractReady,
    setInvestToken,
    setInvestEthPool,
    setInvestTokenPool,
    setInvestTokenAllowance,
    setInvestShares,
    setUserShares,
    setInvestTokenBalance,
    setInvestEthBalance
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
