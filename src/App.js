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
      localweb3 = 'undefined'
    }

    this.state = {
      uniExchangeAddress: '',
      swapExchangeAddress: '',
      uniTokenAddress: '',
      swapTokenAddress: '',
      currentMaskAddress: '',
      factoryAddress: '',
      uniExchange: {},
      uniToken: {},
      swapExchange: {},
      swapToken: {},
      factory: {},
      blockTimestamp: 0,
      inputBalance: 0,
      outputBalance: 0,
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
      locked: true,
      connected: false,
      approved: true,
      uniAdded: false,
      swapAdded: false,
      firstRun: true,
      about: false,
      interaction: 'disconnected',
      exchangeType: 'ETH to Token',
      input: 0,
      output: 0,
      transactionStatus: 'waiting',
      transactions: [],
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
    if(localweb3 === 'undefined'){
      this.setState({connected: false})
    } else {
      this.setState({
        firstRun: cookie.load('firstRun') || true,
        swapAdded: cookie.load('swapAdded') || false,
        uniAdded: cookie.load('uniAdded') || false,
        transactions: cookie.load('transactions') || [],
      })
      this.getInfoFirstTime();
      // this.getContracts();
      this.getUserAddress();
      this.checkNetwork();
      this.getBlock();
    }
  }

  componentDidMount(){
    if(localweb3 === 'undefined'){
      this.setState({connected: false})
    } else if(this.state.connected === true) {
      setInterval(this.getBlock, 10000);
      setInterval(this.getMarketInfo, 15000);
      setInterval(this.getAccountInfo, 15000);
      setInterval(this.getUserAddress, 10000);
    } else {
      setInterval(this.getUserAddress, 500);
    }
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps)
  }

  getInfoFirstTime = () => {
    localweb3.eth.getAccounts((error, result) => {
      if(result.length > 0)
          this.setState({currentMaskAddress: result[0], locked: false, connected: true}, this.getContracts)
      else
        this.setState({locked: true, connected: false, interaction: 'locked'})
    })
  }

  getContracts() {
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

    this.setState({
      uniExchangeAddress: uniExchangeAddress,
      swapExchangeAddress: swapExchangeAddress,
      uniTokenAddress: uniTokenAddress,
      swapTokenAddress: swapTokenAddress,
      factoryAddress: factoryAddress,
      uniExchange: uniExchangeContract,
      uniToken: uniTokenContract,
      swapExchange: swapExchangeContract,
      swapToken: swapTokenContract,
      factory: factoryContract,
    }, this.getInfo)


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
          this.setState({networkMessage: 'Rinkeby testnet', connected: true, interaction: 'connected'});
          break;
        case "kovan":
          this.setState({networkMessage: 'Kovan testnet', connected: false, interaction: 'disconnected'});
          break;
        default:
          this.setState({networkMessage: 'an unknown network', connected: false, interaction: 'disconnected'});
      }
    })
  }

  getBlock = () => {
    localweb3.eth.getBlock('latest', (error, blockInfo) => {
      this.setState({blockTimestamp: blockInfo.timestamp})
    });
  }

  getUserAddress = () => {
    localweb3.eth.getAccounts((error, result) => {
      if(result.length > 0)
          this.setState({currentMaskAddress: result[0], locked: false, connected: true})
      else
        this.setState({locked: true, connected: false, interaction: 'locked'})
    })
  }

  symbolToTokenAddress = (symbol) => {
    if(symbol === 'UNI') {
      return this.state.uniTokenAddress;
    } else if(symbol === 'SWAP') {
      return this.state.swapTokenAddress;
    }
  }

  symbolToTokenContract = (symbol) => {
    if(symbol === 'UNI') {
      return this.state.uniToken;
    } else if(symbol === 'SWAP') {
      return this.state.swapToken;
    }
  }

  symbolToExchangeAddress = (symbol) => {
    if(symbol === 'UNI') {
      return this.state.uniExchangeAddress;
    } else if(symbol === 'SWAP') {
      return this.state.swapExchangeAddress;
    }
  }

  symbolToExchangeContract = (symbol) => {
    if(symbol === 'UNI') {
      return this.state.uniExchange;
    } else if(symbol === 'SWAP') {
      return this.state.swapExchange;
    }
  }

  getInfo = () => {
    this.getMarketInfo();
    this.getAccountInfo();
  }

  getMarketInfo = () => {
    switch (this.state.exchangeType) {
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
    switch (this.state.exchangeType) {
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
  }

  getExchangeState = (type) => {
    var exchange;
    if (type === 'input') {
      exchange = this.symbolToExchangeContract(this.state.inputToken.value);

      exchange.methods.invariant().call().then((result, error) => {
        this.setState({invariant1: result});
        // console.log('Input Invariant: ' + result);
      });

      exchange.methods.ethInMarket().call().then((result, error) => {
        this.setState({marketEth1: result});
        // console.log('Input Market ETH: ' + result);
      });

      exchange.methods.tokensInMarket().call().then((result, error) => {
        this.setState({marketTokens1: result});
        // console.log('Input Market Tokens: ' + result);
      });

    } else if (type === 'output') {
        exchange = this.symbolToExchangeContract(this.state.outputToken.value);
        exchange.methods.invariant().call().then((result, error) => {
          this.setState({invariant2: result});
          // console.log('Output Invariant: ' + result);
        });

        exchange.methods.ethInMarket().call().then((result, error) => {
          this.setState({marketEth2: result});
          // console.log('Output Market ETH: ' + result);
        });

        exchange.methods.tokensInMarket().call().then((result, error) => {
          this.setState({marketTokens2: result})
          // console.log('Output Market Tokens: ' + result);
        });
    }
  }

  getEthBalance = (type) => {
    if (type === 'input') {
      localweb3.eth.getBalance(this.state.currentMaskAddress, (error, balance) => {
        this.setState({inputBalance: balance});
        // console.log('ETH Balance: ' + balance);
      });
    } else if (type === 'output') {
        localweb3.eth.getBalance(this.state.currentMaskAddress, (error, balance) => {
          this.setState({outputBalance: balance});
          // console.log('ETH Balance: ' + balance);
        });
    }
  }

  getTokenBalance = (type) => {
    var token;
    if (type === 'input') {
      token = this.symbolToTokenContract(this.state.inputToken.value);
      token.methods.balanceOf(this.state.currentMaskAddress).call((error, balance) => {
        this.setState({inputBalance: balance});
        // console.log(this.state.inputToken.value + ' Balance: ' + balance);
      });
    } else if (type === 'output') {
        token = this.symbolToTokenContract(this.state.outputToken.value);
        token.methods.balanceOf(this.state.currentMaskAddress).call((error, balance) => {
          this.setState({outputBalance: balance});
          // console.log(this.state.outputToken.value + ' Balance: ' + balance);
        });
    }
  }

  getAllowance = () => {
    var type = this.state.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.state.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.state.inputToken.value);

      token.methods.allowance(this.state.currentMaskAddress, exchangeAddress).call().then((result, error) => {
        console.log(this.state.inputToken.value + ' allowance: ' + result);
        if(result === '0'){
          this.setState({approved: false})
          console.log(this.state.approved)
        }
      })
    }
  }

  approveAllowance = () => {
    var type = this.state.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      var token = this.symbolToTokenContract(this.state.inputToken.value);
      var exchangeAddress = this.symbolToExchangeAddress(this.state.inputToken.value);
      var amount = localweb3.utils.toWei('100000');

      token.methods.approve(exchangeAddress, amount).send({from: this.state.currentMaskAddress})
      .on('transactionHash', console.log('Transaction Hash created'))
      .on('receipt', (receipt) => {
        console.log(receipt)
        this.setState({approved: true})
      })  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
    }
  }

  tokenToExchangeFactoryLookup = (tokenAddress) => {
    this.state.factory.methods.tokenToExchangeLookup(tokenAddress).call((error, exchangeAddress) => {
        console.log(exchangeAddress)
    });
  }

  onSelectToken = (selected, type) => {
    this.setState({input: 0, output:0, rate:0, fee: 0, interaction: 'connected', firstRun: true})
    var marketType = '';
    if (type === 'input') {
      this.setState({inputToken: selected});
      if (selected.value === this.state.outputToken.value) {
        marketType = 'Invalid';
        this.setState({interaction: 'error1'});
      } else if (selected.value === 'ETH'){
          marketType = 'ETH to Token';
      } else if (this.state.outputToken.value === 'ETH'){
          marketType = 'Token to ETH';
      } else{
          marketType = 'Token to Token';
      }
    } else if (type === 'output'){
      this.setState({outputToken: selected});
      if (selected.value === this.state.inputToken.value) {
        marketType = 'Invalid';
        this.setState({interaction: 'error1'});
      } else if (selected.value === 'ETH'){
          marketType = 'Token to ETH';
      } else if (this.state.inputToken.value === 'ETH'){
          marketType = 'ETH to Token';
      } else{
          marketType = 'Token to Token';
      }
    }
    console.log(type + ': ' + selected.value);
    this.setState({exchangeType: marketType}, this.getInfo);
  }

  onInputChange = (event) => {
    var inputValue = event.target.value;
    var marketType = this.state.exchangeType;

    if (marketType === 'Invalid'){
      this.setState({input: inputValue, output: 0, interaction: 'error1'});
    } else if(inputValue && inputValue !== 0 && inputValue !== '0'){
        this.setState({input: inputValue, interaction: 'input'});
        console.log('input something')
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
      console.log('Getting Rate: ' + this.state.inputToken.value + ' to ETH');
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
    var exchange = this.symbolToExchangeContract(this.state.outputToken.value);
    var minTokens = (this.state.output/10**18).toString();
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var ethSold = this.state.input;
    var weiSold = localweb3.utils.toWei(ethSold);
    var timeout = this.state.blockTimestamp + 300; //current block time + 5mins
    console.log(minTokensInt, weiSold, timeout);

    exchange.methods.ethToTokenSwap(minTokensInt, timeout).send({from: this.state.currentMaskAddress, value: weiSold})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result)
        this.setState({transactions: transactions, input: '', output: '', interaction: 'submitted'})
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {
        console.log(receipt)
      })  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log("Block Confirmations: " + confirmationNumber)
      })  //Transaction Mined
      .on('error', console.error);
  }

  tokenToEthPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.state.inputToken.value);
    var minEth = (this.state.output/10**18).toString();
    var minEthInt = localweb3.utils.toWei(minEth);
    var tokensSold = this.state.input;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);
    var timeout = this.state.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.tokenToEthSwap(tokensSoldInt, minEthInt, timeout).send({from: this.state.currentMaskAddress})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result)
        this.setState({transactions: transactions, input: '', output: '', interaction: 'submitted'})
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  tokenToTokenPurchase = () => {
    var exchange = this.symbolToExchangeContract(this.state.inputToken.value);
    var tokenOutAddress = this.symbolToTokenAddress(this.state.outputToken.value);
    var minTokens = (this.state.output/10**18).toString();
    var minTokensInt = localweb3.utils.toWei(minTokens);
    var tokensSold = this.state.input;
    var tokensSoldInt = localweb3.utils.toWei(tokensSold);
    var timeout = this.state.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.tokenToTokenSwap(tokenOutAddress, tokensSoldInt, minTokensInt, timeout).send({from: this.state.currentMaskAddress})
      .on('transactionHash', (result) => {
        console.log('Transaction Hash created')
        let transactions = this.state.transactions
        transactions.push(result)
        this.setState({transactions: transactions, input: '', output: '', interaction: 'submitted'})
        cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  onCloseHelper = () => {
    if(this.state.outputToken.value === 'UNI'){
      this.setState({uniAdded: true})
      cookie.save('uniAdded', true, { path: '/' })
    } else if(this.state.outputToken.value === 'SWAP'){
      this.setState({swapAdded: true})
      cookie.save('swapAdded', true, { path: '/' })
    } else {
      this.setState({firstRun: !this.state.firstRun})
      cookie.save('firstRun', !this.state.firstRun, { path: '/' })
    }
  }

  toggleAbout = () => {
    this.setState({about: !this.state.about})
    setTimeout(this.scrollToAbout, 300)
  }

  scrollToAbout = () => {
      scrollToComponent(this.About, { offset: 0, align: 'top', duration: 500})
  }

  render() {
    return (
      <div className={this.state.connected && !this.state.locked && this.state.interaction !== 'disconnected' ? "App" : "App dim"}>
        <Head />
        <section className="title">
          <div className="logo border pa2">
            <span role="img" aria-label="Unicorn">🦄</span>
          </div>
          <NetworkStatus
            network={this.state.networkMessage}
            connected={this.state.connected}
            metamask={this.props.metamask}
            interaction={this.state.interaction}
            address={this.state.currentMaskAddress}
            locked={this.state.locked}
            balance={this.state.inputBalance}/>
        </section>
        <ConnectionHelper
          network={this.state.networkMessage}
          connected={this.state.connected}
          metamask={this.props.metamask}
          address={this.state.currentMaskAddress}
          locked={this.state.locked}
          approved={this.state.approved}
          tokenAdded={this.state.tokenAdded}
          approveAllowance={this.approveAllowance}
          interaction={this.state.interaction}
          exchangeType={this.state.exchangeType}
          firstRun={this.state.firstRun}
          uniAdded={this.state.uniAdded}
          swapAdded={this.state.swapAdded}
          onCloseHelper={this.onCloseHelper}
          input={this.state.input}
          balance={this.state.inputBalance}
          toggleAbout={this.toggleAbout}
          inputToken={this.state.inputToken}
          outputToken={this.state.outputToken}
          about={this.state.about}
        />
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
            <input type="number" readOnly={true} value={(this.state.output/10**18).toFixed(5)} placeholder="0"/>
            <SelectToken token={this.state.outputToken} onSelectToken={this.onSelectToken} type="output"/>
            <p className="dropdown">{'<'}</p>
          </div>
        </section>
        <section className="rate border pa2">
          <span className="rate-info">
            <p>Rate</p>
            <p>{(this.state.rate).toFixed(5)} {this.state.outputToken.value + "/" + this.state.inputToken.value}</p>
          </span>
          <span className="rate-info">
            <p>Fee</p>
            <p>{(this.state.fee/10**18).toFixed(5)} {this.state.inputToken.value}</p>
          </span>
        </section>

        {this.state.interaction === 'input' ?
          <a className="swap border pa2" role="button" onClick={() => {this.purchaseTokens()}}>

              <b>{"I want to swap " + this.state.input + " " + this.state.inputToken.value + " for " + this.state.output/10**18 + " " + this.state.outputToken.value}</b>
            {/* <button> Approve </button> */}
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

        {this.state.transactions.length > 0 && this.state.interaction !== 'disconnected' ?
        <section className="transaction border pa2">
          <p className="underline">Past Transactions:</p>
          <Transactions transactions={this.state.transactions}/>
        </section>
        : <section className="hidden border pa2"></section>}
      </div>
    )
  }
}

export default App;
