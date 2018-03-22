import React, { Component } from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux';
import { setBlockTimestamp, setInteractionState } from '../actions/web3-actions';
import { setExchangeInputValue, setExchangeOutputValue } from '../actions/exchange-actions';

class Purchase extends Component {
  purchaseTokens = async () => {
    await this.props.setBlockTimestamp(this.props.global.web3);
    if (this.props.web3Store.exchangeType === 'ETH to Token') {
      this.ethToTokenPurchase();
    } else if (this.props.web3Store.exchangeType === 'Token to ETH') {
      this.tokenToEthPurchase();
    } else if (this.props.web3Store.exchangeType === 'Token to Token') {
      this.tokenToTokenPurchase();
    }
  }

  ethToTokenPurchase = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.outputToken.value);
    var minTokens = (this.props.exchange.outputValue/10**18).toString();
    var minTokensInt = this.props.global.web3.utils.toWei(minTokens);
    var ethSold = this.props.exchange.inputValue;
    var weiSold = this.props.global.web3.utils.toWei(ethSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
    // console.log(minTokensInt, weiSold, timeout);

    exchange.methods.ethToTokenSwap(minTokensInt, timeout).send({from: this.props.web3Store.currentMaskAddress, value: weiSold})
      .on('transactionHash', (result) => {
        // console.log('Transaction Hash created'        
        // let transactions = this.state.transactions
        // transactions.push(result);
        // transactions is cookie stuff, we'll keep that in state
        // this.setState({ transactions: transactions })
        // any particular reason why there are initialized as 0, but get turned to empty strings after the transaction is over?
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        // cookie.save('transactions', transactions, { path: '/' })
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

  tokenToEthPurchase = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.inputToken.value);
    var minEth = (this.props.exchange.outputValue/10**18).toString();
    var minEthInt = this.props.global.web3.utils.toWei(minEth);
    var tokensSold = this.props.exchange.inputValue;
    var tokensSoldInt = this.props.global.web3.utils.toWei(tokensSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
  
    exchange.methods.tokenToEthSwap(tokensSoldInt, minEthInt, timeout).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', (result) => {
        // console.log('Transaction Hash created')
        // let transactions = this.state.transactions
        // transactions.push(result)
        // this.setState({ transactions: transactions });
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        // cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  tokenToTokenPurchase = () => {
    var exchange = this.props.symbolToExchangeContract(this.props.exchange.inputToken.value);
    var tokenOutAddress = this.props.symbolToTokenAddress(this.props.exchange.outputToken.value);
    var minTokens = (this.props.exchange.outputValue/10**18).toString();
    var minTokensInt = this.props.global.web3.utils.toWei(minTokens);
    var tokensSold = this.props.exchange.inputValue;
    var tokensSoldInt = this.props.global.web3.utils.toWei(tokensSold);
    var timeout = this.props.web3Store.blockTimestamp + 300; //current block time + 5mins
    console.log('tokenOutAddress', tokenOutAddress);
    console.log('minTokensInt', minTokensInt);
    console.log('tokensSoldInt', tokensSoldInt);
    console.log('timeout', timeout);

    exchange.methods.tokenToTokenSwap(tokenOutAddress, tokensSoldInt, minTokensInt, timeout).send({from: this.props.web3Store.currentMaskAddress})
      .on('transactionHash', (result) => {
        // console.log('Transaction Hash created')
        // let transactions = this.state.transactions
        // transactions.push(result)
        // this.setState({ transactions: transactions });
        this.props.setExchangeInputValue('');
        this.props.setExchangeOutputValue('');
        this.props.setInteractionState('submitted');
        // cookie.save('transactions', transactions, { path: '/' })
      })
      .on('receipt', (receipt) => {console.log(receipt)})  //Transaction Submitted to blockchain
      .on('confirmation', (confirmationNumber, receipt) => {console.log("Block Confirmations: " + confirmationNumber)})  //Transaction Mined
      .on('error', console.error);
  }

  render() {
    if (this.props.web3Store.interaction === 'input') {
        return (
          <a className="swap border pa2" role="button" onClick={() => {this.purchaseTokens()}}>
            <b>{"I want to swap " + this.props.exchange.inputValue + " " + this.props.exchange.inputToken.value + " for " + this.props.exchange.outputValue/10**18 + " " + this.props.exchange.outputToken.value}</b>
          </a>
        )
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
