import React from 'react';
import { connect } from 'react-redux';

function ConnectionHelper(props) {
  if (!props.metamask) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange for ETH and ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
        <b>To get started, please install <a href="https://metamask.io/">Metamask</a>.</b></p>
      </div>
    )
  } else if (props.web3Store.connected && props.web3Store.interaction === 'disconnected') {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exchange for ETH and ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        Looks like you aren't connected. <b>Please switch to the correct network.</b></p>
      </div>
    )
  } else if (props.web3Store.metamaskLocked) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        Looks like you aren't connected. <b>Please unlock Metamask to continue.</b></p>
      </div>
    )
  } else if (props.web3Store.interaction === "error1") {
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
        <p>This account doesn't have enough balance to make this transaction! Get more {props.exchange.inputToken.value} with the <a target="_blank" rel="noopener noreferrer" href="https://faucet.rinkeby.io/">Rinkeby Faucet.</a></p>
      </div>
    )
  } else if (!props.exchange.allowanceApproved &&  props.web3Store.exchangeType === "Token to Token") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap this token for other tokens.<br /> We set a high transfer limit for the demo (<a onClick={() => {props.toggleAbout()}} className="f-a">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.exchange.allowanceApproved && props.web3Store.exchangeType === "Token to ETH") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap this token for ETH.<br /> We set a high transfer limit for the demo (<a onClick={() => {props.toggleAbout()}} className="f-a">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.uniAdded && props.exchange.outputToken.value === "UNI") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a  onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        You’ll need to add the UNI tokens to Metamask. <a target="_blank" rel="noopener noreferrer" href="http://metamask.consensyssupport.happyfox.com/kb/article/4-managing-tokens">Here’s a step by step guide.</a><br />
        Add UNI with <a href="">0x350E5DD084ecF271e8d3531D4324443952F47756</a>.</p>
        <a className="f-a" onClick={() => props.onCloseHelper()}>I've added the token</a>
      </div>
    )
  } else if (!props.swapAdded && props.exchange.outputToken.value === "SWAP") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a  onClick={() => {props.toggleAbout()}} className="f-a" >How it works</a>.<br /><br />
        You’ll need to add the SWAP tokens to Metamask. <a target="_blank" rel="noopener noreferrer" href="http://metamask.consensyssupport.happyfox.com/kb/article/4-managing-tokens">Here’s a step by step guide.</a><br />
        Add UNI with <a href="">0x8B2A87F8243f23C33fb97E23a21Ae8EDB3b71AcA</a>.</p>
        <a className="f-a" onClick={() => props.onCloseHelper()}>I've added the token</a>
      </div>
    )
  } else if (props.exchange.inputValue > props.exchange.inputBalance/10**18) {
    return (
      <div className="grey-bg red connection border pa2">
        <p>{"This account doesn't have enough balance to make this transaction! You'll need to swap some ETH for " + props.exchange.inputToken.value + "."}</p>
      </div>
    )
  } else {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange for ETH and ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
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
