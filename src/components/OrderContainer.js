import React, { Component } from 'react';
import { connect } from 'react-redux';
import Order from '../components/Order';
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

function withOrderFunctionality (WrappedComponent) {
  return class extends Component {
    constructor (props){
        super(props);
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
        //this.setState({ firstRun: true })
    
        if (type === 'input') {
          await this.props.setInputToken(selected);
        } else if (type === 'output'){
          await this.props.setOutputToken(selected);
        }
        
        await this.getMarketType();
        this.getAccountInfo();
        this.getMarketInfo();
      }
      
      setExchangeOutput = () => {
        var inputValue = this.props.exchange.inputValue;
        if (this.props.web3Store.exchangeType === 'Invalid'){
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
      // ready, we'll think of improvements later 
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

      render() {
        return (
          <WrappedComponent 
            onInputChange={this.onInputChange}
            onSelectToken={this.onSelectToken}
            setExchangeOutput={this.setExchangeOutput}
            getMarketType={this.getMarketType}
            getAccountInfo={this.getAccountInfo}
            getEthBalance={this.getEthBalance}
            getTokenBalance={this.getTokenBalance}
            getAllowance={this.getAllowance}
            symbolToTokenContract={this.symbolToTokenContract}
            symbolToExchangeAddress={this.symbolToExchangeAddress}
          />
        )
      }
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store,
  exchange: state.exchange
})

const mapDispatchToProps = (dispatch) => {
  return {
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
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withOrderFunctionality);
