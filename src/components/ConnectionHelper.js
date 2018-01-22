import React from 'react';

function ConnectionHelper(props) {
  if (!props.metamask) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
        <b>To get started, please install <a href="">Metamask</a>.</b></p>
      </div>
    )
  } if (props.locked) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        Looks like you aren't connected. <b>Please unlock Metamask to continue.</b></p>
      </div>
    )
  } else if (!props.approved &&  props.exchangeType === "Token to Token") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap tokens for tokens.<br /> We set the transfer limit to 250 (<a onClick={() => {props.toggleAbout()}} className="f-a">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.approved && props.exchangeType === "Token to ETH") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap tokens for ETH.<br /> We set the transfer limit to 250 (<a onClick={() => {props.toggleAbout()}} className="f-a">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.uniAdded && props.outputToken.value === "UNI") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a  onClick={() => {props.toggleAbout()}} className="f-a" >How it works ↘</a><br /><br />
        You’ll need to add the UNI tokens to Metamask. <a target="_blank" rel="noopener noreferrer" href="http://metamask.consensyssupport.happyfox.com/kb/article/4-managing-tokens">Here’s a step by step guide.</a><br />
        Add UNI with <a href="">0x350E5DD084ecF271e8d3531D4324443952F47756</a>.</p>
        <a className="f-a" onClick={() => props.onCloseHelper()}>I've added the token</a>
      </div>
    )
  } else if (!props.swapAdded && props.outputToken.value === "SWAP") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a  onClick={() => {props.toggleAbout()}} className="f-a" >How it works</a>.<br /><br />
        You’ll need to add the SWAP tokens to Metamask. <a target="_blank" rel="noopener noreferrer" href="http://metamask.consensyssupport.happyfox.com/kb/article/4-managing-tokens">Here’s a step by step guide.</a><br />
        Add UNI with <a href="">0x8B2A87F8243f23C33fb97E23a21Ae8EDB3b71AcA</a>.</p>
        <a className="f-a" onClick={() => props.onCloseHelper()}>I've added the token</a>
      </div>
    )
  } else if (props.interaction === "error1") {
    return (
      <div className="grey-bg connection border pa2">
        <p>You can't swap a token for itself! <span role="img" aria-label="Crying">😂</span></p>
      </div>
    )
  } else if (props.interaction === "submitted") {
    return (
      <div className="grey-bg connection border pa2">
        <p>{"Transaction submitted! Click on the transaction hash below to check its status?"}</p>
      </div>
    )
  } else if (props.input > props.balance/10**18 && props.inputToken.value === 'ETH') {
    return (
      <div className="grey-bg red connection border pa2">
        <p>This account doesn't have enough balance to make this transaction! Get more {props.inputToken.value} with the <a target="_blank" rel="noopener noreferrer" href="https://faucet.rinkeby.io/">Rinkeby Faucet.</a></p>
      </div>
    )
  } else if (props.input > props.balance/10**18) {
    return (
      <div className="grey-bg red connection border pa2">
        <p>{"This account doesn't have enough balance to make this transaction! You'll need to swap some ETH for " + props.inputToken.value + "."}</p>
      </div>
    )
  } else {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works ↘</a><br /><br />
        Enter an input value below to get started.</p>
        <p>↓</p>
      </div>
    )
  }
}

export default ConnectionHelper;
