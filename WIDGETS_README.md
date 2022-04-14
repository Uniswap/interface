# Uniswap Labs Swap Widget

The Swap Widget bundles the whole swapping experience into a single React component that developers can easily embed in their app with one line of code. 

![swap widget screenshot](https://raw.githubusercontent.com/Uniswap/interface/main/src/assets/images/widget-screenshot.png)

You can customize the theme (colors, fonts, border radius, and more) to match the style of your application. You can also configure your own default token list and optionally set a convenience fee on swaps executed through the widget on your site.

## Installation

Install the widgets library via `npm` or `yarn`. If you do not already use the widget's peerDependencies `redux` and `react-redux`, then you'll need to add them as well. 

```js
yarn add @uniswap/widgets redux react-redux
```
```js
npm i --save @uniswap/widgets redux react-redux
```

## Documentation

- [overview](https://docs.uniswap.org/sdk/widgets/swap-widget)
- [api reference](https://docs.uniswap.org/sdk/widgets/swap-widget/api)

## Example Apps

Uniswap Labs maintains two demo apps in branches of the [widgets-demo](https://github.com/Uniswap/widgets-demo) repo:

- [NextJS](https://github.com/Uniswap/widgets-demo/tree/nextjs)
- [Create React App](https://github.com/Uniswap/widgets-demo/tree/cra)

Others have also also released the widget in production to their userbase:

- [OpenSea](https://opensea.io/)
- [Friends With Benefits](https://www.fwb.help/)
- [Oasis](https://oasis.app/)

## Legal notice

Uniswap Labs encourages integrators to evaluate their own regulatory obligations when integrating this widget into their products, including, but not limited to, those related to economic or trade sanctions compliance.
