import { InterfaceElementName } from '@uniswap/analytics-events'
import { DollarSign, Terminal } from 'react-feather'
import styled from 'styled-components/macro'
import { lightTheme } from 'theme/colors'

import Arrow from '../../pages/Landing/images/arrow.svg'
import Bridge from '../../pages/Landing/images/bridge.svg'
import Building from '../../pages/Landing/images/building.svg'
import Code from '../../pages/Landing/images/code.svg'
import Drop from '../../pages/Landing/images/droplet.svg'
import People from '../../pages/Landing/images/people.svg'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import nftCardImgSrc from './images/nftCard.png'
import swapCardImgSrc from './images/swapCard.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Trade and explore EVM and Cosmos tokens.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: swapCardImgSrc,
    lightBackgroundImgSrc: swapCardImgSrc,
    elementName: InterfaceElementName.ABOUT_PAGE_SWAP_CARD,
  },
  {
    to: '/pool',
    title: 'Fuel the Forge',
    description: 'Provide liquidity to pools and earn fees on swaps.',
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
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={Bridge} />,
    cta: 'Bridge assets',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },
  {
    to: 'https://app.stride.zone/',
    external: true,
    title: 'Liquid stake',
    description: 'Stake your Evmos to earn rewards while using staked token in DeFi',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={Drop} />,
    cta: 'Liquid stake Evmos',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://app.evmos.org/governance',
    external: true,
    title: 'Governance',
    description: 'Shape the future. Vote in Evmos governance and discuss upcoming blueprints',
    lightIcon: <DollarSign color={lightTheme.textTertiary} size={48} />,
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={Building} />,
    cta: 'Vote',
    elementName: InterfaceElementName.ABOUT_PAGE_BUY_CRYPTO_CARD,
  },

  {
    to: 'https://app.evmos.org/assets',
    external: true,
    title: 'IBC conversion',
    description: 'Convert your IBC assets in and out of the Evmos EVM',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={Arrow} />,
    cta: 'Conversion page',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },

  {
    to: 'https://docs.evmos.org/',
    external: true,
    title: 'Build dApps',
    description: 'Learn of ways to contribute to the development of Forge',
    lightIcon: <Terminal color={lightTheme.textTertiary} size={48} />,
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={Code} />,
    cta: 'Developer docs',
    elementName: InterfaceElementName.ABOUT_PAGE_DEV_DOCS_CARD,
  },
  {
    to: 'https://t.me/forgeDEX',
    external: true,
    title: 'Community',
    description: 'Join our thriving community and connect with like-minded people',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <img style={{ width: '42px', height: '42px' }} src={People} />,
    cta: 'Join us',
    elementName: InterfaceElementName.ABOUT_PAGE_EARN_CARD,
  },
]
