import { create } from '@storybook/theming'

// this themes the storybook UI
const uniswapBaseTheme = {
  brandTitle: 'Uniswap Design',
  brandUrl: 'https://uniswap.org',
  brandImage: 'https://ipfs.io/ipfs/QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir',
}
export const light = create({
  base: 'light',
  ...uniswapBaseTheme,
})

// export const dark = create({
//   base: 'dark',
//   ...uniswapBaseTheme,
// })
