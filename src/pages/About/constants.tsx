import { ElementName } from '@uniswap/analytics-events'
import { DollarSign, Terminal } from 'react-feather'
import styled from 'styled-components/macro'
import { lightTheme } from 'theme/colors'

import darkArrowImgSrc from './images/aboutArrowDark.png'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import darkDollarImgSrc from './images/aboutDollarDark.png'
import darkTerminalImgSrc from './images/aboutTerminalDark.png'
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

const StyledCardLogo = styled.img`
  min-width: 20px;
  min-height: 20px;
  max-height: 48px;
  max-width: 48px;
`

export const MORE_CARDS = [
  {
    to: 'https://info.uniswap.org',
    external: true,
    title: 'Analytics',
    description: 'View, track and analyze Uniswap Protocol analytics.',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: 'Explore data',
    // elementName: ElementName.ABOUT_PAGE_ANALYTICS_CARD, // todo: need to add this to the analytics lib?
  },
  {
    to: '/pool',
    title: 'Earn',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkDollarImgSrc} alt="Earn" />,
    cta: 'Provide liquidity',
    // elementName: ElementName.ABOUT_PAGE_EARN_CARD, // todo: need to add this to the analytics lib?
  },
  {
    to: 'https://docs.uniswap.org',
    external: true,
    title: 'Build dApps',
    description: 'Build apps and tools on the largest DeFi protocol on Ethereum.',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
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
