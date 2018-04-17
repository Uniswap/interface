import React, { Component } from 'react'
import SelectToken from './SelectToken';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setInvestToken,
         setInvestInvariant,
         setInvestEthPool,
         setInvestTokenPool,
         setInvestShares,
         setInvestTokenBalance,
         setInvestEthBalance,
         setInvestSharesInput,
         setUserShares,
         setInvestEthRequired,
         setInvestTokensRequired,
         setInvestChecked} from '../actions/exchange-actions';

class Invest extends Component {

  onSelectToken = async (selected, type) => {
    if(selected.value !== 'ETH') {
      await this.props.setInvestToken(selected);
      this.getInvestExchangeState();
      this.getInvestBalance();
    } else {
      this.props.setInvestInvariant(0);
      this.props.setInvestTokenPool(0);
      this.props.setInvestEthPool(0);
      this.props.setInvestTokenBalance(0);
      this.props.setInvestEthBalance(0);
      this.props.setInvestShares(0);
      this.props.setUserShares(0);
    }
  }

  onInputChange = async (event) => {
    var inputValue = event.target.value;
    await this.props.setInvestSharesInput(inputValue);
    this.getInvestOutput();
  }

  toggleCheck = () => {
    this.props.setInvestChecked(!this.props.exchange.investChecked);
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
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.investToken.value);

    this.props.web3Store.web3.eth.getBalance(this.props.web3Store.currentMaskAddress, (error, balance) => {
      this.props.setInvestEthBalance(balance);
    });

    token.methods.balanceOf(this.props.web3Store.currentMaskAddress).call((error, balance) => {
      this.props.setInvestTokenBalance(balance);
    });

    exchange.methods.getShares(this.props.web3Store.currentMaskAddress).call().then((result, error) => {
      this.props.setUserShares(result);
      console.log(result);
    });
  }

  getInvestOutput = () => {
    var inputValue = this.props.exchange.investSharesInput;
    if(inputValue && inputValue !== 0 && inputValue !== '0'){
      var ethRequired = ((this.props.exchange.investEthPool)/this.props.exchange.investShares)*inputValue;
      var tokensRequired = ((this.props.exchange.investTokenPool)/this.props.exchange.investShares)*inputValue;
      this.props.setInvestEthRequired(ethRequired);
      this.props.setInvestTokensRequired(tokensRequired);
      // console.log("requires ", ethRequired, " ETH ", tokensRequired, this.props.exchange.investToken.value);
    } else {
      this.props.setInvestEthRequired(0);
      this.props.setInvestTokensRequired(0);
    }
  }

  render () {
    if (this.props.web3Store.investToggle === true) {
      return (
        <section className="grey-bg border pa2">
          <div onChange={this.toggleCheck.bind(this)}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Invest <input type="radio" checked={this.props.exchange.investChecked} onChange={()=>{}} /> &nbsp;&nbsp;&nbsp;&nbsp;
            Divest <input type="radio" checked={!this.props.exchange.investChecked} onChange={()=>{}} />
          </div>
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
            <p> You own: {this.props.exchange.userShares} shares </p>
            <p> You get {((this.props.exchange.userShares*100)/this.props.exchange.investShares).toFixed(2)}% of fees </p>
          </div>
          <div className="investValue border pa2">
            <p> Total Liquidity </p>
            <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{(this.props.exchange.investEthPool/10**18).toFixed(5)} ETH </p>
            <p> {(this.props.exchange.investTokenPool/10**18).toFixed(5)} {this.props.exchange.investToken.value} </p>
          </div>
          <div className="investValue border pa2">
            <p> &nbsp;Each share is worth: </p>
            <p> {((this.props.exchange.investEthPool/10**18)/this.props.exchange.investShares).toFixed(5)} ETH &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
            <p> {((this.props.exchange.investTokenPool/10**18)/this.props.exchange.investShares).toFixed(5)} {this.props.exchange.investToken.value} </p>
          </div>
          <div className="investValue border pa2">
            <p> Account Balance: </p>
            <p>  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{(this.props.exchange.investEthBalance/10**18).toFixed(5)} ETH </p>
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
    setInvestTokensRequired,
    setUserShares,
    setInvestChecked
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Invest);
