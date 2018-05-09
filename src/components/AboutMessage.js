import React from 'react'

function AboutMessage ({ toggled }) {
  if (toggled === true) {
    return (
      <section className="expand grey-bg border pa2">
        <p>Read the: <a href="https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig#Uniswap-Whitepaper-%F0%9F%A6%84">Uniswap Whitepaper</a></p>
        <p>Uniswap is an automated market maker for exchanging ERC20 tokens. Anyone can become a liquidity provider, and invest in the liquidity pool of an ERC20 token. This allows other users to trade that token for other tokens at an exchange rate based on their relative availibility. When a token trade is executed, a small fee is payed to the liquidity providers that enabled the transaction.</p>
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
