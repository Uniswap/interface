import React from 'react';

function ConnectionHelper(props) {
  // console.log(props.input > props.balance/10**18)

  if (!props.metamask) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works</a>.<br />
        <b>To get started, please install <a href="">Metamask</a>.</b></p>
        {/* <p></p> */}
      </div>
    )
  } if (props.locked) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a  onClick={() => {props.toggleAbout()}} className="f-a" >How it works</a>.<br />
        Looks like you aren't connected. <b>Please unlock Metamask to continue.</b></p>
        {/* <p><a href="">How it works</a></p> */}
      </div>
    )
  } else if (!props.approved &&  props.exchangeType === "Token to Token") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap tokens for tokens.<br /> We set the transfer limit to 250 (<a href="">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (!props.approved && props.exchangeType === "Token to ETH") {
    return (
      <div className="grey-bg connection border pa2">
        <p>Our smart contract has to be approved by your address to be able to swap tokens for ETH.<br /> We set the transfer limit to 250 (<a href="">Why?</a>).</p>
        <a className="f-a"  onClick={() => props.approveAllowance()}>Approve ⭞</a>
      </div>
    )
  } else if (props.interaction === "error1") {
    return (
      <div className="grey-bg connection border pa2">
        <p>You can't swap a token for itself! 😂</p>
      </div>
    )
  }
  else if (props.interaction === "submitted") {
    return (
      <div className="grey-bg connection border pa2">
        <p>{"Transaction submitted! Click on the transaction hash below to check its status?"}</p>
      </div>
    )
  }  else if (props.input > props.balance/10**18) {
    return (
      <div className="grey-bg red connection border pa2">
        <p>This account doesn't have enough balance to make this transaction! Get more ETH with the <a href="https://faucet.rinkeby.io/">Rinkeby Faucet.</a></p>
      </div>
    )
  } else if (props.firstRun) {
    return (
      <div className="grey-bg connection border pa2">
        <p>Welcome! Uniswap is a decentralized exhange platform for ERC20 Tokens. <a onClick={() => {props.toggleAbout()}} className="f-a">How it works</a>.<br />
        Enter an input value below to get started.</p>
        {/* <a className="f-a" onClick={() => props.onCloseHelper()}>×</a> */}
        <p>↓</p>
      </div>
    )
  } else {
    return (
      null
    )
  }
}

export default ConnectionHelper;
