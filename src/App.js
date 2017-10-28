import React, { Component } from 'react';
import unicorn from './images/unicornNoBackground.png';
import ethLogo from './images/ethLogo.png';
import './App.css';

//window.web3.eth.defaultAccount = window.web3.eth.accounts[0]

var uniswapABI = [{"constant":false,"inputs":[{"name":"tokenAmount","type":"uint256"}],"name":"ownerTokenWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"ethAmount","type":"uint256"}],"name":"ownerEthWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"sellQuantity","type":"uint256"},{"name":"minimumEth","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"tokenToEth","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalTokenQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"minimumTokens","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"ethToTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"initialTokenQuantity","type":"uint256"}],"name":"initiateUniswap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalEthQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"invariant","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_tokenAddress","type":"address"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"tokensPurchased","type":"uint256"},{"indexed":false,"name":"ethSpent","type":"uint256"}],"name":"TokenPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"ethPurchased","type":"uint256"},{"indexed":false,"name":"tokensSpent","type":"uint256"}],"name":"EthPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
var uniswapAddress = '0xe52dd7e4c3652600bc6daf601e5a0eea2b072597';
var uniswapContract = window.web3.eth.contract(uniswapABI).at(uniswapAddress);

var tokenABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
var tokenAddress = '0x8e2183e0Ac73e6FBd1F9E0fAb24368728f978092';
var tokenContract = window.web3.eth.contract(tokenABI).at(tokenAddress);

//console.log(tokenContract);

/*
tokenContract.Transfer().watch((err, response) => {
    console.log(response.args.from);
});
*/

/*
tokenContract.allEvents((error, event) => {
  if (error) {
    console.error(error)
    return false
  }

  console.log(event)
})
*/

class App extends Component {
  constructor(props){
    super(props)
    this.state = {ethBalance: null,
                  tokenBalance: null,
                  tokenAllowance: null,
                  currentMaskAddress: window.web3.eth.accounts[0],
                  minimumTokensPurchased: null
    }

    this.buyTokens = this.buyTokens.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  componentWillMount(){
  //  self.setState(currentMaskAddress: window.web3.eth.defaultAccount)
  /*  window.web3.eth.getAccounts(function(error, accounts) {
      var defaultAccount = accounts[0];
      alert(defaultAccount);
      self.setState(currentMaskAddress: defaultAccount);
    }); */
  }


  componentDidMount(){

    var self = this;

    window.web3.eth.getBalance(this.state.currentMaskAddress, function(error, balance) {
      var ethValue = window.web3.fromWei(balance.toNumber());
      var roundedValue=Math.round(ethValue*10000)/10000;
      self.setState({ethBalance: roundedValue});
    });

    tokenContract.balanceOf(this.state.currentMaskAddress, function(error, balance) {
      var tokenAmount = (balance.toNumber())/1000000;
      self.setState({tokenBalance: tokenAmount});
    });

    tokenContract.allowance(this.state.currentMaskAddress, uniswapAddress, function(error, balance) {
      var tokensAllowed = (balance.toNumber())/1000000;
      self.setState({tokenAllowance: tokensAllowed});
    });

    //window.web3.eth.getAccounts(accounts => console.log(accounts[0]))
  }

  approveAllowance(value) {
    console.log('oh shit waddup');
    tokenContract.approve(uniswapAddress, value, function(error, balance) {
      console.log(balance);
    });
  }

  buyTokens() {
    console.log(this.state.minimumTokensPurchased);

    var minTokens = this.state.minimumTokensPurchased

    window.web3.eth.getBlock('latest', function(error, blockInfo) {
        console.log(blockInfo);
        var time = blockInfo.timestamp;
        console.log(time)
        var maxTime = time + 300; //current block time + 5mins

        uniswapContract.ethToTokens.sendTransaction(minTokens, maxTime, {
            from: window.web3.eth.coinbase,
            value:window.web3.toWei('1','ether') }, function(err, txHash) {});

    });


    //
    //uniswapContract.ethToTokens(minTokens)
  }

  onInputChange(event) {
    this.setState({ minimumTokensPurchased: event.target.value });
  }


/*  listenForClicks(tokenContract) {

    var button = document.querySelector('button.transferFunds')
    button.addEventListener('click', function() {
      tokenContract.approve({address: uniswapAddress}, { from: addr })
      .then(function (txHash) {
        console.log('Transaction sent')
        console.dir(txHash)
        waitForTxToBeMined(txHash)
      })
      .catch(console.error)
    })
}*/

  render() {
    return (
      <div className="App">
          <header className="App-header">
              <h1 className="App-title">UNISWAP</h1>
              <img src={unicorn} className="unicorn" alt="unicorn"/>
              <img src={ethLogo} className="ethLogo" alt = "ethLogo"/>
          </header>
          <div className="Account-info">
              Address: {this.state.currentMaskAddress}<br />
              Ether: {this.state.ethBalance} ETH &nbsp;
              Tokens: {this.state.tokenBalance} UNT
          </div>
          <div className="Approval">
              Tokens approved: {this.state.tokenAllowance}&nbsp;&nbsp;&nbsp;
              <button className="approveZero" onClick={() => {this.approveAllowance(0) }}>Zero Approval</button>
          </div>
          <div className="buyButton">
              {/*<input type="text" id="buyID" ref={(input) => { this.textInput = input; }}/>*/}
              <input
                className="buyInput"
                value={this.state.value}
                onChange={this.onInputChange}
              />
              <input type="button" value="Buy" onClick={() => {this.buyTokens() }}/>
          </div>
      </div>
    );
  }
}

export default App;
