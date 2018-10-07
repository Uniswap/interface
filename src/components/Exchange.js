import React, { Component }from 'react';
import React, { Component }from 'react';
import SelectToken from './SelectToken';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { setInteractionState, setExchangeType } from '../ducks/web3';
import { setExchangeInputValue, setExchangeOutputValue, setExchangeRate, setExchangeFee, setInputToken, setOutputToken, setInputBalance, setOutputBalance, setAllowanceApprovalState } from '../ducks/exchange';

class Exchange extends Component {
  onInputChange = async (event) => {
    var inputValue = event.target.value;
    await this.props.setExchangeInputValue(inputValue);
    this.setExchangeOutput();
  }

  onSelectToken = async (selected, type) => {
    this.props.setExchangeInputValue(0);
    this.props.setExchangeOutputValue(0);
    this.props.setExchangeRate(0);
    this.props.setExchangeFee(0);
    this.props.setInteractionState('connected');

    if (type === 'input') {
      await this.props.setInputToken(selected);
    } else if (type === 'output'){
      await this.props.setOutputToken(selected);
    }

    await this.getMarketType();
    // eventually pull these out into HOC
    this.props.getAccountInfo();
    this.props.getMarketInfo();
  }

  setExchangeOutput = () => {
    var inputValue = this.props.exchange.inputValue;
    if (this.props.web3Store.exchangeType === 'ETH to ETH' || this.props.web3Store.exchangeType === 'Token to itself'){
      this.props.setExchangeOutputValue(0);
      this.props.setInteractionState('error1');
    } else if(inputValue && inputValue !== 0 && inputValue !== '0'){
        this.props.setInteractionState('input');
        // another function to be pulled out into HOC
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
    var inputSymbol = this.props.exchange.inputToken.value;
    var outputSymbol = this.props.exchange.outputToken.value;
    if (inputSymbol === 'ETH' && outputSymbol === 'ETH') {
      marketType = 'ETH to ETH';
      this.props.setInteractionState('error1');
    } else if (inputSymbol === outputSymbol){
        marketType = 'Token to itself';
    } else if (inputSymbol === 'ETH'){
        marketType = 'ETH to Token';
    } else if (outputSymbol === 'ETH'){
        marketType = 'Token to ETH';
    } else{
        marketType = 'Token to Token';
    }
    this.props.setExchangeType(marketType);
    console.log('type: ', marketType, 'input: ', inputSymbol, 'output: ', outputSymbol);
  }

  getExchangeRate = (input) => {
    if (this.props.web3Store.exchangeType === 'ETH to Token') {
      // console.log('Getting Rate: ETH to ' + this.props.exchange.outputToken.value);
      this.ethToTokenRate(input);
    } else if (this.props.web3Store.exchangeType === 'Token to ETH') {
      // console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to ETH');
      this.tokenToEthRate(input);
    } else if (this.props.web3Store.exchangeType === 'Token to Token') {
      // console.log('Getting Rate: ' + this.props.exchange.inputToken.value + ' to '  + this.props.exchange.outputToken.value);
      this.tokenToTokenRate(input);
    }
  }

  ethToTokenRate = (ethInput) => {
    var ethInMarket = +this.props.exchange.ethPool2;
    var tokensInMarket = +this.props.exchange.tokenPool2;
    var invar = ethInMarket*tokensInMarket
    var ethIn = ethInput*10**18;
    var exchangeFee = ethIn/500;
    var ethSold = ethIn - exchangeFee;
    var newEthInMarket = ethInMarket + ethSold;
    var newTokensInMarket = invar/newEthInMarket;
    var tokensOut = tokensInMarket - newTokensInMarket;
    var buyRate = tokensOut/ethIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee);
    this.props.setExchangeOutputValue(tokensOut);
    console.log('ethToTokenRate', buyRate);
  }

  tokenToEthRate = (tokenInput) => {
    var ethInMarket = +this.props.exchange.ethPool1;
    var tokensInMarket = +this.props.exchange.tokenPool1;
    var invar = ethInMarket*tokensInMarket;
    var tokensIn = tokenInput*10**18;
    var exchangeFee = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee;
    var newTokensInMarket = tokensInMarket + tokensSold;
    var newEthInMarket = invar/newTokensInMarket;
    var ethOut = ethInMarket - newEthInMarket;
    var buyRate = ethOut/tokensIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee);
    this.props.setExchangeOutputValue(ethOut);
  }

  tokenToTokenRate = (tokenInput) => {
    // Token to ETH on Exchange 1
    var ethInMarket1 = +this.props.exchange.ethPool1;
    var tokensInMarket1 = +this.props.exchange.tokenPool1;
    var invar1 = ethInMarket1*tokensInMarket1;
    var tokensIn = tokenInput*10**18;
    var exchangeFee1 = tokensIn/500;
    var tokensSold = tokensIn - exchangeFee1;
    var newTokensInMarket1 = tokensInMarket1 + tokensSold;
    var newEthInMarket1 = invar1/newTokensInMarket1;
    var ethToExchange2 = ethInMarket1 - newEthInMarket1;
    // ETH to Token on Exchange 2
    var ethInMarket2 = +this.props.exchange.ethPool2;
    var tokensInMarket2 = +this.props.exchange.tokenPool2;
    var invar2 = ethInMarket2*tokensInMarket2;
    var exchangeFee2 = ethToExchange2/500;
    var ethSold = ethToExchange2 - exchangeFee2;
    var newEthInMarket2 = ethInMarket2 + ethSold;
    var newTokensInMarket2 = invar2/newEthInMarket2;
    var tokensOut = tokensInMarket2 - newTokensInMarket2;
    var buyRate = tokensOut/tokensIn;
    this.props.setExchangeRate(buyRate);
    this.props.setExchangeFee(exchangeFee1);
    this.props.setExchangeOutputValue(tokensOut);
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
          <input type="number" readOnly={true} value={(this.props.exchange.outputValue/10**18).toFixed(4)} placeholder="0"/>
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

export default connect(mapStateToProps, mapDispatchToProps)(Exchange);
