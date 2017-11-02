import React, { Component } from 'react';
import unicorn from './images/unicornNoBackground.png';
import ethLogo from './images/ethLogo.png';
import './App.css';



var uniswapABI = [{"constant":false,"inputs":[{"name":"tokenAmount","type":"uint256"}],"name":"ownerTokenWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"ethAmount","type":"uint256"}],"name":"ownerEthWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"sellQuantity","type":"uint256"},{"name":"minimumEth","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"tokenToEth","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalTokenQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"minimumTokens","type":"uint256"},{"name":"timeout","type":"uint256"}],"name":"ethToTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"initialTokenQuantity","type":"uint256"}],"name":"initiateUniswap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalEthQuantity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"invariant","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_tokenAddress","type":"address"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"tokensPurchased","type":"uint256"},{"indexed":false,"name":"ethSpent","type":"uint256"}],"name":"TokenPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"buyer","type":"address"},{"indexed":false,"name":"ethPurchased","type":"uint256"},{"indexed":false,"name":"tokensSpent","type":"uint256"}],"name":"EthPurchase","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
var uniswapAddress = '0x827642f7f022bd74294fd62c1f02a07f3d4ff2bd';
var uniswapContract = window.web3.eth.contract(uniswapABI).at(uniswapAddress);

var tokenABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
var tokenAddress = '0xca9901076d02f89794262869aad1340bd45d8489';
var tokenContract = window.web3.eth.contract(tokenABI).at(tokenAddress);

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
    this.state = {ethBalance: 0,
                  tokenBalance: 0,
                  tokenAllowance: null,
                  currentMaskAddress: window.web3.eth.accounts[0],
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
                  tokenBuyError: '',
                  ethBuyError: '',
                  networkMessage: ''
    }

    this.buyTokens = this.buyTokens.bind(this);
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
    this.getEthBalance();
    this.getTokenBalance();
    this.getAllowance();
  }


  componentDidMount(){
    this.tokenBuyRate(1);
    this.ethBuyRate(0.5);
  }

  checkNetwork() {
    var self = this;

    window.web3.version.getNetwork((err, netId) => {
      switch (netId) {
      case "1":
      console.log('This is mainnet')
      self.setState({networkMessage: 'Connected to Ethereum Mainet, please switch to Rinkeby and refresh'});
      break
      case "2":
      console.log('This is the deprecated Morden test network.')
      self.setState({networkMessage: 'Connected to Morden testnet, please switch to Rinkeby and refresh'});
      break
      case "3":
      self.setState({networkMessage: 'Connected to Ropstein testnet, please switch to Rinkeby and refresh'})
      break
      default:
      console.log('This is an unknown network.')
      }
      })

  }

  approveAllowance(value) {
    tokenContract.approve(uniswapAddress, value, function(error, balance) {
      console.log(balance);
    });
  }

  getMaskAddress() {
    var address = window.web3.eth.accounts[0];
    this.setState({currentMaskAddress: address})
  }

  getEthBalance() {
    var self = this;

    window.web3.eth.getBalance(this.state.currentMaskAddress, function(error, balance) {
      var ethValue = window.web3.fromWei(balance.toNumber());
      var roundedValue=Math.round(ethValue*10000)/10000;
      self.setState({ethBalance: roundedValue});
    });
  }

  getTokenBalance() {
    var self = this;

    tokenContract.balanceOf(this.state.currentMaskAddress, function(error, balance) {
      var tokenAmount = (balance.toNumber())/1000000;
      self.setState({tokenBalance: tokenAmount});
    });
  }

  getAllowance() {
    var self = this;

    tokenContract.allowance(this.state.currentMaskAddress, uniswapAddress, function(error, balance) {
      var tokensAllowed = (balance.toNumber())/1000000;
      self.setState({tokenAllowance: tokensAllowed});
    });
  }

  getInvarient() {
    var self = this;

    uniswapContract.invariant.call(function(err, value){
      var number = value.toNumber();
      //console.log("invariant: " + number/(10**24));
      self.setState({invariant: number});
    });
  }

  getMarketEth() {
    var self = this

    uniswapContract.totalEthQuantity.call(function(err, value){
      var number = value.toNumber();
      //console.log("marketEthQuantity: " + number/(10**18));
      self.setState({marketEth: number});
    });
  }

  getMarketTokens() {
    var self = this

    uniswapContract.totalTokenQuantity.call(function(err, value){
      var number = value.toNumber();
      //console.log("marketTokenQuantity: " + number/(10**6));
      self.setState({marketTokens: number});
    });
  }

  buyTokens() {
    var self = this;
    var minTokens = this.state.minimumTokensPurchased

    window.web3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        uniswapContract.ethToTokens.sendTransaction(minTokens, maxTime,
            {from: window.web3.eth.coinbase, value:window.web3.toWei(self.state.tokenCost,'ether') },
            function(err, txHash) {}
        );
    });
  }

  sellTokens() {
    //purchase will go through if the amount of ETH is received is within 10%
    //this is will be changed by full release, and will be a selectable range
    var minEth = this.state.minimumEthPurchased*0.9;
    var tokensSold = this.state.ethCost;

    window.web3.eth.getBlock('latest', function(error, blockInfo) {
        var time = blockInfo.timestamp;
        var maxTime = time + 300; //current block time + 5mins

        uniswapContract.tokenToEth.sendTransaction(tokensSold, minEth, maxTime, {
            from: window.web3.eth.coinbase}, function(err, txHash) {}
        );
    });
  }

  onBuyTokensInputChange(event) {
    var buyTokensInput = event.target.value;
    if(buyTokensInput && buyTokensInput !== 0){
      this.setState({ minimumTokensPurchased: buyTokensInput });
      this.tokenBuyRate(buyTokensInput);
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
      this.setState({tokenBuyRate: rate,
                     tokenCost: ethRequired,
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
      var rate = ethPurchased/tokensRequired;
      this.setState({ethBuyRate: rate,
                     ethCost: tokensRequired,
                     ethFee: fee
                     });
    }
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
        <div className="titled-container">
          <div className="title">
            <div className="front">UNISWAP</div>
            <div className="back">UNISWAP</div>
          </div>
        </div>
        <img src={unicorn} className="unicorn" alt="unicorn"/>
        <img src={ethLogo} className="ethLogo" alt = "ethLogo"/>
        <div className="Warning">{this.state.networkMessage}</div>
        <div className="Account-info">
        Address : {this.state.currentMaskAddress}<br />
        Ether : {this.state.ethBalance} ETH &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        Tokens: {this.state.tokenBalance.toFixed(2)} UNI<br/>
        </div>
        <div className="instructions">
          <div className="instructions-title">Instructions and Stuff</div>
          <div className="instructions-text">
            1) Add UNI test token address to MetaMask (first time only)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;Token Address: <i>{tokenAddress}</i><br/><br/>
            2) Check that MetaMask is connected to the Rinkeby Testnet<br/><br/>
            3) You can now buy UNI test tokens with ETH! Visit the&nbsp;
            <span className="instructions-link"><a href= "https://faucet.rinkeby.io/">Rinkeby faucet</a></span> to aquire testnet ETH <br/><br/>
            4) To buy ETH with UNI you must approve the Uniswap smart contract to transfer UNI tokens on your behalf. Click the "Approve" button now! (first time only)<br/><br/>
            5) Rate is variable based on token availiblity, enter number of tokens to see rate and cost.<br/><br/>
            6) This is a proof-of-concept for a decentralized Market Maker exchange. Stay tuned for token-to-token pairs, the ability to become a Market Creator and collect fees,
            and a Mainet launch! :) <br/> <br/>
            7) This demo was hastily programmed by a single developer <i>(Hi, my name is Hayden!)</i>. Please reach out to me with any questions, comments, complaints, or bug reports.<br/><br/>
            &nbsp;&nbsp;Email: hayden@uniswap.io &nbsp;&nbsp; GitHub: https://github.com/haydenadams/uniswap<br/>
            &nbsp;&nbsp;ETH Address: 0x4779721CaC18A46DbCF148f2Dd7A8E6cc1F90078<br/><br/>
          </div>
        </div>
        <div className="Approval">
            {/*Tokens approved: {this.state.tokenAllowance}&nbsp;&nbsp;&nbsp;*/}
            <button className="approveButton" onClick={() => {this.approveAllowance(5000*10**6) }}>Approve</button>
          {/*<button className="approveZero" onClick={() => {this.approveAllowance(0) }}>Zero Approval</button>*/}
        </div>
        <div className="exchange">
          <div className="exchange-buyTokensButton">
              <input
                className="exchange-buyTokensInput"
                //value={this.state.value}
                onChange={this.onBuyTokensInputChange}
              />
              <input className="exchange-buyTokensInputButton" type="exchange-button" defaultValue="Buy UNI" onClick={() => {this.buyTokens() }}/>
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
              <input className="exchange-buyEthInputButton" type="exchange-button" defaultValue="Buy ETH" onClick={() => {this.sellTokens() }}/>
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
