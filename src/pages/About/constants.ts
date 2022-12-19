import { ElementName } from '@uniswap/analytics-events'

import darkNftCardImgSrc from './images/darkNftCard.png'
import darkSwapSrc from './images/darkSwap.png'
import darkSwapCardImgSrc from './images/darkSwapCard.png'
import darkWalletsSrc from './images/darkWallets.png'
import lightNftCardImgSrc from './images/lightNftCard.png'
import lightSwapSrc from './images/lightSwap.png'
import lightSwapCardImgSrc from './images/lightSwapCard.png'
import lightWalletsSrc from './images/lightWallets.png'
import tokens from './images/tokens.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: darkSwapCardImgSrc,
    lightBackgroundImgSrc: lightSwapCardImgSrc,
    elementName: ElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/nfts',
    title: 'Trade NFTs',
    description: 'Buy and sell NFTs across marketplaces to find more listings at better prices.',
    cta: 'Explore NFTs',
    darkBackgroundImgSrc: darkNftCardImgSrc,
    lightBackgroundImgSrc: lightNftCardImgSrc,
    elementName: ElementName.ABOUT_PAGE_NFTS_CARD,
  },
]

export const MORE_CARDS = [
  {
    to: '/swap', // todo
    title: 'Analytics',
    description: 'View, track and analyze Uniswap Protocol analytics.',
    lightImgSrc: lightNftCardImgSrc, // todo
    darkImgSrc: darkNftCardImgSrc, // todo
    cta: 'Explore data',
    // elementName: ElementName.ABOUT_PAGE_ANALYTICS_CARD, // todo: need to add this to the analytics lib?
  },
  {
    to: '/swap', // todo
    title: 'Earn',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    lightImgSrc: lightNftCardImgSrc, // todo
    darkImgSrc: darkNftCardImgSrc, // todo
    cta: 'Provide liquidity',
    // elementName: ElementName.ABOUT_PAGE_EARN_CARD, // todo: need to add this to the analytics lib?
  },
  {
    to: '/swap', // todo
    title: 'Build dApps',
    description: 'Build apps and tools on the largest DeFi protocol on Ethereum.',
    lightImgSrc: lightNftCardImgSrc, // todo
    darkImgSrc: darkNftCardImgSrc, // todo
    cta: 'Developer docs',
    // elementName: ElementName.ABOUT_PAGE_DAPPS_CARD, // todo: need to add this to the analytics lib?
  },
]

// eslint-disable-next-line import/no-unused-modules
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
