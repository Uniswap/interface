# Logging with Uniswap

Each of the Uniswap smart contract functions use log events which write permanent data to the blockchain after each successful execution.

Let's take a look at the available log events and then write some web3 commands to create a watcher.

## Uniswap Log Events

### TokenPurchase
TokenPurchase: event({buyer: indexed(address), eth_sold: indexed(uint256(wei)), tokens_bought: indexed(uint256)})

### EthPurchase
EthPurchase: event({buyer: indexed(address), tokens_sold: indexed(uint256), eth_bought: indexed(uint256(wei))})

### AddLiquidity
AddLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})

### RemoveLiquidity
RemoveLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})

### Transfer
Transfer: event({_from: indexed(address), _to: indexed(address), _value: uint256})

### Approval
Approval: event({_owner: indexed(address), _spender: indexed(address), _value: uint256})
