import { InterfaceElementName } from '@uniswap/analytics-events'

import BannerPools from './images/BannerPools.png'
import swapCardImgSrc from './images/swapCard.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Syscoin, Rollux, Optimism, and more.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: swapCardImgSrc,
    lightBackgroundImgSrc: swapCardImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/pools',
    title: 'Earn',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    cta: 'Provide liquidity',
    darkBackgroundImgSrc: BannerPools,
    lightBackgroundImgSrc: BannerPools,
    elementName: InterfaceElementName.ABOUT_PAGE_EARN_CARD,
  },
]
