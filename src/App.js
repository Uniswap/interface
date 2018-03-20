import React, { Component } from 'react';
import Web3 from 'web3';
import cookie from 'react-cookies'

import Head from './components/Head'
import NetworkStatus from './components/NetworkStatus'
import ConnectionHelper from './components/ConnectionHelper'
import Transactions from './components/Transactions'
// import SelectToken from './components/SelectToken'
import './App.css';

// enter the react refactor 
import About from './components/About';
import Links from './components/Links';
import Swap from './components/Swap';
import Order from './components/Order';
import OrderContainer from './containers/OrderContainer';
import RateAndFee from './components/RateAndFee';

import { exchangeABI } from './helpers/exchangeABI.js'
import { tokenABI } from './helpers/tokenABI.js'
import { factoryABI } from './helpers/factoryABI.js'

// enter redux
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import {
  web3ConnectionSuccessful,
  web3ConnectionUnsuccessful,
  setCurrentMaskAddress,
  metamaskLocked,
  metamaskUnlocked,
  setInteractionState,
  factoryContractReady,
  setNetworkMessage,
  setBlockTimestamp,
  setExchangeType,
  initializeGlobalWeb3
} from './actions/web3-actions';

import {
  uniExchangeContractReady,
  swtExchangeContractReady
} from './actions/exchangeContract-actions';

import {
  uniTokenContractReady,
  swtTokenContractReady
} from './actions/tokenContract-actions';

import {
  setInputBalance,
  setOutputBalance,
  setInputToken,
  setOutputToken,
  setInvariant1,
  setInvariant2,
  setMarketEth1,
  setMarketEth2,
  setMarketTokens1,
  setMarketTokens2,
  setAllowanceApprovalState,
  setExchangeInputValue,
  setExchangeOutputValue,
  setExchangeRate,
  setExchangeFee
} from './actions/exchange-actions';

// redux-subscribe 
import { subscribe } from 'redux-subscriber';

