import React, { Component }from 'react';
import SelectToken from './SelectToken';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { subscribe } from 'redux-subscriber';
import { setInteractionState, setExchangeType } from '../actions/web3-actions';
import { 
    setExchangeInputValue,
    setExchangeOutputValue,
    setExchangeRate,
    setExchangeFee,
    setInputToken,
    setOutputToken,
    setInputBalance,
    setOutputBalance,
    setAllowanceApprovalState
  } from '../actions/exchange-actions';

class Order extends Component {
  constructor (props){
    super(props)
  }
  // props and functions ready
  onInputChange = async (event) => {
    var inputValue = event.target.value;
    await this.props.setExchangeInputValue(inputValue);
    this.setExchangeOutput();
  }
  // props ready, 
  onSelectToken = async (selected, type) => {
    this.props.setExchangeInputValue(0);
    this.props.setExchangeOutputValue(0);
    this.props.setExchangeRate(0);
    this.props.setExchangeFee(0);
    this.props.setInteractionState('connected');
    // what the flip does this do 
    // this.setState({ firstRun: true })

    if (type === 'input') {
      await this.props.setInputToken(selected);
    } else if (type === 'output'){
      await this.props.setOutputToken(selected);
    }
    
    await this.getMarketType();
    // these two functions are actually being passed from the parent component, because they're used in multiple places
    // eventually pull these out into HOC
    this.props.getAccountInfo();
    this.props.getMarketInfo();
  }
  
  setExchangeOutput = () => {
    var inputValue = this.props.exchange.inputValue;
    if (this.props.web3Store.exchangeType === 'Invalid'){
      this.props.setExchangeOutputValue(0);
      this.props.setInteractionState('error1');
    } else if(inputValue && inputValue !== 0 && inputValue !== '0'){
        this.props.setInteractionState('input');
        // another function to be pulled out into HOC 
        this.props.getExchangeRate(inputValue);
    } else {
        this.props.setExchangeOutputValue(0);
        this.props.setInteractionState('connected');
    }
  }
  
  // props ready
  // TODO: change this to use the redux-subscribe pattern
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
  // we are here 
  // TODO: change this to use the redux-subscribe pattern 
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

  // props ready 
  // TODO: TODO: TODO: TURN THIS INTO A REDUX-SUBSCRIBE LISTENER NOW!!!
  getEthBalance = (type) => {
    // this.props.web3Store.globalWeb3
    if (type === 'input') {
      this.props.web3Store.globalWeb3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
        this.props.setInputBalance(balance);
        // console.log('ETH Balance: ' + balance);
      });
    } else if (type === 'output') {
      this.props.web3Store.globalWeb3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
         this.props.setOutputBalance(balance);
          // console.log('ETH Balance: ' + balance);
      });
    }
  }
  // props ready 
  // TODO: this might also be able to change to the redux-subscribe method 
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
  // TODO: refactor to redux-subscribe 
  // props ready
  getAllowance = () => {
    var type = this.props.web3Store.exchangeType;
    if(type === 'Token to ETH' || type === 'Token to Token') {
      // another pair of functions to be exported to a HOC 
      var token = this.props.symbolToTokenContract(this.props.exchange.inputToken.value);
      var exchangeAddress = this.props.symbolToExchangeAddress(this.props.exchange.inputToken.value);

      token.methods.allowance(this.props.web3Store.currentMaskAddress, exchangeAddress).call().then((result, error) => {
        console.log(this.props.exchange.inputToken.value + ' allowance: ' + result);
        if(result === '0'){
          this.props.setAllowanceApprovalState(false)
          console.log(this.props.exchange.allowanceApproved)
        }
      })
    }
  }
 
  render () {
    return (
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
    )
  }
  
}

const mapStateToProps = state => ({
    web3Store: state.web3Store,
    exchange: state.exchange
  })
  
  const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
      setExchangeInputValue,
      setExchangeOutputValue,
      setExchangeRate,
      setExchangeFee,
      setInteractionState,
      setInputToken,
      setOutputToken,
      setExchangeType,
      setInputBalance,
      setOutputBalance,
      setAllowanceApprovalState
    }, dispatch);
  }

  export default connect(mapStateToProps, mapDispatchToProps)(Order);