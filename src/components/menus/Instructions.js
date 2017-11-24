import React, { Component } from 'react';
import './Instructions.css';

class Instructions extends Component{

  render() {
    return (
      <div className="instructions">
        <div className="instructions-title">Instructions and Stuff</div>
        <div className="instructions-text">
          1) Add UNI test token address to MetaMask (first time only)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;Token Address: <i>0xca9901076d02f89794262869aad1340bd45d8489</i><br/><br/>
          2) Check that MetaMask is connected to the Rinkeby Testnet<br/><br/>
          3) You can now buy UNI test tokens with ETH! Visit the&nbsp;
          <span className="instructions-link"><a href= "https://faucet.rinkeby.io/">Rinkeby faucet</a></span> to aquire testnet ETH <br/><br/>
          4) To buy ETH with UNI you must approve the Uniswap smart contract to transfer UNI tokens on your behalf. Click the "Approve" button now! (first time only)<br/><br/>
          5) Rate is variable based on token availiblity, enter number of tokens to see rate and cost.<br/><br/>
          6) This is a proof-of-concept for a decentralized Market Maker exchange. Stay tuned for token-to-token pairs, the ability to become a Market Creator and collect fees,
          and a Mainet launch! :) <br/> <br/>
          7) This demo was hastily programmed by a single developer <i>(Hi, my name is Hayden!)</i>. Please reach out to me with any questions, comments, complaints, or bug reports.<br/><br/>
          &nbsp;&nbsp;Email: hayden@uniswap.io &nbsp;&nbsp;
          <span className="instructions-link"><a href= "https://github.com/haydenadams/uniswap">GitHub: https://github.com/haydenadams/uniswap<br/></a></span>
          &nbsp;&nbsp;ETH Address: 0x4779721CaC18A46DbCF148f2Dd7A8E6cc1F90078<br/><br/>
        </div>
      </div>
    );
  }

}

export default Instructions;
