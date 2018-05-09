import React, { Component } from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import { setBlockTimestamp, setInteractionState } from '../actions/web3-actions';
import { setExchangeInputValue, setExchangeOutputValue } from '../actions/exchange-actions';

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

  buyOrSell = (input) => {
    if(input) {
      return 'buy'
    } else {
      return 'sell'
    }
  }

  render() {
    if (this.props.exchange.investEthRequired > 0) {
      // fix later
      if (!this.props.exchange.investChecked && 1 === 0) {
        return (
          <p className="swap border pa2">
            <b>Not enough shares!</b>
          </p>
        )
      } else {
          return (
            <a className="swap border pa2" role="button" onClick={() => {this.buyOrSellShares()}}>
              <b>I want to {this.buyOrSell(this.props.exchange.investChecked)} {this.props.exchange.investSharesInput} shares for {(this.props.exchange.investEthRequired/10**18).toFixed(4)} ETH and {(this.props.exchange.investTokensRequired/10**18).toFixed(4)} {this.props.exchange.investToken.value}</b>
            </a>
          )
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
