import darkNftCardImgSrc from './images/darkNftCard.png'
import darkSwapSrc from './images/darkSwap.png'
import darkSwapCardImgSrc from './images/darkSwapCard.png'
import darkWalletsSrc from './images/darkWallets.png'
import lightNftCardImgSrc from './images/lightNftCard.png'
import lightSwapSrc from './images/lightSwap.png'
import lightSwapCardImgSrc from './images/lightSwapCard.png'
import lightWalletsSrc from './images/lightWallets.png'
import tokens from './images/tokens.png'

export const CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.',
    darkBackgroundImgSrc: darkSwapCardImgSrc,
    lightBackgroundImgSrc: lightSwapCardImgSrc,
  },
  {
    to: '/nfts',
    title: 'Trade NFTs',
    description: 'Buy and sell NFTs across marketplaces to find more listings at better prices.',
    darkBackgroundImgSrc: darkNftCardImgSrc,
    lightBackgroundImgSrc: lightNftCardImgSrc,
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
    title: 'Transfer crypto',
    description: 'Trade crypto and NFTs through Uniswap’s platform',
    lightImgSrc: tokens,
    darkImgSrc: tokens,
  },
  {
    title: 'Trade tokens and NFTs',
    description: 'Trade crypto and NFTs through Uniswap’s platform',
    lightImgSrc: lightSwapSrc,
    darkImgSrc: darkSwapSrc,
  },
]
