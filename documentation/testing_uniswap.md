# Uniswap Testing Tutorial

## ERC20 contract checking

It is important that all ERC20 tokens, which are traded inside Uniswap, are fully ERC20 compliant. If tokens are not ERC20 compliant issues can arise. One example of this is the Binance (BNB) token which does not return a Bool as part of the "transfer" function. CyberMiles has an [ERC Checker](https://lity.readthedocs.io/en/latest/erc-contract-checker-guide.html?highlight=checker) which is part of the [Lity compiler](https://lity.readthedocs.io/en/latest/developers-guide.html#developers-guide) it is recommended to verify and thoroughly test any ERC20 tokens which are being added to Uniswap. 

ERC20 compliance and Uniswap compatibility are tricky areas to navigate. Sometimes even though an ERC20 token's smart contract syntax passes compliance some overriden functionality can result in behaviour which is incompatible with the Uniswap frontend. An example of this is the Bancor Smart Token contract. The Bancor Smart Token can not operate with Uniswap because the Unlock does not work consistently. More specifically, the Bancor Smart Token requires that its "approve" function to be called twice in 2 separate transactions - once to change the allowance to 0 and secondly to change it to the new allowance value.

Of course, the Uniswap frontend always passes in a non-zero argument into the "approve" function (in a single step). With this in mind let's start to look at the Uniswap functions. Specifically how they are called from both the Vyper contracts and from the Uniswap frontend UI. We will start with the Unlock (approve) function.

## Testing Uniswap functions

### Unlock

Uniswap performs transactions on behalf of a token contract. The ERC20 standard provides a standard mechanism for this sort of behaviour; namely the approve and allowance functions. Let's take a look at how Uniswap utilizes these standard ERC20 functions both in its smart contracts and in its frontend.

#### Unlock - Vyper contracts

The Vyper contracts can execute the approve and allowance functions via the console.

##### Approve

```javascript
// Approve 
deployedYuanToken.approve(deployedUniswapFactoryContract.getExchange(deployedYuanToken.address), aLargeAmount, {from: tokenOwner})
```

The above command calls the approve function of the deployedYuanToken and passes in the yuanExchangeInstance's address as well as a large number i.e. 1 million. When this transaction succeeds, the tokenHolder will have provided the yuanExchangeInstance with the ability to spend YUAN tokens on the tokenOwner's behalf. This does not spend tokens it just provides approval in principle. A tokenOwner still can not spend tokens if they don't have any i.e. whilst the yuanExchangeInstance has the approval to spend some deployedYuanToken's on behalf of the tokenHolder, MetaMask will never actually allow that transaction to proceed if the tokenOwner does not actually hold any deployedYuanToken's in its account.

##### Allowance

```javascript
// Allowance
web3.fromWei(deployedYuanToken.allowance("0x05849FFc9b899CaFbCda3BBcC22ED93270dCec7c", yuanExchangeInstance.address), 'cmt')
0
```

The above command is an example of an instance where yuanExchangeInstance does not have pre-approval to spend deployedYuanToken's on behalf of the account address called "0x05...3c7c". Notice how the command returns zero (0).

#### Unlock - Frontend

The Unlock button in the Uniswap frontend UI performs the approve task (which we just covered above).
![Uniswap Screenshot](./images/uniswap_unlock_ui.png)

If we go ahead and click Unlock (and approve the transaction in MetaMask using account address "0x05...3c7c") the Uniswap frontend will instantiate a web3 contract object

```javascript
const contract = new web3.eth.Contract(ERC20_ABI, selectedTokenAddress);
```
As well as, call the approve function of the token contract instance.

```javascript
contract.methods.approve
```
The entire code snippet for the Unlock button in the frontend is as follows.

```javascript
<button
        className='currency-input-panel__sub-currency-select'
        onClick={() => {
          const contract = new web3.eth.Contract(ERC20_ABI, selectedTokenAddress);
          const amount = BN(10 ** decimals).multipliedBy(10 ** 8).toFixed(0);
          contract.methods.approve(fromToken[selectedTokenAddress], amount).send({ from: account }, (err, data) => {
              if (!err && data) {
                addPendingTx(data);
                addApprovalTx({ tokenAddress: selectedTokenAddress, txId: data});
              }
            });
        }}
      >Unlock</button>
```
If we now return to the console and run the allowance command once more, we will see that the yuanExchangeInstance now has the approval to spend 100000000 deployedYuanToken's on behalf of the account address "0x05...3c7c".

```javascript
web3.fromWei(deployedYuanToken.allowance("0x05849FFc9b899CaFbCda3BBcC22ED93270dCec7c", yuanExchangeInstance.address), 'cmt')
//100000000
```

