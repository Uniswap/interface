import { InterfaceElementName } from '@uniswap/analytics-events'
import { DollarSign, Terminal } from 'react-feather'
import styled from 'styled-components/macro'
import { lightTheme } from 'theme/colors'

import darkArrowImgSrc from './images/aboutArrowDark.png'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import darkTerminalImgSrc from './images/aboutTerminalDark.png'
import nftCardImgSrc from './images/nftCard.png'
import swapCardImgSrc from './images/swapCard.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, and sell EVM and Cosmos assets.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: swapCardImgSrc,
    lightBackgroundImgSrc: swapCardImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/pool',
    title: 'Provide liquidity',
    description: 'Provide liquidity to pools on Forge and earn fees on swaps.',
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
    description: 'Transfer assets to Evmos from EVM and Cosmos chains through Axelar Bridge',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Bridge now',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },
  {
    to: 'https://app.stride.zone/',
    external: true,
    title: 'Liquid stake',
    description: 'Stake your Evmos to earn rewards while using staking it staked token in DeFi',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Liquid stake your assets',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://app.evmos.org/governance',
    external: true,
    title: 'Governance',
    description: 'Shape the future of Forge. Vote in Evmos governance and discuss upcoming blueprints',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Trade NFTs',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://app.evmos.org/assets',
    external: true,
    title: 'IBC conversion',
    description: 'Convert your IBC assets in and out of the Evmos EVM',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Developer docs',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },

  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'Build dApps',
    description: 'Learn of ways to contribute to the development of Forge',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Developer docs',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },
  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'Community',
    description: 'Join our thriving community and connect with like-minded people',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: 'Join the community',
    elementName: InterfaceElementName.ABOUT_PAGE_EARN_CARD,
  },
]
