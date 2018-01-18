import React from 'react';

function HelperMessages(props) {
  let message = ''
  switch (props.interaction) {
    case 'connected':
      message = "Nice! You're connected. Enter a value below to get started."
      break;
    case 'input':
      message = "You're swapping " + props.inputToken.value + " for " + props.outputToken.value + ". Want to know more about how the prices are determined?"
      // message = "Oops, looks like this address doesn't have a enough " + props.inputToken.value + " to make this trade. Add more funds to make this swap."
      break;
    default:
      message = "Hi there! This site helps you swap ERC20 tokens. Looks like you aren't connected. Need help?"
  }
  return (
    <section className="info border pa2">
      <p>{message}</p>
      <p>↓</p>
    </section>
  )
}

export default HelperMessages;
