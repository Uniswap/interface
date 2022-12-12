import darkSwapSrc from './images/darkSwap.png'
import darkWalletsSrc from './images/darkWallets.png'
import lightSwapSrc from './images/lightSwap.png'
import lightWalletsSrc from './images/lightWallets.png'

export const CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.',
  },
  {
    to: '/nfts',
    title: 'Trade NFTs',
    description: 'Buy and sell NFTs across marketplaces to find more listings at better prices.',
  },
  {
    to: '/pool',
    title: 'Earn fees',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
  },
  {
    to: 'https://support.uniswap.org/',
    external: true,
    title: 'Build dApps',
    description: 'Build on the largest DeFi protocol on Ethereum with our tools.',
  },
]

export const STEPS = [
  {
    title: 'Connect a wallet',
    description: 'Connect your preferred crypto wallet to the Uniswap Interface.',
    lightImgSrc: lightWalletsSrc,
    darkImgSrc: darkWalletsSrc,
  },
  {
    title: 'Swap!',
    description: 'Trade crypto and NFTs through Uniswap’s platform',
    lightImgSrc: lightSwapSrc,
    darkImgSrc: darkSwapSrc,
  },
]
