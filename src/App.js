import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Title from './components/misc/Title';
import Instructions from './components/menus/Instructions';
import unicorn from './images/unicornNoBackground.png';
import ethLogo from './images/ethLogo.png';

const localweb3 = new Web3(window.web3.currentProvider);
//console.log(localweb3);
console.log(localweb3);

var uniswapABI = [{"constant":false,"inputs":[{"name":"tokenAmount","type":"uint256"}],"name":"ownerTokenWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenAmount","type":"uint256"}],"name":"ownerTokenDeposit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"ethAmount","type":"uint256"}],"name":"ownerEthWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"sellQuantity","type":"uint256"},{"name":"minimumEth","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"tokenToEth","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalTokenQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"minimumTokens","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"ethToTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"initialTokenQuantity","type":"uint256"}],"name":"initiateUniswap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalEthQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"invariant","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"ownerEthDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_tokenAddress","type":"address"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"tokensPurchased","type":"uint256"},{"indexed":false,"name":"ethSpent","type":"uint256"}],"name":"TokenPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"ethPurchased","type":"uint256"},{"indexed":false,"name":"tokensSpent","type":"uint256"}],"name":"EthPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
var uniswapAddress = '0x60e5f3cd0381c501971b6fbbddaa49cfd58a4fa1';
var uniswapContract = new localweb3.eth.Contract(uniswapABI, uniswapAddress);

var tokenABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
var tokenAddress = '0xca9901076d02f89794262869aad1340bd45d8489';
var tokenContract = new localweb3.eth.Contract(tokenABI, tokenAddress);

var addr = "0x6D9ba242E3D6aE3f909c1cCFF20ed4fcF3482EFe";
localweb3.eth.getAccounts().then(function(result, error){
   addr = result[0];
});


class App extends Component {
  constructor(props){
    super(props)
    this.state = {ethBalance: 0,
                  tokenBalance: 0,
                  tokenAllowance: null,
                  currentMaskAddress: addr,
                  minimumTokensPurchased: null,
                  minimumEthPurchased: null,
                  invariant: null,
                  marketEth: null,
                  marketTokens: null,
                  tokenBuyRate: 0,
                  ethBuyRate: 0,
                  tokenCost: 0,       //eth price of tokens
                  ethCost: 0,        //token price of eth
                  tokenFee: 0,
                  ethFee: 0,
                  networkMessage: ''
    }

    this.onBuyEthInputChange = this.onBuyEthInputChange.bind(this);
    this.onBuyTokensInputChange = this.onBuyTokensInputChange.bind(this);
    this.tokenBuyRate = this.tokenBuyRate.bind(this);
    this.ethBuyRate = this.ethBuyRate.bind(this);
  }

  componentWillMount(){
    this.checkNetwork();
    this.getMaskAddress();
    this.getInvarient();
    this.getMarketEth();
    this.getMarketTokens();
  }


  componentDidMount(){
    this.getTokenBalance();
    this.getEthBalance();
    this.getAllowance();
  }

  checkNetwork() {
    var self = this;

    localweb3.eth.net.getNetworkType((err, netId) => {
      switch (netId) {
      case "main":
      self.setState({networkMessage: 'MetaMask connected to Ethereum Mainet. Switch to Rinkeby and refresh!'});
      break
      case "morden":
      self.setState({networkMessage: 'MetaMask connected to Morden testnet. Switch to Rinkeby and refresh!'});
      break
      case "kovan":
      self.setState({networkMessage: 'MetaMask connected to Kovan testnet. Switch to Rinkeby and refresh!'});
      break
      case "ropsten":
      self.setState({networkMessage: 'MetaMask connected to Ropstein testnet. Switch to Rinkeby and refresh!'})
      break
      default:
      console.log('Connected to ' + netId);
      }
      })
  }

  approveAllowance(value) {
    tokenContract.methods.approve(uniswapAddress, value).send(
      {from: this.state.currentMaskAddress},
      function(err, txHash) {})
  }

  getMaskAddress() {
    var self = this;

    localweb3.eth.getAccounts().then(function(result, error){
      var address = result[0];
      self.setState({currentMaskAddress: address})
    });
  }

  getEthBalance() {
    var self = this;

    localweb3.eth.getBalance(this.state.currentMaskAddress, function(error, balance) {
      var ethValue = (balance/10**18);
      var roundedValue=Math.round(ethValue*10000)/10000;
      self.setState({ethBalance: roundedValue});
    });
  }

  getTokenBalance() {
    var self = this;

    // tokenContract.methods.balanceOf(this.state.currentMaskAddress).call().then(function(result, error){
    //   var amount = result/10**6
    //   console.log(result);
    //   self.setState({tokenBalance: amount});
    // })

    tokenContract.methods.balanceOf(this.state.currentMaskAddress).call(function(error, balance) {
      var amount = (balance/10**6);
      self.setState({tokenBalance: amount});
    });
  }

  getAllowance() {
    var self = this;

    tokenContract.methods.allowance(this.state.currentMaskAddress, uniswapAddress).call().then(function(result, error){
      var amount = result/10**6
      self.setState({tokenAllowance: amount});
    })
  }

  getInvarient() {
    var self = this;

    uniswapContract.methods.invariant().call().then(function(result, error){
      self.setState({invariant: result});
    })
  }

  getMarketEth() {
    var self = this

    uniswapContract.methods.totalEthQuantity().call().then(function(result, error){
      self.setState({marketEth: result});
    })
  }

  getMarketTokens() {
    var self = this

    uniswapContract.methods.totalTokenQuantity().call().then(function(result, error){
      self.setState({marketTokens: result});
    })
  }

