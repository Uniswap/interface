import React from 'react'

function AboutMessage ({ toggled }) {
  if (toggled === true) {
    return (
      <section className="expand grey-bg border pa2">
        <p>Uniswap is an automated market maker exchange capable of both ETH-to-ERC20 and ERC20-to-ERC20 trades. Anyone can become a liquidity provider, and invest in the liquidity pool of an ERC20 token. This allows other users to trade that token for any other token with liquidity, at an exchange rate based on their relative availibility. When a token trade is executed, a small fee is payed to the liquidity providers for both tokens, proportional to their investment.</p>
        <p>A full writeup can be found here: <a href="https://hackmd.io/Tlf08KuPTbqsHLKk5hzAvA">Uniswap Project Overview</a></p>
        <p>Please reach out if you would like to get involved or support the project.</p>
        <p><span role="img" aria-label="GitHub">⟪⟫</span> <a href="https://github.com/uniswap">github.com/uniswap</a></p>
        <p><span role="img" aria-label="Email">📧 </span><a href="mailto:hayden@uniswap.io">hayden@uniswap.io</a></p>
      </section>
    )
  } else {
    return (<section className="expand grey-bg border pa2 hidden"></section>)
  }
}

export default AboutMessage;
