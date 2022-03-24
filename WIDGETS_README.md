# Uniswap Widgets

This package provides React components that wrap simple Uniswap-related functionality.

## Swap Widget

The Swap Widget provides complete trading functionality within a single React component.

This widget supports theming to match your application styles, token list configuration, and convenience fees for funding your project. 

A valid web3 provider is required for the widget to function. The provider can be a read-only network provider, but a complete signer is necessary to execute swaps. This means you will need to manage connecting users' wallets to your application.

### Installation

Install the widgets library via `npm` or `yarn`. If you do not already use the widget's peerDependencies `redux` and `react-redux`, then you'll need to add them as well. 

```js
yarn add @uniswap/widgets redux react-redux
```
```js
npm i --save @uniswap/widgets redux react-redux
```

### Documentation

- [overview](https://docs.uniswap.org/sdk/widgets/swap-widget)
- [api reference](https://docs.uniswap.org/sdk/widgets/swap-widget/api)

### Example Apps

Uniswap Labs maintains two demo apps in branches of the widgets-demo repo:

- [NextJS](https://github.com/Uniswap/widgets-demo/tree/nextjs)
- [Create React App](https://github.com/Uniswap/widgets-demo/tree/cra)

Others have also also released the widget in production to their userbase:

- [OpenSea](https://opensea.io/)
- [Friends With Benefits](https://www.fwb.help/)
- [Oasis](https://oasis.app/)
