import React from 'react';

function HelperMessages(props) {
  let message = ''
  switch (props.interaction) {
    case 'connected':
      message = <p>{"Nice! You're connected. Enter an input value below to get started."}</p>
      break;
    case 'locked':
      message = <p>{"Your metamask is locked! Please unlock to continue."}</p>
      break;
    case 'input':
      message = <p>{"You're swapping " + props.inputToken.value + " for " + props.outputToken.value + ". Want to know more about how the prices are determined?"}</p>
      // message = "Oops, looks like this address doesn't have a enough " + props.inputToken.value + " to make this trade. Add more funds to make this swap."
      break;
    case 'error1':
      message = <p>{"You can't swap a token for itself! 😂"}</p>
      // message = "Oops, looks like this address doesn't have a enough " + props.inputToken.value + " to make this trade. Add more funds to make this swap."
      break;
    default:
      message = <p>{"Hi there! This site helps you swap ERC20 tokens. Looks like you aren't connected. Need help?"}</p>
  }
  return (
    <section className="info border pa2">
      {message}
      <p>↓</p>
    </section>
  )
}

export default HelperMessages;
