# Uniswap Widgets

This package provides React components that wrap simple Uniswap-related functionality.

## Swap Widget

The Swap Widget provides complete trading functionality within a single React component. This widgets supports theming to match your application styles, token list configuration, convenience fees for funding your project, and requires integrators to pass a valid web3 provider. (The provider can be a read-only network provider, but a complete signer is necessary to execute swaps.)

### Installation

Install the widgets library via `npm` or `yarn`. If you do not already use `redux` and `react-redux`, you'll need to add them as well. 

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

- [NextJS](https://github.com/Uniswap/widgets-demo/tree/nextjs)
- [Create React App](https://github.com/Uniswap/widgets-demo/tree/cra)
