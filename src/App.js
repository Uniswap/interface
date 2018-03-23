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
import Transactions from './components/Transactions';
// import SelectToken from './components/SelectToken'
// enter redux
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import { subscribe } from 'redux-subscriber';
// redux actions
// import { initializeGlobalWeb3 } from './actions/global-actions';
import { uniExchangeContractReady, swtExchangeContractReady } from './actions/exchangeContract-actions';
import { uniTokenContractReady, swtTokenContractReady } from './actions/tokenContract-actions';
import { initializeGlobalWeb3, setWeb3ConnectionStatus, setCurrentMaskAddress, metamaskLocked, metamaskUnlocked, setInteractionState, factoryContractReady, toggleAbout } from './actions/web3-actions';
import { setInputBalance, setOutputBalance, setInvariant1, setInvariant2, setMarketEth1, setMarketEth2, setMarketTokens1, setMarketTokens2, setAllowanceApprovalState } from './actions/exchange-actions';
// enter d3 & misc. tools
import './App.css';
import cookie from 'react-cookies'
import scrollToComponent from 'react-scroll-to-component';
// import Candlesticks from './components/Candlesticks'

var localweb3; // this isn't even in state

class App extends Component {
  constructor (props) {
    super(props)
    if (typeof props.metamask !== 'undefined'){
      localweb3 = new Web3(window.web3.currentProvider)
    } else {
      localweb3 = 'undefined'
    }

    this.state = {
      uniAdded: false, // cookie stuff,
      swapAdded: false, // cookie stuff
      firstRun: true, // cookie stuff
      transactions: [], // cookie stuff
    }
  }
  // TODO: get rid of redundant localweb3 === 'undefined' checks in componentWill/DidMount
  // STATUS: kind of done 
  componentWillMount() {
    console.log('props', this.props);
    if(localweb3 === 'undefined') {
      this.props.setWeb3ConnectionStatus(false);
    } else {
      this.setState({
        firstRun: cookie.load('firstRun') || true,
        swapAdded: cookie.load('swapAdded') || false,
        uniAdded: cookie.load('uniAdded') || false,
        transactions: cookie.load('transactions') || [],
      })
      // we're working with asynchronous redux 
      this.props.initializeGlobalWeb3(localweb3)
      this.getInfoFirstTime();
    }
  }

  componentDidMount (){
    // basic format to wrap functions you want firing upon a certain state change
    // eslint-disable-next-line no-unused-vars
    const web3Subscriber = subscribe('web3Store.connected', state => {
      if(state.web3Store.connected === true && !state.web3Store.metamaskLocked) {
        console.log('successfully connected to metamask', state.web3Store.currentMaskAddress);
        setInterval(this.getMarketInfo, 15000);
        setInterval(this.getAccountInfo, 15000);
        setInterval(this.getUserAddress, 10000);
      } else {
        console.log('web3 not connected, getting user address')
        setInterval(this.getUserAddress, 500);
      }
    })   
  }
 
  componentWillReceiveProps(nextProps) {
    //console.log('nextProps', nextProps)
  }
  // TODO: getInfoFirstTime and getUserAddress are WET af 
  // lets do something about it 
  getInfoFirstTime = () => {
    localweb3.eth.getAccounts((error, result) => {
      if(result.length > 0){
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.setWeb3ConnectionStatus(true)
        this.getContracts();
      } else {
        this.props.metamaskLocked();
        this.props.setWeb3ConnectionStatus(false)
        this.props.setInteractionState('locked');
      }
    })
  }
  // fun fact, localweb3.eth.getAccounts will return something even without anything inside 
  getUserAddress = () => {
   localweb3.eth.getAccounts((error, result) => {
      if (result.length > 0) {
        console.log('getUserAddress metamask unlocked')
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.setWeb3ConnectionStatus(true);
      }
      else {
        console.log('getUserAddress metamask Locked ')
        this.props.metamaskLocked();
        this.props.setWeb3ConnectionStatus(false);
        this.props.setInteractionState('locked');
      }
    })
  }

  // could possibly use refactoring 
  getContracts = () => {
    const uniExchangeAddress = this.props.web3Store.exchangeAddresses.UNI;
    const uniExchangeContract = new localweb3.eth.Contract(exchangeABI, uniExchangeAddress);
    this.props.uniExchangeContractReady(uniExchangeContract);

    const swapExchangeAddress = this.props.web3Store.exchangeAddresses.SWT;
    const swapExchangeContract = new localweb3.eth.Contract(exchangeABI, swapExchangeAddress);
    this.props.swtExchangeContractReady(swapExchangeContract);

    const uniTokenAddress = this.props.web3Store.tokenAddresses.UNI;
    const uniTokenContract = new localweb3.eth.Contract(tokenABI, uniTokenAddress);
    this.props.uniTokenContractReady(uniTokenContract);

    const swapTokenAddress = this.props.web3Store.tokenAddresses.SWT;
    const swapTokenContract = new localweb3.eth.Contract(tokenABI, swapTokenAddress);
    this.props.swtTokenContractReady(swapTokenContract);

    const factoryAddress = this.props.web3Store.factoryAddress;
    const factoryContract = new localweb3.eth.Contract(factoryABI, factoryAddress);
    this.props.factoryContractReady(factoryContract);

    this.getAccountInfo();
    this.getMarketInfo();
  }
   
  symbolToTokenAddress = (symbol) => {
    if(symbol === 'UNI') {
      return this.props.web3Store.tokenAddresses.UNI;
    } else if (symbol === 'SWAP') {
      return this.props.web3Store.tokenAddresses.SWT;
    }
  }

