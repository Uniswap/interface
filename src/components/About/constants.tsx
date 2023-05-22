import { InterfaceElementName } from '@uniswap/analytics-events'
import { isMobile } from 'utils/userAgent'

import BannerPools from './images/bannerDeskDark5.png'
import BannerLightPools from './images/bannerDeskLight5.png'
import BannerMobilePools from './images/bannerMobileDark5.png'
import BannerMobileLightPools from './images/bannerMobileLight5.png'
import swapCardImgSrc from './images/swapBannerDark.png'
import swapCardMobileImgSrc from './images/swapBannerDarkMobile.png'
import swapCardLightImgSrc from './images/swapBannerLight.png'
import swapCardMobileLightImgSrc from './images/swapBannerLightMobile.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Syscoin, Rollux, Optimism, and more.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: isMobile ? swapCardMobileImgSrc : swapCardImgSrc,
    lightBackgroundImgSrc: isMobile ? swapCardMobileLightImgSrc : swapCardLightImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/pools',
    title: 'Earn',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    cta: 'Provide liquidity',
    darkBackgroundImgSrc: isMobile ? BannerMobilePools : BannerPools,
    lightBackgroundImgSrc: isMobile ? BannerMobileLightPools : BannerLightPools,
    elementName: InterfaceElementName.ABOUT_PAGE_EARN_CARD,
  },
]
