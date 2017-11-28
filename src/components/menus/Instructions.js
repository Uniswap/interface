import React, { Component } from 'react';
import './Instructions.css';

class Instructions extends Component{

  render() {
    return (
      <div className="instructions">
        <div className="instructions-title">Instructions and Info</div>
        <div className="instructions-text">
          1) Add UNI test token address to MetaMask (first time only)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;Token Address: <span className="instructions-highlight">0xca9901076d02f89794262869aad1340bd45d8489</span><br/><br/>
          2) Check that MetaMask is connected to the Rinkeby Testnet<br/><br/>
          3) You can now buy UNI test tokens with ETH! Visit the&nbsp;
          <a href= "https://faucet.rinkeby.io/">Rinkeby faucet</a> to aquire testnet ETH <br/><br/>
          4) To buy ETH with UNI you must approve the Uniswap smart contract to transfer UNI tokens on your behalf. Click the&nbsp;
          <span className="instructions-approve"><b>Approve</b></span> button now! (first time only)<br/><br/>
          5) Rate is variable based on token availiblity, enter number of tokens to see rate and cost.<br/><br/>
          6) This is a proof-of-concept for a decentralized Market Maker exchange. Stay tuned for ENS support, token-to-token pairs, the ability to become a liquidity provider and collect fees,
          and a Mainet launch! :) <br/> <br/>
          7) This demo was hastily programmed by a single developer <i>(Hi, my name is Hayden!)</i>. Please reach out to me with any questions, comments, complaints, or bug reports.<br/><br/>
          &nbsp;&nbsp;Email: <span className="instructions-highlight">hayden@uniswap.io</span>&nbsp;&nbsp;
          GitHub: <a href= "https://github.com/haydenadams/uniswap">https://github.com/haydenadams/uniswap<br/></a>
          &nbsp;&nbsp;ETH Address: <span className="instructions-highlight">0x4779721CaC18A46DbCF148f2Dd7A8E6cc1F90078</span><br/><br/>
        </div>
      </div>
    );
  }

}

export default Instructions;
