import React from 'react';
import { connect } from 'react-redux';

function ConnectionHelper(props) {
  if (!props.metamask) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
        <b>To get started, please install <a href="https://metamask.io/">Metamask</a>.</b></p>
      </div>
    )
  } else if (props.web3Store.connected && props.web3Store.interaction === 'disconnected') {
    return (
      <div className="grey-bg connection border pa2">
        <p>
          Welcome! Uniswap is a decentralized exchange for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
          It looks like you aren't connected. <b>Please switch to the Rinkeby testnet.</b>
        </p>
      </div>
    )
  } else if (props.web3Store.metamaskLocked) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        It looks like you aren't connected. <b>Please unlock Metamask to continue.</b></p>
      </div>
    )
  } else if (props.web3Store.exchangeType === "Token to itself" || props.web3Store.exchangeType === "ETH to ETH") {
    return (
      <div className="grey-bg connection border pa2">
        <p>You can't swap a token for itself! <span role="img" aria-label="Crying">😂</span></p>
      </div>
    )
  } else if (props.web3Store.interaction === "submitted") {
    return (
      <div className="grey-bg connection border pa2">
        <p>{"Transaction submitted!"}</p>
      </div>
    )
  } else if (props.exchange.inputValue > props.exchange.inputBalance/10**18 && props.exchange.inputToken.value === 'ETH') {
    return (
      <div className="grey-bg red connection border pa2">
        <p>You don't have enough ETH to make this transaction! Get more at the <a target="_blank" rel="noopener noreferrer" href="https://faucet.rinkeby.io/">Rinkeby Faucet.</a></p>
      </div>
    )
  } else if (!props.exchange.allowanceApproved &&  props.web3Store.exchangeType === "Token to Token") {
    return (
      <div className="grey-bg red connection border pa2">
        <p>Uniswap has to be approved by your address to trade {props.exchange.inputToken.value}.</p>
        <p>→</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.exchange.allowanceApproved && props.web3Store.exchangeType === "Token to ETH") {
    return (
      <div className="grey-bg red connection border pa2">
        <p>Uniswap has to be approved by your address to trade {props.exchange.inputToken.value}.</p>
        <p>→</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (props.exchange.inputValue > props.exchange.inputBalance/10**18) {
    return (
      <div className="grey-bg red connection border pa2">
        <p>{"You don't have enough " + props.exchange.inputToken.value + " to make this transaction. 😢 "}</p>
      </div>
    )
  } else {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
        You're connected. Enter a value below to get started.</p>
        <p>↓</p>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store,
  exchange: state.exchange
});


export default connect(mapStateToProps)(ConnectionHelper);
