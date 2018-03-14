import React, { Component } from 'react';
import Web3 from 'web3';
import scrollToComponent from 'react-scroll-to-component';
import cookie from 'react-cookies'

import Head from './components/Head'
import NetworkStatus from './components/NetworkStatus'
import ConnectionHelper from './components/ConnectionHelper'
import Transactions from './components/Transactions'
import SelectToken from './components/SelectToken'
import './App.css';

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
  setExchangeType
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
      about: false,
    }
  }

  // lets start with what's in the componentDidMount
  componentWillMount(){
    console.log('props', this.props)
    if(localweb3 === 'undefined') {
      this.props.web3ConnectionUnsuccessful();
    } else {
      this.setState({
        firstRun: cookie.load('firstRun') || true,
        swapAdded: cookie.load('swapAdded') || false,
        uniAdded: cookie.load('uniAdded') || false,
        transactions: cookie.load('transactions') || [],
      })
      this.getInfoFirstTime();
      this.checkNetwork();
      this.getBlock();
    }
  }

  componentDidMount(){
    if(localweb3 === 'undefined') {
      this.props.web3ConnectionUnsuccessful();
      console.log('props here', this.props)
    } else if(this.props.web3.connected === true) {
      console.log('successfully connected to metamask')
      setInterval(this.getBlock, 10000);
      setInterval(this.getMarketInfo, 15000);
      setInterval(this.getAccountInfo, 15000);
      setInterval(this.getUserAddress, 10000);
    } else {
      setInterval(this.getUserAddress, 500);
    }
  }

  componentWillReceiveProps(nextProps) {
    // console.log('nextProps', nextProps)
  }

  // getInfoFirstTime = async () => {
  //     await this.getUserAddress();
  //     if(this.props.web3.currentMaskAddress !== '') {
  //       await this.getContracts();
  //       this.getMarketInfo();
  //       this.getAccountInfo();
  //     }
  // }

  getInfoFirstTime = () => {
    localweb3.eth.getAccounts((error, result) => {
      console.log('getInfoFirstTime result', result)
      if(result.length > 0){
        // REEEEDUUUUUUXXX
        this.props.setCurrentMaskAddress(result[0]);
        this.props.metamaskUnlocked();
        this.props.web3ConnectionSuccessful();
        this.getContracts();
      }
      else {
        this.props.metamaskLocked();
        this.props.web3ConnectionUnsuccessful();
        this.props.setInteractionState('locked');

      }
    })
  }

  getUserAddress = async () => {
    // kind of redundant
    // only difference is getInfoFirstTime fires getContracts too
    // THIS FIRES EVERY TEN SECONDS, NEEDS A REFACTOR
    await localweb3.eth.getAccounts(async (error, result) => {
      if(result.length > 0) {
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

  getContracts = async () => {
    const uniExchangeAddress = this.props.web3.exchangeAddresses.UNI;
    const uniExchangeContract = new localweb3.eth.Contract(exchangeABI, uniExchangeAddress);
    this.props.uniExchangeContractReady(uniExchangeContract);

    const swapExchangeAddress = this.props.web3.exchangeAddresses.SWT;
    const swapExchangeContract = new localweb3.eth.Contract(exchangeABI, swapExchangeAddress);
    this.props.swtExchangeContractReady(swapExchangeContract);

    const uniTokenAddress = this.props.web3.tokenAddresses.UNI;
    const uniTokenContract = new localweb3.eth.Contract(tokenABI, uniTokenAddress);
    this.props.uniTokenContractReady(uniTokenContract);

    const swapTokenAddress = this.props.web3.tokenAddresses.SWT;
    const swapTokenContract = new localweb3.eth.Contract(tokenABI, swapTokenAddress);
    this.props.swtTokenContractReady(swapTokenContract);

    const factoryAddress = this.props.web3.factoryAddress;
    const factoryContract = new localweb3.eth.Contract(factoryABI, factoryAddress);
    this.props.factoryContractReady(factoryContract);

    this.getAccountInfo();
    this.getMarketInfo();
  }

  checkNetwork() {
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

  getBlock = () => {
    localweb3.eth.getBlock('latest', (error, blockInfo) => {
      this.props.setBlockTimestamp(blockInfo.timestamp);
    });
  }

  symbolToTokenAddress = (symbol) => {
    if(symbol === 'UNI') {
      return this.props.web3.exchangeAddresses.UNI;
    } else if (symbol === 'SWAP') {
      return this.props.web3.exchangeAddresses.SWT;
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
      return this.props.web3.exchangeAddresses.UNI;
    } else if(symbol === 'SWAP') {
      return this.props.web3.exchangeAddresses.SWT;
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
    switch (this.props.web3.exchangeType) {
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

  getAccountInfo = () => {
    switch (this.props.web3.exchangeType) {
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
      localweb3.eth.getBalance(this.props.web3.currentMaskAddress, (error, balance) => {
        this.props.setInputBalance(balance);
        // console.log('ETH Balance: ' + balance);
      });
    } else if (type === 'output') {
        localweb3.eth.getBalance(this.props.web3.currentMaskAddress, (error, balance) => {
          this.props.setOutputBalance(balance);
          // console.log('ETH Balance: ' + balance);
        });
    }
  }

  getTokenBalance = (type) => {
    var token;
    if (type === 'input') {
      token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      token.methods.balanceOf(this.props.web3.currentMaskAddress).call((error, balance) => {
        this.props.setInputBalance(balance);
        // console.log(this.props.exchange.inputToken.value + ' Balance: ' + balance);
      });
    } else if (type === 'output') {
        token = this.symbolToTokenContract(this.props.exchange.outputToken.value);
        token.methods.balanceOf(this.props.web3.currentMaskAddress).call((error, balance) => {
          this.props.setOutputBalance(balance);
          // console.log(this.props.exchange.outputToken.value + ' Balance: ' + balance);
        });
    }
  }

  getAllowance = () => {
    var type = this.props.web3.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);

      token.methods.allowance(this.props.web3.currentMaskAddress, exchangeAddress).call().then((result, error) => {
        console.log(this.props.exchange.inputToken.value + ' allowance: ' + result);
        if(result === '0'){
          this.props.setAllowanceApprovalState(false)
          console.log(this.props.exchange.allowanceApproved)
        }
      })
    }
  }

  approveAllowance = () => {
    var type = this.props.web3.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.props.exchange.inputToken.value);
      var amount = localweb3.utils.toWei('100000');

      token.methods.approve(exchangeAddress, amount).send({from: this.props.web3.currentMaskAddress})
      .on('transactionHash', console.log('Transaction Hash created'))
      .on('receipt', (receipt) => {
        console.log(receipt)
        this.props.setAllowanceApprovalState(true);
      })  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
    }
  }

  // TODO: stuff
  tokenToExchangeFactoryLookup = (tokenAddress) => {
    this.props.web3.factoryContract.methods.tokenToExchangeLookup(tokenAddress).call((error, exchangeAddress) => {
        console.log(exchangeAddress)
    });
  }

  onSelectToken = async (selected, type) => {
    this.props.setExchangeInputValue(0);
    this.props.setExchangeOutputValue(0);
    this.props.setExchangeRate(0);
    this.props.setExchangeFee(0);
    this.props.setInteractionState('connected');
    this.setState({ firstRun: true })

    if (type === 'input') {
      await this.props.setInputToken(selected);
    } else if (type === 'output'){
      await this.props.setOutputToken(selected);
    }

    await this.getMarketType();
    this.getAccountInfo();
    this.getMarketInfo();
  }

  getMarketType = () => {
    var marketType = '';

    if (this.props.exchange.inputToken.value === this.props.exchange.outputToken.value) {
      marketType = 'Invalid';
      this.props.setInteractionState('error1');
    } else if (this.props.exchange.inputToken.value === 'ETH'){
        marketType = 'ETH to Token';
    } else if (this.props.exchange.outputToken.value === 'ETH'){
        marketType = 'Token to ETH';
    } else{
        marketType = 'Token to Token';
    }
    this.props.setExchangeType(marketType);
    console.log('type: ', marketType);
    console.log('input: ', this.props.exchange.inputToken.value);
    console.log('output: ', this.props.exchange.outputToken.value);
  }

  onInputChange = async (event) => {
    var inputValue = event.target.value;
    await this.props.setExchangeInputValue(inputValue);
    this.setExchangeOutput();
  }

  setExchangeOutput = () => {
    var inputValue = this.props.exchange.inputValue;
    if (this.props.web3.exchangeType === 'Invalid'){
      this.props.setExchangeOutputValue(0);
      this.props.setInteractionState('error1');
    } else if(inputValue && inputValue !== 0 && inputValue !== '0'){
        this.props.setInteractionState('input');
        this.getExchangeRate(inputValue);
    } else {
        this.props.setExchangeOutputValue(0);
        this.props.setInteractionState('connected');
    }
  }

  getExchangeRate = (input) => {
    if (this.props.web3.exchangeType === 'ETH to Token') {
      console.log('Getting Rate: ETH to ' + this.props.exchange.outputToken.value);
      this.ethToTokenRate(input);
    } else if (this.props.web3.exchangeType === 'Token to ETH') {
      console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to ETH');
      this.tokenToEthRate(input);
    } else if (this.props.web3.exchangeType === 'Token to Token') {
      console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to '  + this.props.exchange.outputToken.value);
      this.tokenToTokenRate(input);
    }
  }

  purchaseTokens = () => {
    if (this.props.web3.exchangeType === 'ETH to Token') {
      this.ethToTokenPurchase();
    } else if (this.props.web3.exchangeType === 'Token to ETH') {
      this.tokenToEthPurchase();
    } else if (this.props.web3.exchangeType=== 'Token to Token') {
      this.tokenToTokenPurchase();
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

  // YOU ARE HERE NOW
  ethToTokenPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.props.exchange.outputToken.value);
    var minTokens = (this.props.exchange.outputValue/10**18).toString();
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var ethSold = this.props.exchange.inputValue;
    var weiSold = localweb3.utils.toWei(ethSold);
    var timeout = this.props.web3.blockTimestamp + 300; //current block time + 5mins
    console.log(minTokensInt, weiSold, timeout);

    exchange.methods.ethToTokenSwap(minTokensInt, timeout).send({from: this.props.web3.currentMaskAddress, value: weiSold})
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
    var timeout = this.props.web3.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.tokenToEthSwap(tokensSoldInt, minEthInt, timeout).send({from: this.props.web3.currentMaskAddress})
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
    var timeout = this.props.web3.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.tokenToTokenSwap(tokenOutAddress, tokensSoldInt, minTokensInt, timeout).send({from: this.props.web3.currentMaskAddress})
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

  toggleAbout = () => {

    this.setState({about: !this.state.about})
    setTimeout(this.scrollToAbout, 300);
  }

  scrollToAbout = () => {
    scrollToComponent(this.About, { offset: 0, align: 'top', duration: 500})
  }

  render() {
    return (
      <div className={this.props.web3.connected && !this.props.web3.metamaskLocked && this.props.web3.interaction !== 'disconnected' ? "App" : "App dim"}>
        <Head />
        <section className="title">
          <div className="logo border pa2">
            <span role="img" aria-label="Unicorn">🦄</span>
          </div>
          <NetworkStatus
            network={this.props.web3.networkMessage}
            connected={this.props.web3.connected}
            metamask={this.props.metamask}
            interaction={this.props.web3.interaction}
            address={this.props.web3.currentMaskAddress}
            locked={this.props.web3.metamaskLocked}
            balance={this.props.exchange.inputBalance}/>
        </section>
        <ConnectionHelper
          network={this.props.web3.networkMessage}
          connected={this.props.web3.connected}
          metamask={this.props.metamask}
          address={this.props.web3.currentMaskAddress}
          locked={this.props.web3.metamaskLocked}
          approved={this.props.exchange.allowanceApproved}
          tokenAdded={this.state.tokenAdded}
          approveAllowance={this.approveAllowance}
          interaction={this.props.web3.interaction}
          exchangeType={this.props.web3.exchangeType}
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
        <section className="order">
          <div className="value border pa2">
            <input type="number" value={this.props.exchange.inputValue} placeholder="0" onChange={this.onInputChange} />
            <SelectToken token={this.props.exchange.inputToken} onSelectToken={this.onSelectToken} type="input" />
            <p className="dropdown">{'<'}</p>
          </div>
          <div className="arrow border pa2">
            <p>→</p>
          </div>
          <div className="value border pa2">
            <input type="number" readOnly={true} value={(this.props.exchange.outputValue/10**18).toFixed(5)} placeholder="0"/>
            <SelectToken token={this.props.exchange.outputToken} onSelectToken={this.onSelectToken} type="output"/>
            <p className="dropdown">{'<'}</p>
          </div>
        </section>
        <section className="rate border pa2">
          <span className="rate-info">
            <p>Rate</p>
            <p>{(this.props.exchange.rate).toFixed(5)} {this.props.exchange.outputToken.value + "/" + this.props.exchange.inputToken.value}</p>
          </span>
          <span className="rate-info">
            <p>Fee</p>
            <p>{(this.props.exchange.fee/10**18).toFixed(5)} {this.props.exchange.inputToken.value}</p>
          </span>
        </section>

        {this.props.web3.interaction === 'input' ?
          <a className="swap border pa2" role="button" onClick={() => {this.purchaseTokens()}}>

              <b>{"I want to swap " + this.props.exchange.inputValue + " " + this.props.exchange.inputToken.value + " for " + this.props.exchange.outputValue/10**18 + " " + this.props.exchange.outputToken.value}</b>
          </a>
          : <a className="swap grey-bg hidden border pa2"></a>}

        <section className="About" ref={(section) => { this.About = section; }}>
          <a onClick={() => {this.toggleAbout()}} className="link border pa2 f-a">
            <p className="underline">About Uniswap.</p>
            <p>↘</p>
          </a>
        </section>

        {this.state.about ?
          <section className="expand grey-bg border pa2">
            <p>Uniswap is a trustless, decentralized exchange for Ether and ERC20 tokens. It uses a market maker mechanism, where liquidity providers invest a reserve of ETH and a single ERC20 token within an Ethereum smart contract. An exchange rate is set between the tokens and ETH based on the relative availibility of each token. A small transaction fee is payed to the liquidity providers proportional to their investment.</p>
            <p>There is a separate contract for each ETH-ERC20 pair. These contracts can "tunnel" between each other for direct ERC20-ERC20 trades. Only one exchange can exist per token, and anyone can contribute liquidity to any exchange. A factory/registry contract provides a public interface for creating new Uniswap exchanges, and looking up the exchange associated a given token address.</p>
            <p>A full writeup will be available soon. Until then, here is some more info on Market Makers:</p>
            <p>Please reach out if you would like to get involved or support the project.</p>
            <p>Email: <a href="mailto:hayden@uniswap.io">hayden@uniswap.io</a></p>
          </section>
          : <section className="expand grey-bg border pa2 hidden">  </section>
        }

        <section className="links">
          <a href="" className="link border pa2 liq">
            <p className="underline">Provide liquidity to collect fees</p>
            <p>+</p>
          </a>
          <a href="" className="link border pa2 ex">
            <p className="underline">Launch a new exchange</p>
            <p>+</p>
          </a>
        </section>

        {this.state.transactions.length > 0 && this.props.web3.interaction !== 'disconnected' ?
        <section className="transaction border pa2">
          <p className="underline">Past Transactions:</p>
          <Transactions transactions={this.state.transactions}/>
        </section>
        : <section className="hidden border pa2"></section>}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  web3: state.web3,
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
    setExchangeFee
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
