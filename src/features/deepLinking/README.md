# Deep Links

Deep links allow 3rd parties to prompt the app to open to specific screens. All deep links must use the the prefix `uniswap://`.

## Supported Screens

Currently, there are two screens that have deep link support: `transaction` and `swap` screens. These screens are specified by setting the query parameter `screen`. Given the wallet supports multiple imported addresses, all routes must also specify the `userAddress` the deep link is referring to.

Failing to include a valid `screen` or `userAddress` will result in the app opening up to the Home screen.

### Transaction Screen

When routing to the transaction screen, including the `txHash` query parameter will open up a specific transaction's information in the app. Failing to include a `txHash` parameter will result in the transaction history screen opening.

Example:

```
uniswap://?screen=transaction&userAddress=0x123...789$txHash=0xabc...123
```

### Swap Screen

When routing to the swap screen, including the various swap data as query parameters will open the swap screen with the swap details populated. Failing to include the required swap parameters or providing invalid parameters will result in the swap screen opening without any details populated.

Parameters:

- `inputCurrency`: the currency the user wishes to swap. Must be of format </chain id/>-</token address/>
- `ouputCurrency`: the currency the user wishes to receive. Must be of format </chain id/>-</token address/>
- `currencyField`: used to specify whether `amount` refers to how much the user wishes to expend or receive. Value can either be `input` or `output`
- `amount`: the currency amount the user either wishes to expend or receive

Example (swap 100 Ethereum mainnet DAI for Ethereum mainnet UNI):

```
uniswap://?screen=swap&userAddress=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&inputCurrency=1-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrency=1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=input&amount=100
```

Example (swap Polygon DAI for 100 Polygon UNI):

```
uniswap://?screen=swap&userAddress=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&inputCurrency=137-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrency=137-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=output&amount=100
```
