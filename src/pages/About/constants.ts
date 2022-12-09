import swapSrc from './images/swap.png'
import walletsSrc from './images/wallets.png'

export const CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Discover and swap top tokens on Ethereum, Polygon, Optimism, and more.',
  },
  {
    to: '/nfts',
    title: 'Trade NFTs',
    description: 'Buy & sell NFTs across marketplaces to find more listings at better prices.',
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
    lightImgSrc: walletsSrc,
    darkImgSrc: walletsSrc,
  },
  {
    title: 'Swap!',
    description: 'Trade crypto and NFTs through Uniswap’s platform',
    lightImgSrc: swapSrc,
    darkImgSrc: swapSrc,
  },
]
