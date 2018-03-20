import React from 'react';

function Swap ({ interaction, inputValue, inputTokenValue, outputValue, outputTokenValue, purchaseTokens }) {
  if (interaction === 'input') {
    return (
      <a className="swap border pa2" role="button" onClick={() => {purchaseTokens()}}>
        <b>{"I want to swap " + inputValue + " " + inputTokenValue + " for " + outputValue/10**18 + " " + outputTokenValue}</b>
      </a>
    )
  } else {
    return (<a className="swap grey-bg hidden border pa2"></a>)
  }
}

export default Swap;