// enter d3
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
      this.props.web3ConnectionUnsuccessful();
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
      this.checkNetwork();
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
        this.props.web3ConnectionSuccessful();
        this.getContracts();
      } else {
        this.props.metamaskLocked();
        this.props.web3ConnectionUnsuccessful();
        this.props.setInteractionState('locked');
      }
    })
  }
  // fun fact, localweb3.eth.getAccounts will return something even without anything inside 
  getUserAddress = () => {
   localweb3.eth.getAccounts((error, result) => {
      if (result.length > 0) {
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.web3ConnectionSuccessful();
      }
      else {
        this.props.metamaskLocked();
        this.props.web3ConnectionUnsuccessful();
        this.props.setInteractionState('locked');
      }
    })
  }
  
  checkNetwork = () => {
    localweb3.eth.net.getNetworkType((err, networkId) => {
      console.log("Connected to " + networkId)
      switch (networkId) {
        case "main":
          this.props.setNetworkMessage('Ethereum Mainet');
          this.props.web3ConnectionUnsuccessful();
          this.props.setInteractionState('disconnected');
          break;
        case "morden":
          this.props.setNetworkMessage('Morden testnet');
          this.props.web3ConnectionUnsuccessful();
          this.props.setInteractionState('disconnected');
          break;
        case "ropsten":
          this.props.setNetworkMessage('Ropsten testnet');
          this.props.web3ConnectionUnsuccessful();
          this.props.setInteractionState('disconnected');
          break;
        case "rinkeby":
          this.props.setNetworkMessage('Rinkeby testnet');
          this.props.web3ConnectionSuccessful();
          this.props.setInteractionState('connected');
          break;
        case "kovan":
          this.props.setNetworkMessage('Kovan testnet');
          this.props.web3ConnectionUnsuccessful();
          this.props.setInteractionState('disconnected');
          break;
        default:
          this.props.setNetworkMessage('an unknown network');
          this.props.web3ConnectionUnsuccessful();
          this.props.setInteractionState('disconnected');
      }
    })
  }

  // will require rewriting the connectionStatus reducer to take in true or falsa
  // connectionSetter = (networkMessage, connectionStatus, interactionState) => {
  //   this.props.setNetworkMessage(networkMessage)
  // }

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
 
  getExchangeRate = (input) => {
    if (this.props.web3Store.exchangeType === 'ETH to Token') {
      console.log('Getting Rate: ETH to ' + this.props.exchange.outputToken.value);
      this.ethToTokenRate(input);
    } else if (this.props.web3Store.exchangeType === 'Token to ETH') {
      console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to ETH');
      this.tokenToEthRate(input);
    } else if (this.props.web3Store.exchangeType === 'Token to Token') {
      console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to '  + this.props.exchange.outputToken.value);
      this.tokenToTokenRate(input);
    }
  }

  ethToTokenRate = (ethInput) => {
    var ethInMarket = +this.props.exchange.marketEth2;
    var tokensInMarket = +this.props.exchange.marketTokens2;
    var invar = +this.props.exchange.invariant2;
    var ethIn = ethInput*10**18;
    var exchangeFee = ethIn/500;
    var ethSold = ethIn - exchangeFee;
    var newEthInMarket = ethInMarket + ethSold;
    var newTokensInMarket = invar/newEthInMarket;
    var tokensOut = tokensInMarket - newTokensInMarket;
    var adjustedTokensOut = tokensOut * 0.98;
    var buyRate = adjustedTokensOut/ethIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee);
    this.props.setExchangeOutputValue(adjustedTokensOut);
  }

  tokenToEthRate = (tokenInput) => {
    var ethInMarket = +this.props.exchange.marketEth1;
    var tokensInMarket = +this.props.exchange.marketTokens1;
    var invar = +this.props.exchange.invariant1;
    var tokensIn = tokenInput*10**18;
    var exchangeFee = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee;
    var newTokensInMarket = tokensInMarket + tokensSold;
    var newEthInMarket = invar/newTokensInMarket;
    var ethOut = ethInMarket - newEthInMarket;
    var adjustedEthOut = ethOut * 0.98;
    var buyRate = adjustedEthOut/tokensIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee);
    this.props.setExchangeOutputValue(adjustedEthOut);
  }

  tokenToTokenRate = (tokenInput) => {
    // Token to ETH on Exchange 1
    var ethInMarket1 = +this.props.exchange.marketEth1;
    var tokensInMarket1 = +this.props.exchange.marketTokens1;
    var invar1 = +this.props.exchange.invariant1;
    var tokensIn = tokenInput*10**18;
    var exchangeFee1 = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee1;
    var newTokensInMarket1 = tokensInMarket1 + tokensSold;
    var newEthInMarket1 = invar1/newTokensInMarket1;
    var ethToExchange2 = ethInMarket1 - newEthInMarket1;
    // ETH to Token on Exchange 2
    var ethInMarket2 = +this.props.exchange.marketEth2;
    var tokensInMarket2 = +this.props.exchange.marketTokens2;
    var invar2 = +this.props.exchange.invariant2;
    var exchangeFee2 = ethToExchange2/500;
    var ethSold = ethToExchange2 - exchangeFee2;
    var newEthInMarket2 = ethInMarket2 + ethSold;
    var newTokensInMarket2 = invar2/newEthInMarket2;
    var tokensOut = tokensInMarket2 - newTokensInMarket2;
    var adjustedTokensOut = tokensOut * 0.98;
    var buyRate = adjustedTokensOut/tokensIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee1);
    this.props.setExchangeOutputValue(adjustedTokensOut);
  }

  purchaseTokens = async () => {
    await this.props.setBlockTimestamp(this.props.web3Store.globalWeb3);
    if (this.props.web3Store.exchangeType === 'ETH to Token') {
      this.ethToTokenPurchase();
    } else if (this.props.web3Store.exchangeType === 'Token to ETH') {
      this.tokenToEthPurchase();
    } else if (this.props.web3Store.exchangeType=== 'Token to Token') {
      this.tokenToTokenPurchase();
    }
  }
  
  // YOU ARE HERE NOW
  ethToTokenPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.props.exchange.outputToken.value);
    var minTokens = (this.props.exchange.outputValue/10**18).toString();
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var ethSold = this.props.exchange.inputValue;
    var weiSold = localweb3.utils.toWei(ethSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
    // console.log(minTokensInt, weiSold, timeout);

    exchange.methods.ethToTokenSwap(minTokensInt, timeout).send({from: this.props.web3Store.currentMaskAddress, value: weiSold})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result);
        // transactions is cookie stuff, we'll keep that in state
        this.setState({ transactions: transactions })
        // any particular reason why there are initialized as 0, but get turned to empty strings after the transaction is over?
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {
        console.log(receipt)
      })  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log("Block Confirmations: " + confirmationNumber)
        if(confirmationNumber === 1) {
          this.getAccountInfo();
        }
      })  //Transaction Mined
      .on('error', console.error);
  }

  // tokenToEth and EthToToken purchase functions are very similar structurally
  // maybe we can make this more DRY in refactor
  tokenToEthPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.props.exchange.inputToken.value);
    var minEth = (this.props.exchange.outputValue/10**18).toString();
    var minEthInt = localweb3.utils.toWei(minEth);
    var tokensSold = this.props.exchange.inputValue;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
  
    exchange.methods.tokenToEthSwap(tokensSoldInt, minEthInt, timeout).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result)
        this.setState({ transactions: transactions });
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  tokenToTokenPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.props.exchange.inputToken.value);
    var tokenOutAddress = this.symbolToTokenAddress(this.props.exchange.outputToken.value);
    var minTokens = (this.props.exchange.outputValue/10**18).toString();
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var tokensSold = this.props.exchange.inputValue;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
    console.log('tokenOutAddress', tokenOutAddress);
    console.log('minTokensInt', minTokensInt);
    console.log('tokensSoldInt', tokensSoldInt);
    console.log('timeout', timeout);

    exchange.methods.tokenToTokenSwap(tokenOutAddress, tokensSoldInt, minTokensInt, timeout).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result)
        this.setState({ transactions: transactions });
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
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

  render() {
    return (
      <div className={this.props.web3Store.connected && !this.props.web3Store.metamaskLocked && this.props.web3Store.interaction !== 'disconnected' ? "App" : "App dim"}>
        <Head />
        <section className="title">
          <div className="logo border pa2">
            <span role="img" aria-label="Unicorn">🦄</span>
          </div>
          <NetworkStatus
            network={this.props.web3Store.networkMessage}
            connected={this.props.web3Store.connected}
            metamask={this.props.metamask}
            interaction={this.props.web3Store.interaction}
            address={this.props.web3Store.currentMaskAddress}
            locked={this.props.web3Store.metamaskLocked}
            balance={this.props.exchange.inputBalance}
          />
        </section>
        <ConnectionHelper
          network={this.props.web3Store.networkMessage}
          connected={this.props.web3Store.connected}
          metamask={this.props.metamask}
          address={this.props.web3Store.currentMaskAddress}
          locked={this.props.web3Store.metamaskLocked}
          approved={this.props.exchange.allowanceApproved}
          tokenAdded={this.state.tokenAdded}
          approveAllowance={this.approveAllowance}
          interaction={this.props.web3Store.interaction}
          exchangeType={this.props.web3Store.exchangeType}
          firstRun={this.state.firstRun}
          uniAdded={this.state.uniAdded}
          swapAdded={this.state.swapAdded}
          onCloseHelper={this.onCloseHelper}
          input={this.props.exchange.inputValue}
          balance={this.props.exchange.inputBalance}
          toggleAbout={this.toggleAbout}
          inputToken={this.props.exchange.inputToken}
          outputToken={this.props.exchange.outputToken}
          about={this.state.about}
        />
        <Order 
          getAccountInfo={this.getAccountInfo} 
          getMarketInfo={this.getMarketInfo}
          getExchangeRate={this.getExchangeRate}
          symbolToTokenContract={this.symbolToTokenContract}
          symbolToExchangeAddress={this.symbolToExchangeAddress}
        />
        <RateAndFee
          exchangeRate={this.props.exchange.rate}
          outputTokenValue={this.props.exchange.outputToken.value}
          inputTokenValue={this.props.exchange.inputToken.value}
          exchangeFee={this.props.exchange.fee}
        />
        <Swap
          interaction={this.props.web3Store.interaction}
          inputValue={this.props.exchange.inputValue }
          inputTokenValue={this.props.exchange.inputToken.value}
          outputValue={this.props.exchange.outputValue}
          outputTokenValue={this.props.exchange.outputToken.value}
          purchaseTokens={this.purchaseTokens}
        />
        <About />
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
    web3ConnectionSuccessful,
    web3ConnectionUnsuccessful,
    setCurrentMaskAddress,
    metamaskLocked,
    metamaskUnlocked,
    setInteractionState,
    factoryContractReady,
    uniExchangeContractReady,
    swtExchangeContractReady,
    uniTokenContractReady,
    swtTokenContractReady,
    setNetworkMessage,
    setBlockTimestamp,
    setExchangeType,
    setInputBalance,
    setOutputBalance,
    setInputToken,
    setOutputToken,
    setInvariant1,
    setInvariant2,
    setMarketEth1,
    setMarketEth2,
    setMarketTokens1,
    setMarketTokens2,
    setAllowanceApprovalState,
    setExchangeInputValue,
    setExchangeOutputValue,
    setExchangeRate,
    setExchangeFee,
    initializeGlobalWeb3
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