  buyTokens() {
    var self = this;
    var minTokens = this.state.minimumTokensPurchased

    localweb3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        uniswapContract.methods.ethToTokens(minTokens, maxTime).send(
          {from: self.state.currentMaskAddress, value: self.state.tokenCost*10**18},
          function(err, txHash) {})
    });
  }

  buyEth() {
    var self = this;
    var minEth = this.state.minimumEthPurchased;
    var tokensSold = this.state.ethCost*10**6;

    localweb3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        uniswapContract.methods.tokenToEth(tokensSold, minEth, maxTime).send(
          {from: self.state.currentMaskAddress},
          function(err, txHash) {})
    });
  }

  onBuyTokensInputChange(event) {
    var buyTokensInput = event.target.value;
    if(buyTokensInput && buyTokensInput !== 0){
      this.setState({ minimumTokensPurchased: buyTokensInput });
      this.tokenBuyRate(buyTokensInput);
      this.getTokenBalance();
    }
  }

  onBuyEthInputChange(event) {
    var buyEthInput = event.target.value;
    if(buyEthInput && buyEthInput !== 0){
      this.setState({ minimumEthPurchased: buyEthInput });
      this.ethBuyRate(buyEthInput);
    }
  }

  tokenBuyRate(buyTokensInput) {
    if(buyTokensInput >= this.state.marketTokens/10**6) {
      this.setState({tokenBuyRate: 0,
                     tokenCost: 0,
                     tokenFee: 0,
                     tokenBuyError: 'Not enough tokens'
                    });
    }
    else{
      var tokensPurchased = buyTokensInput;
      var invar = this.state.invariant/10**24;
      var totalTokens = this.state.marketTokens/10**6;
      var totalEth = this.state.marketEth/10**18;
      var newTotalEth = invar/(totalTokens-tokensPurchased);
      var fee = (newTotalEth - totalEth)/500;
      var ethRequired = newTotalEth - totalEth + fee;
      var rate = tokensPurchased/ethRequired;
      //add 1% to cost displayed, some people will get more tokens than purchased
      //less TX's will fail the minTokens smart contract check
      var adjustedTokenCost = ethRequired*1.01;
      this.setState({tokenBuyRate: rate,
                     tokenCost: adjustedTokenCost,
                     tokenFee: fee
                     });
    }
  }

  ethBuyRate(buyEthInput) {
    if(buyEthInput >= this.state.marketEth/10**18) {
      this.setState({ethBuyRate: 0,
                     ethCost: 0,
                     ethFee: 0,
                     ethBuyError: 'Not enough tokens'
                    });
    }
    else{
      var ethPurchased = buyEthInput;
      var invar = this.state.invariant/10**24;
      var totalEth = this.state.marketEth/10**18;
      var totalTokens = this.state.marketTokens/10**6;
      var newTotalTokens = invar/(totalEth-ethPurchased);
      var fee = (newTotalTokens - totalTokens)/500;
      var tokensRequired = newTotalTokens - totalTokens + fee;
      var rate = ethPurchased/(tokensRequired);
      //add 1% to cost displayed, some people will get more eth than purchased
      //less TX's will fail the minEth smart contract check
      var adjustedEthCost = tokensRequired*1.01;
      this.setState({ethBuyRate: rate,
                     ethCost: adjustedEthCost,
                     ethFee: fee
                     });
    }
  }


  render() {
    return (
      <div className="App">
        <Title />
        <div className="noICO">UNI is an ERC20 test token. This is not an ICO.</div>
        <img src={unicorn} className="unicorn" alt="unicorn"/>
        <img src={ethLogo} className="ethLogo" alt = "ethLogo"/>
        <div className="Warning">{this.state.networkMessage}</div>
        <div className="Account-info">
        Account Detected:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.ethBalance} ETH&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {this.state.tokenBalance.toFixed(2)} UNI<br/>
        {this.state.currentMaskAddress}
        &nbsp;&nbsp;
        <br/>
        </div>
        <Instructions />
        <div className="Approval">
            <button className="approveButton" onClick={() => {this.approveAllowance(20000*10**6) }}>Approve</button><br/><br/>
            {/*Tokens approved: {this.state.tokenAllowance}&nbsp;&nbsp;&nbsp;*/}
        </div>
        <div className="exchange">
          <div className="exchange-buyTokensButton">
              <input
                className="exchange-buyTokensInput"
                //value={this.state.value}
                onChange={this.onBuyTokensInputChange}
              />
              <input className="exchange-buyTokensInputButton" type="exchange-button" defaultValue="Buy UNI" readOnly="readOnly" onClick={() => {this.buyTokens() }}/>
              <p className="pinkText">
                &nbsp;&nbsp;Rate :&nbsp;&nbsp;&nbsp;{this.state.tokenBuyRate.toFixed(3)} UNI/ETH<br/>
                &nbsp;&nbsp;Cost :&nbsp;&nbsp;&nbsp;{this.state.tokenCost.toFixed(5)} ETH<br/>
                &nbsp;&nbsp;Fee :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.tokenFee.toFixed(5)} ETH<br/>
              </p>
          </div>
          <div className="exchange-buyEthButton">
              <input
                className="exchange-buyEthInput"
                //value={this.state.value}
                onChange={this.onBuyEthInputChange}
              />
              <input className="exchange-buyEthInputButton" type="exchange-button" defaultValue="Buy ETH" readOnly="readOnly" onClick={() => {this.buyEth() }}/>
              <p className="pinkText">
                &nbsp;&nbsp;Rate :&nbsp;&nbsp;&nbsp;{this.state.ethBuyRate.toFixed(4)} ETH/UNI<br/>
                &nbsp;&nbsp;Cost :&nbsp;&nbsp;&nbsp;{this.state.ethCost.toFixed(5)} UNI<br/>
                &nbsp;&nbsp;Fee :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.ethFee.toFixed(5)} UNI
              </p>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
