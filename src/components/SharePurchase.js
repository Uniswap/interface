import React, { Component } from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import { setBlockTimestamp, setInteractionState } from '../ducks/web3';
import { setExchangeInputValue, setExchangeOutputValue } from '../ducks/exchange';

class Purchase extends Component {
  buyOrSellShares = async () => {
    await this.props.setBlockTimestamp(this.props.web3Store.web3);
    if(this.props.exchange.investChecked) {
      this.buyShares();
    } else {
      this.sellShares();
    }
  }

  buyShares = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.investToken.value);
    var minShares = 1;
    var ethRequiredInt = parseInt(this.props.exchange.investEthRequired, 10).toString();
    // var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.investLiquidity(minShares).send({from: this.props.web3Store.currentMaskAddress, value: ethRequiredInt})
      .on('transactionHash', (result) => {
        // console.log('Transaction Hash created')
        // let transactions = this.state.transactions
        // transactions.push(result)
        // this.setState({ transactions: transactions });
        // this.props.setExchangeInputValue(0);
        // this.props.setExchangeOutputValue(0);
        // this.props.setInteractionState('submitted');
        console.log(result);
        // cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  sellShares = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.investToken.value);
    var minEth = 1;
    var minTokens = 1;
    var sharesInt = parseInt(this.props.exchange.investSharesInput, 10).toString();
    // var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins

    exchange.methods.divestLiquidity(sharesInt, minEth, minTokens).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', (result) => {
        // console.log('Transaction Hash created')
        // let transactions = this.state.transactions
        // transactions.push(result)
        // this.setState({ transactions: transactions });
        // this.props.setExchangeInputValue(0);
        // this.props.setExchangeOutputValue(0);
        // this.props.setInteractionState('submitted');
        console.log(result);
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
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

  render() {
    if(this.props.web3Store.investToggle == true && this.props.exchange.investSharesInput > 0) {
      // Doesn't work
      if (this.props.exchange.investToken.value == "ETH") {
        return (
          <div className="swap border pa2 red-bg">
            <b><p>Please select a token other than ETH.</p></b>
          </div>
        )
      } else if(this.props.exchange.investTokenAllowance == 0) {
        return (
          <div className="swap border pa2 blue-bg" role="button" onClick={() => {this.approveInvestAllowance()}}>
            <b><p>Click to approve {this.props.exchange.investToken.value} spending</p></b>
          </div>
        )
      } else if(this.props.exchange.investChecked) {
          if(this.props.exchange.investEthRequired > this.props.exchange.investEthBalance) {
            return (
              <div className="swap border pa2 red-bg">
                <b><p>😭 You can't afford to invest {(this.props.exchange.investEthRequired/10**18).toFixed(4)} ETH and {(this.props.exchange.investTokensRequired/10**18).toFixed(4)} {this.props.exchange.investToken.value} for {this.props.exchange.investSharesInput} shares 😭</p></b>
              </div>
            )
          } else {
            return (
              <a className="swap border pa2 blue-bg" role="button" onClick={() => {this.buyOrSellShares()}}>
                <b>I want to invest {(this.props.exchange.investEthRequired/10**18).toFixed(4)} ETH and {(this.props.exchange.investTokensRequired/10**18).toFixed(4)} {this.props.exchange.investToken.value} for {this.props.exchange.investSharesInput} shares</b>
              </a>
            )
          }
      } else {
          if(this.props.exchange.investSharesInput > this.props.exchange.userShares) {
            return (
              <a className="swap border pa2 red-bg">
                <b>You do not have {this.props.exchange.investSharesInput} shares.</b>
              </a>
            )
          } else {
            return (
              <a className="swap border pa2 blue-bg" role="button" onClick={() => {this.buyOrSellShares()}}>
                <b>{this.props.exchange.investSharesInput > this.props.exchange.userShares} I want to divest {(this.props.exchange.investEthRequired/10**18).toFixed(4)} ETH and {(this.props.exchange.investTokensRequired/10**18).toFixed(4)} {this.props.exchange.investToken.value} for {this.props.exchange.investSharesInput} shares</b>
              </a>
            )
          }

        }
      } else {
      return (<a className="swap grey-bg hidden border pa2"></a>)
    }
  }
}

const mapStateToProps = state => ({
  global: state.global,
  web3Store: state.web3Store,
  exchange: state.exchange
})

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setBlockTimestamp,
    setExchangeInputValue,
    setExchangeOutputValue,
    setInteractionState
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Purchase);
