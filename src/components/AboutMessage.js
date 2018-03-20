import React from 'react' 

function AboutMessage ({ toggled }) {
  if (toggled === true) {
    return (
      <section className="expand grey-bg border pa2">
        <p>Uniswap is a trustless, decentralized exchange for Ether and ERC20 tokens. It uses a market maker mechanism, where liquidity providers invest a reserve of ETH and a single ERC20 token within an Ethereum smart contract. An exchange rate is set between the tokens and ETH based on the relative availibility of each token. A small transaction fee is payed to the liquidity providers proportional to their investment.</p>
        <p>There is a separate contract for each ETH-ERC20 pair. These contracts can "tunnel" between each other for direct ERC20-ERC20 trades. Only one exchange can exist per token, and anyone can contribute liquidity to any exchange. A factory/registry contract provides a public interface for creating new Uniswap exchanges, and looking up the exchange associated a given token address.</p>
        <p>A full writeup will be available soon. Until then, here is some more info on Market Makers:</p>
        <p>Please reach out if you would like to get involved or support the project.</p>
        <p>Email: <a href="mailto:hayden@uniswap.io">hayden@uniswap.io</a></p>
      </section>
    )
  } else {
    return (<section className="expand grey-bg border pa2 hidden"></section>)
  }
}

export default AboutMessage;