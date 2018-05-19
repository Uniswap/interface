import React, { Component } from 'react'
import SelectToken from './SelectToken';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setInvestToken,
         setInvestEthPool,
         setInvestTokenPool,
         setInvestShares,
         setInvestTokenBalance,
         setInvestEthBalance,
         setInvestTokenAllowance,
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
      this.props.setInvestTokenPool(0);
      this.props.setInvestEthPool(0);
      this.props.setInvestTokenBalance(0);
      this.props.setInvestEthBalance(0);
      this.props.setInvestTokenAllowance(0);
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
    var symbol = this.props.exchange.investToken.value;
    var investor = this.props.web3Store.currentMaskAddress;
    var token = this.props.symbolToTokenContract(symbol);
    var exchange = this.props.symbolToExchangeContract(symbol);
    var exchangeAddr = this.props.symbolToExchangeAddress(symbol);

    this.props.web3Store.web3.eth.getBalance(investor, (error, balance) => {
      this.props.setInvestEthBalance(balance);
    });

    token.methods.balanceOf(investor).call((error, balance) => {
      this.props.setInvestTokenBalance(balance);
    });

    token.methods.allowance(investor, exchangeAddr).call((error, balance) => {
      this.props.setInvestTokenAllowance(balance);
      console.log('invest allowance: ', balance)
    });

    exchange.methods.getShares(investor).call().then((result, error) => {
      this.props.setUserShares(result);
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

  approveInvestAllowance = () => {
    var symbol = this.props.exchange.investToken.value;
    var token = this.props.symbolToTokenContract(symbol);
    var exchangeAddress = this.props.symbolToExchangeAddress(symbol);
    var amount = this.props.web3Store.web3.utils.toWei('100000');
    var gasCost = this.props.web3Store.web3.utils.toWei('25', 'gwei')
    token.methods.approve(exchangeAddress, amount).send({from: this.props.web3Store.currentMaskAddress, gasPrice: gasCost})
    .on('transactionHash', console.log('Transaction Hash created'))
    .on('receipt', (receipt) => {
      console.log(receipt)
      this.props.setAllowanceApprovalState(true);
    })  //Transaction Submitted to blockchain
    .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
    .on('error', console.error);

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
            <p> Your shares: {this.props.exchange.userShares} </p>
            <p> Your fees {((this.props.exchange.userShares*100)/this.props.exchange.investShares).toFixed(2)}% </p>
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
          <div className="investValue border pa2 grey-bg connection">
            <p> Allowance: </p>
            <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{(this.props.exchange.investTokenAllowance/10**18).toFixed(5)} {this.props.exchange.investToken.value} </p>
            <a className="f-a"  onClick={() => this.approveInvestAllowance()}>Approve ⭞</a>
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
    setInvestEthPool,
    setInvestTokenPool,
    setInvestShares,
    setInvestTokenBalance,
    setInvestEthBalance,
    setInvestTokenAllowance,
    setInvestSharesInput,
    setInvestEthRequired,
    setInvestTokensRequired,
    setUserShares,
    setInvestChecked
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Invest);