  symbolToTokenContract = (symbol) => {
    if(symbol === 'UNI') {
      return this.props.tokenContracts.UNI;
    } else if(symbol === 'SWAP') {
      return this.props.tokenContracts.SWT;
    }
  }

  symbolToExchangeAddress = (symbol) => {
    if(symbol === 'UNI') {
      return this.props.web3Store.exchangeAddresses.UNI;
    } else if(symbol === 'SWAP') {
      return this.props.web3Store.exchangeAddresses.SWT;
    }
  }

  symbolToExchangeContract = (symbol) => {
    if(symbol === 'UNI') {
      return this.props.exchangeContracts.UNI;
    } else if(symbol === 'SWAP') {
      return this.props.exchangeContracts.SWT;
    }
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
  // will need to bring this out into a higher order component (we'll put that to the side for now)
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
      default:
    }
    console.log("Getting account info");
  }
  
  getExchangeState = (type) => {
    var exchange;
    if (type === 'input') {
      exchange = this.symbolToExchangeContract(this.props.exchange.inputToken.value);
      exchange.methods.invariant().call().then((result, error) => {
        this.props.setInvariant1(result);
        // console.log('Input Invariant: ' + result);
      });

      exchange.methods.ethInMarket().call().then((result, error) => {
        this.props.setMarketEth1(result);
        // console.log('Input Market ETH: ' + result);
      });

      exchange.methods.tokensInMarket().call().then((result, error) => {
        this.props.setMarketTokens1(result);
        // console.log('Input Market Tokens: ' + result);
      });

    } else if (type === 'output') {
        exchange = this.symbolToExchangeContract(this.props.exchange.outputToken.value);
        exchange.methods.invariant().call().then((result, error) => {
          this.props.setInvariant2(result);
          // console.log('Output Invariant: ' + result);
        });

        exchange.methods.ethInMarket().call().then((result, error) => {
          this.props.setMarketEth2(result);
          // console.log('Output Market ETH: ' + result);
        });

        exchange.methods.tokensInMarket().call().then((result, error) => {
          this.props.setMarketTokens2(result);
          // console.log('Output Market Tokens: ' + result);
        });
    }
  }

  getEthBalance = (type) => {
    if (type === 'input') {
      localweb3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
        this.props.setInputBalance(balance);
        // console.log('ETH Balance: ' + balance);
      });
    } else if (type === 'output') {
        localweb3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
          this.props.setOutputBalance(balance);
          // console.log('ETH Balance: ' + balance);
        });
    }
  }

  getTokenBalance = (type) => {
    var token;
    if (type === 'input') {
      token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, balance) => {
        this.props.setInputBalance(balance);
        // console.log(this.props.exchange.inputToken.value + ' Balance: ' + balance);
      });
    } else if (type === 'output') {
        token = this.symbolToTokenContract(this.props.exchange.outputToken.value);
        token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, balance) => {
          this.props.setOutputBalance(balance);
          // console.log(this.props.exchange.outputToken.value + ' Balance: ' + balance);
        });
    }
  }

  getAllowance = () => {
    var type = this.props.web3Store.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);

      token.methods.allowance(this.props.web3Store.currentMaskAddress, exchangeAddress).call().then((result, error) => {
        console.log(this.props.exchange.inputToken.value + ' allowance: ' + result);
        if(result === '0'){
          this.props.setAllowanceApprovalState(false)
          console.log(this.props.exchange.allowanceApproved)
        }
      })
    }
  }

  approveAllowance = () => {
    var type = this.props.web3Store.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);
      var amount = localweb3.utils.toWei('100000');

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
    this.props.web3Store.factoryContract.methods.tokenToExchangeLookup(tokenAddress).call((error, exchangeAddress) => {
      console.log(exchangeAddress)
    });
  }
 
  onCloseHelper = () => {
    if(this.props.exchange.outputToken.value === 'UNI'){
      this.setState({ uniAdded: true }) // cookie stuff
      cookie.save('uniAdded', true, { path: '/' })
    } else if(this.props.exchange.outputToken.value === 'SWAP'){
      this.setState({ swapAdded: true }) // more cookie stuff
      cookie.save('swapAdded', true, { path: '/' })
    } else {
      this.setState({ firstRun: !this.state.firstRun }) // also cookie stuff
      cookie.save('firstRun', !this.state.firstRun, { path: '/' })
    }
  }

  toggleAbout = () => {
    let current = this.props.web3Store.aboutToggle;
    this.props.toggleAbout(!current);
    setTimeout(this.scrollToAbout, 300);
  }

  scrollToAbout = () => {
    scrollToComponent(this.About, { offset: 0, align: 'top', duration: 500})
  }

  
  render() {
    return (
      <div className={this.props.web3Store.connected && !this.props.web3Store.metamaskLocked && this.props.web3Store.interaction !== 'disconnected' ? "App" : "App dim"}>
        <UniHead />
        <Header metamask={this.props.metamask}/>
        <ConnectionHelper
          metamask={this.props.metamask}
          approveAllowance={this.approveAllowance}
          firstRun={this.state.firstRun}
          uniAdded={this.state.uniAdded}
          swapAdded={this.state.swapAdded}
          onCloseHelper={this.onCloseHelper}
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
        <About toggleAbout={this.toggleAbout} location={this}/>
        <Links />
        <Transactions transactions={this.state.transactions} interaction={this.props.web3Store.interaction} />
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
    uniExchangeContractReady,
    swtExchangeContractReady,
    uniTokenContractReady,
    swtTokenContractReady,
    setInputBalance,
    setOutputBalance,
    setInvariant1,
    setInvariant2,
    setMarketEth1,
    setMarketEth2,
    setMarketTokens1,
    setMarketTokens2,
    setAllowanceApprovalState,
    initializeGlobalWeb3,
    toggleAbout
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
