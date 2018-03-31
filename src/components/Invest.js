import React, { Component } from 'react'
import SelectToken from './SelectToken';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setInvestToken, setInvestInvariant, setInvestEthPool, setInvestTokenPool, setInvestShares, setInvestTokenBalance, setInvestEthBalance, setInvestSharesInput, setInvestEthRequired, setInvestTokensRequired} from '../actions/exchange-actions';

class Invest extends Component {

  onSelectToken = async (selected, type) => {
    if(selected.value !== 'ETH') {
      await this.props.setInvestToken(selected);
      this.getInvestExchangeState();
    } else {
      this.props.setInvestInvariant(0);
      this.props.setInvestTokenPool(0);
      this.props.setInvestEthPool(0);
      this.props.setInvestTokenBalance(0);
      this.props.setInvestEthBalance(0);
      this.props.setInvestShares(0);
    }
  }

  onInputChange = async (event) => {
    var inputValue = event.target.value;
    await this.props.setInvestSharesInput(inputValue);
    this.getInvestOutput();
  }

  getInvestExchangeState = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.investToken.value);

    exchange.methods.invariant().call().then((result, error) => {
      this.props.setInvestInvariant(result);
    });

    exchange.methods.ethPool().call().then((result, error) => {
      this.props.setInvestEthPool(result);
    });

    exchange.methods.tokenPool().call().then((result, error) => {
      this.props.setInvestTokenPool(result);
    });

    exchange.methods.totalShares().call().then((result, error) => {
      this.props.setInvestShares(result);
    });
  }

  getInvestBalance = () => {
    var token = this.props.symbolToTokenContract(this.props.exchange.investToken.value);

    this.props.web3Store.web3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
      this.props.setInvestEthBalance(balance);
    });

    token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, balance) => {
      this.props.setInvestTokenBalance(balance);
    });
  }

  getInvestOutput = () => {
    var inputValue = this.props.exchange.investSharesInput;
    if(inputValue && inputValue !== 0 && inputValue !== '0'){
      var ethRequired = ((this.props.exchange.investEthPool)/this.props.exchange.investShares)*inputValue;
      var tokensRequired = ((this.props.exchange.investTokenPool)/this.props.exchange.investShares)*inputValue;
      this.props.setInvestEthRequired(ethRequired);
      this.props.setInvestTokensRequired(tokensRequired);
      console.log("requires ", ethRequired, " ETH ", tokensRequired, this.props.exchange.investToken.value);
    } else {
      this.props.setInvestEthRequired(0);
      this.props.setInvestTokensRequired(0);
    }
  }

  render () {
    if (this.props.web3Store.investToggle === true) {
      return (
        <section className="grey-bg border pa2">
          <div className="invest investValue border pa2">
            <p> Select token and input number of shares: &nbsp;&nbsp;&nbsp;</p>
            <div className="investSelectToken">
              <SelectToken token={this.props.exchange.investToken} onSelectToken={this.onSelectToken} />
              <p className="investDropdown">{'<'}</p>
            </div>
            <input type="number" className="investValueInput" value={this.props.exchange.inputShares} placeholder="0" onChange={this.onInputChange} />
          </div>
          <div className="investValue border pa2">
            <p> Total Shares: {this.props.exchange.investShares} </p>
            <p> You own: 0 shares </p>
            <p> You get 0% of fees </p>
          </div>
          <div className="investValue border pa2">
            <p> Total Liquidity </p>
            <p> {(this.props.exchange.investEthPool/10**18).toFixed(2)} ETH </p>
            <p> {(this.props.exchange.investTokenPool/10**18).toFixed(2)} {this.props.exchange.investToken.value} </p>
          </div>
          <div className="investValue border pa2">
            <p> Each share is worth: </p>
            <p> {((this.props.exchange.investEthPool/10**18)/this.props.exchange.investShares).toFixed(5)} ETH </p>
            <p> {((this.props.exchange.investTokenPool/10**18)/this.props.exchange.investShares).toFixed(5)} {this.props.exchange.investToken.value} </p>
          </div>
          <div className="investValue border pa2">
            <p> Account Balance: </p>
            <p>  {(this.props.exchange.investEthBalance/10**18).toFixed(5)} ETH </p>
            <p> {(this.props.exchange.investTokenBalance/10**18).toFixed(5)} {this.props.exchange.investToken.value} </p>
          </div>
        </section>
      )
    } else {
      return (<section className="expand grey-bg border pa2 hidden"></section>)
    }
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store,
  exchange: state.exchange
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setInvestToken,
    setInvestInvariant,
    setInvestEthPool,
    setInvestTokenPool,
    setInvestShares,
    setInvestTokenBalance,
    setInvestEthBalance,
    setInvestSharesInput,
    setInvestEthRequired,
    setInvestTokensRequired
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Invest);
