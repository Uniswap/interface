# Universal Links

Universal links allow 3rd parties to prompt the app to open to specific screens when it is installed on their device. If the app isn't installed it will open that page in Safari (a 404 on uniswap.org in this case). All universal links must use the the prefix `https://uniswap.org/app`.

## Supported Screens

Currently, there are two screens that have deep link support: `transaction` and `swap` screens. These screens are specified by setting the query parameter `screen`. Given the wallet supports multiple imported addresses, all routes must also specify the `userAddress` the deep link is referring to.

Failing to include a valid `screen` or `userAddress` will result in the app opening up to the Home screen.

### Activity Screen

Routes to activity screen for given `userAddress`.

Example:

```
https://uniswap.org/app?screen=transaction&userAddress=0x123...789
```

### Swap Screen

When routing to the swap screen, including the various swap data as query parameters will open the swap screen with the swap details populated. Failing to include the required swap parameters or providing invalid parameters will result in the swap screen opening without any details populated.

Parameters:

- `inputCurrencyId`: the currency the user wishes to swap. Must be of format </chain id/>-</token address/>
- `ouputCurrencyId`: the currency the user wishes to receive. Must be of format </chain id/>-</token address/>
- `currencyField`: used to specify whether `amount` refers to how much the user wishes to expend or receive. Value can either be `input` or `output`
- `amount`: the currency amount the user either wishes to expend or receive

Example (swap 100 Ethereum mainnet DAI for Ethereum mainnet UNI):

```
https://uniswap.org/app?screen=swap&userAddress=0x123...789&inputCurrencyId=1-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrencyId=1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=input&amount=100
```

Example (swap Polygon DAI for 100 Polygon UNI):

```
https://uniswap.org/app?screen=swap&userAddress=0x123...789&inputCurrencyId=137-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrencyId=137-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&currencyField=output&amount=100
```
