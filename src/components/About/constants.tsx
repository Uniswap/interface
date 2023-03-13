import { InterfaceElementName } from '@uniswap/analytics-events'
import { DollarSign, Terminal } from 'react-feather'
import styled from 'styled-components/macro'
import { lightTheme } from 'theme/colors'

import darkArrowImgSrc from './images/aboutArrowDark.png'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import darkDollarImgSrc from './images/aboutDollarDark.png'
import darkTerminalImgSrc from './images/aboutTerminalDark.png'
import nftCardImgSrc from './images/nftCard.png'
import swapCardImgSrc from './images/swapCard.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: swapCardImgSrc,
    lightBackgroundImgSrc: swapCardImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/pool',
    title: 'Provide liquidity',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    cta: 'Provide liquidity',
    darkBackgroundImgSrc: nftCardImgSrc,
    lightBackgroundImgSrc: nftCardImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_NFTS_CARD,
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
    to: 'https://satellite.money/?source=avalanche&destination=evmos&asset_denom=uusdc&destination_address=',
    external: true,
    title: 'Bridge',
    description: 'Transfer assets to Evmos from EVM & Cosmos chain powered by Axelar',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Bridge now',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },
  {
    to: 'https://satellite.money/?source=avalanche&destination=evmos&asset_denom=uusdc&destination_address=',
    external: true,
    title: 'Liquid stake',
    description: 'Transfer assets to Evmos from EVM & Cosmos chain powered by Axelar',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Liquid stake your assets',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://satellite.money/?source=avalanche&destination=evmos&asset_denom=uusdc&destination_address=',
    external: true,
    title: 'NFTs',
    description: 'Transfer assets to Evmos from EVM & Cosmos chain powered by Axelar',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Trade NFTs',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'IBC conversion',
    description: 'Build apps and tools on the interchain.',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Developer docs',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },

  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'Build dApps',
    description: 'Build apps and tools on the interchain.',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Developer docs',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },
  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'Community',
    description: 'Provide liquidity to pools on Uniswap and earn fees on swaps.',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: 'Join the developer community',
    elementName: InterfaceElementName.ABOUT_PAGE_EARN_CARD,
  },

]
