import React from 'react'
import TextyAnim from 'rc-texty'

// Hero Imports

import EthereumLogo from './../assets/images/logo-Ethereum.svg'
import ArbitrumLogo from './../assets/images/logo-Arbitrum.svg'
import xDaiLogo from './../assets/images/logo-xDai.svg'
import gnosisChainLogo from './../assets/images/gnosis-chain.svg'
import PolygonLogo from './../assets/images/logo-Polygon.svg'

// Hero Imports

import RoutingUniswap from './../assets/images/routing-Uniswap.svg'
import RoutingSushiSwap from './../assets/images/routing-SushiSwap.svg'
import RoutingBaoSwap from './../assets/images/routing-BaoSwap.svg'
import RoutingHoneySwap from './../assets/images/routing-HoneySwap.svg'
import RoutingLevinSwap from './../assets/images/levinswap.svg'

// Features Imports

import Swap from './../assets/images/features/swap.png'
import EcoRouting from './../assets/images/features/eco-routing.png'
import Vote from './../assets/images/features/vote.png'
import Farming from './../assets/images/features/farm.png'
import DiyFarm from './../assets/images/features/diy-farm.png'
import Bridge from './../assets/images/features/bridge.png'

// Features Imports Animations

import SwapAnim from './../assets/images/animations/01_Swap.svg'
import EcoRoutingAnim from './../assets/images/animations/02_Eco_Routing.svg'
import VoteAnim from './../assets/images/animations/03_Vote.svg'
import FarmingAnim from './../assets/images/animations/04_Farming.svg'
import DiyFarmAnim from './../assets/images/animations/05_DIY_Farm.svg'
import BridgeAnim from './../assets/images/animations/06_Bridge.svg'

// Community Links Imports

import Discord from './../assets/images/isologo-discord.svg'
import Github from './../assets/images/isologo-github.svg'
import Twitter from './../assets/images/isologo-twitter.svg'

// Blog Images

import Entry1 from './../assets/images/blog/blog-entry-1.jpg'
import Entry2 from './../assets/images/blog/blog-entry-2.jpg'
import Entry3 from './../assets/images/blog/blog-entry-3.jpg'

// Stats Images

import UniSwapStats from './../assets/images/isologo-uniswap.svg'
import SushiSwapStats from './../assets/images/isologo-sushiswap.svg'
import BaoSwapStats from './../assets/images/isologo-baoswap.svg'
import HoneySwapStats from './../assets/images/isologo-honeyswap.svg'

// About Cards

import AboutGovernance from './../assets/images/about-governance.png'
import AboutFarming from './../assets/images/about-farming.png'
import AboutEcoRouting from './../assets/images/about-eco-routing.png'
import AboutBridging from './../assets/images/about-bridging.png'
import { scrollTo } from './helper-functions'

export const mainNavigation = [
    // {
    //     label: 'Features',
    //     href: '/#features',
    // },
    {
        label: 'Documentation',
        href: 'http://dxdocs.eth.link.ipns.localhost:8080/docs/Products/swapr/',
    },
    {
        label: 'Stats',
        href: '/#stats',
    },
    {
        label: 'Launch Swapr',
        href: '#',
        cta: true
    },
];

export const HeroContent = {
    mainText: 
        <span>Swap, Farm, Bridge and<br/> Vote on Defi unchained.</span>,
    heroLogos: [
        {
            img: EthereumLogo,
            title: 'Ethereum'
        },
        {
            img: ArbitrumLogo,
            title: 'Arbitrum'
        },
        {
            img: xDaiLogo,
            title: 'xDai'
        },
        {
            img: PolygonLogo,
            title: 'Polygon'
        },
    ],
    heroButtons: [
        {
            label: 'Launch Swapr',
            type: 'secondary',
            href: '#'
        },
        {
            label: 'Join Our Discord',
            type: 'dark',
            href: '#'
        }
    ]
};

export const RoutingThroughContent = {
    title: 'ROUTING THROUGH',
    companies: [
        {
            title: 'Uniswap',
            img: RoutingUniswap
        },
        {
            title: 'SushiSwap',
            img: RoutingSushiSwap
        },
        {
            title: 'BaoSwap',
            img: RoutingBaoSwap
        },
        {
            title: 'HoneySwap',
            img: RoutingHoneySwap
        },
        {
            title: 'Levinswap',
            img: RoutingLevinSwap
        },
    ]
}

export const FeaturesContent = {
    topBanner: {
        title: 'Swap, Farm, Bridge & Vote. DeFi unchained.',
        logos: [
            EthereumLogo,
            ArbitrumLogo,
            gnosisChainLogo
        ]
    },
    preHeader: 'Swapr Features',
    sectionTitle: 'Your DeFi Powertool',
    features: [
        {
            title: 'SWAP',
            content: 'Trade your favorite pairs on your favorite chains through the Swapr interface.',
            image: Swap,
            animation: SwapAnim,
            buttons: [
                {
                    label: 'SWAP',
                    onClick: () => {scrollTo('app-wrapper');},
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
        {
            title: 'ECO-ROUTING',
            content: 'The eco-router ensures the best price through established DEXes with no extra fees!',
            animation: EcoRoutingAnim,
            image: EcoRouting,
            buttons: [
                {
                    label: 'SWAP',
                    onClick: () => {scrollTo('app-wrapper');},
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
        {
            title: 'VOTE',
            content: 'LPs on the Swapr protocol can vote to adjust the fees on their pools.',
            image: Vote,
            animation: VoteAnim,
            buttons: [
                {
                    label: 'VOTE',
                    href: 'https://snapshot.org/#/swpr.eth',
                    type: 'primary',
                    external: true
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
        {
            title: 'FARMING',
            content: 'Users can participate in permissionless farming campaigns directly in the Swapr interface.',
            image: Farming,
            animation: FarmingAnim,
            buttons: [
                {
                    label: 'FARM',
                    href: '/#/rewards',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
        {
            title: 'DIY FARM',
            content: 'The Swapr protocol allows anyone to create farming campaigns. Any pair, any reward.',
            image: DiyFarm,
            animation: DiyFarmAnim,
            buttons: [
                {
                    label: 'CREATE CAMPAIGN',
                    href: '/#/liquidity-mining/create',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
        {
            title: 'BRIDGE',
            content: 'Bridge directly to or from any chain where Swapr is deployed.',
            image: Bridge,
            animation: BridgeAnim,
            buttons: [
                {
                    label: 'BRIDGE',
                    href: '/#/bridge',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/',
                    type: 'dark',
                    external: true
                },
            ]
        },
    ]
}

export const CommunityBannerContent = {
    preHeader: 'A DXdao Product',
    content: 'Owned and funded by the Community',
    buttons: [
        {
            label: 'GET INVOLVED',
            href: 'https://dxdao.eth.link/',
            type: 'primary'
        },
        {
            label: 'FORUM',
            href: 'https://daotalk.org/c/dx-dao/15',
            type: 'dark'
        },
    ]
}

export const CommunityLinksContent = {
    preHeader: 'Swapr Protocol',
    title: <span>Join an unstoppable <br/>community</span>,
    links: [
        {
            image: Discord,
            alt: 'Discord Logo',
            title: 'Discord',
            content: 'Join in on community discussion on the Swapr Discord.',
            button: {
                label: 'JOIN DISCORD',
                href: 'https://discord.gg/4QXEJQkvHH',
            },
        },
        {
            image: Github,
            alt: 'GitHub Logo',
            title: 'GitHub',
            content: <>Contribute to the <br/>Swapr repositories on GitHub.</>,
            button: {
                label: 'VISIT GITHUB',
                href: 'https://github.com/levelkdev/dxswap-dapp',
            },
        },
        {
            image: Twitter,
            alt: 'Twitter Logo',
            title: 'Twitter',
            content: 'Get the latest Swapr announcements on the Swapr Twitter.',
            button: {
                label: 'Follow on Twitter',
                href: 'https://twitter.com/SwaprEth',
            },
        },
    ]
}

export const BlogContent = {
    readBlogPost: 'READ BLOG POST',
    posts: [
        {
            image: Entry1,
            title: 'Announcing SWPR Token',
            content: 'SWPR Token and Liquidity Mining',
            postLink: 'https://medium.com/swapr/announcing-swpr-token-e8ab12dbad45'
        },
        {
            image: Entry2,
            title: 'Introducing SWPR Token Farming Rewards',
            content: 'Introducing SWPR Token Farming RewardsRecently, the DXdao community identified a misconfiguration with ...',
            postLink: 'https://medium.com/swapr/introducing-swpr-token-farming-rewards-7fbdcc9507ae'
        },
        {
            image: Entry3,
            title: 'DXdao and BadgerDAO Leverage Swapr to Bring Smarter BTC-focused Strategies to Arbitrum',
            content: 'Both DXdao and BadgerDAO have strong communities that have been building interesting products in the DeFi space.',
            postLink: 'https://medium.com/swapr/dxdao-and-badgerdao-leverage-swapr-to-bring-smarter-btc-focused-strategies-to-arbitrum-23689e0c9f2b'
        }
    ]
}

export const FooterContent = {
    linkColumns: [
        {
            title: 'About',
            footerLinks: [
                {
                    label: 'FAQ',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/faq/'
                },
                {
                    label: 'Blog',
                    href: 'https://medium.com/swapr'
                },
                {
                    label: 'Audits',
                    href: 'https://dxdocs.eth.link/docs/Technical%20Documentation/Audits/#swapr'
                },
                {
                    label: 'Brand Assets',
                    href: 'https://dxdocs.eth.link/docs/BrandingAssets/#swapr-brand-assets'
                },
            ]
        },
        {
            title: 'Community',
            footerLinks: [
                {
                    label: 'Discord',
                    href: 'https://discord.gg/4QXEJQkvHH'
                },
                {
                    label: 'Twitter',
                    href: 'https://twitter.com/SwaprEth'
                },
                {
                    label: 'Keybase',
                    href: 'https://keybase.io/team/dx_dao'
                },
                {
                    label: 'Forum',
                    href: 'https://daotalk.org/c/dx-dao/15'
                },
            ]
        },
        {
            title: 'Documentation',
            footerLinks: [
                {
                    label: 'DIY Campaigns',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/DIY%20Liquidity%20Mining/'
                },
                {
                    label: 'Roadmap',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/roadmap/'
                },
                {
                    label: 'We\'re hiring',
                    href: 'https://dxdocs.eth.link/docs/ContributorHub/open-positions-and-bounties/'
                },
                {
                    label: 'SWPR Token',
                    href: 'https://dxdocs.eth.link/docs/Products/swapr/tokenomics/'
                },
            ]
        },
        {
            title: 'Analytics',
            footerLinks: [
                {
                    label: 'DXstats',
                    href: 'https://dxstats.eth.link/#/home'
                },
                // {
                //     label: 'Roadmap',
                //     href: '#'
                // },
                // {
                //     label: 'We\'re hiring',
                //     href: '#'
                // },
                // {
                //     label: 'Token',
                //     href: '#'
                // },
            ]
        },
    ],
    footerCta: {
        label: 'GO TO SWAPR',
        href: '#'
    }
}

export const StatsContent = {
    title: 'Swapr Stats',
    stats: [
        {
            title: 'TOTAL VOLUME',
            value: <TextyAnim type="flash">$145,000,000+</TextyAnim>,
            externalSource: true,
        },
        {
            title: 'TRADES',
            value: <>
                <TextyAnim type="flash">570,000+</TextyAnim>
                </>,
            externalSource: true,
        },
        {
            title: 'TOTAL FEES COLLECTED',
            value: <>
                <TextyAnim type="flash">$34,000+</TextyAnim><TextyAnim type="flash" className="dim"></TextyAnim>
                </>,
        },
        {
            title: 'SWPR PRICE',
            value: <>
                <TextyAnim type="flash">$49</TextyAnim><TextyAnim type="flash" className="dim">0</TextyAnim><TextyAnim type="flash" className="hiddable-mobile">00</TextyAnim>
            </>,
            externalSource: true,
            headingDollar: true
        },
        {
            title: 'TVL',
            value: <TextyAnim>10,149,321</TextyAnim>,
            externalSource: true
        },
        {
            title: 'ROUTING THROUGH',
            companies: [
                {
                    name: 'UniSwap',
                    image: UniSwapStats,
                    href: '#'
                },
                {
                    name: 'SushiSwap',
                    image: SushiSwapStats,
                    href: '#'
                },
                {
                    name: 'BaoSwap',
                    image: BaoSwapStats,
                    href: '#'
                },
                {
                    name: 'HoneySwap',
                    image: HoneySwapStats,
                    href: '#'
                },
            ],
            moreLabel: '+ 3 more'
        }
    ]
}

// About

export const AboutHeroContent = {
    mainText: 'Features Statement',
    heroParagraph: 'This is a page dedicated to Swapr features, each with an individual highlight and informer. Lorem ipsum dolor sit amet.',
    heroButtons: [
        {
            label: 'FOR THE COMMUNITY',
            type: 'primary',
            href: '#'
        },
        {
            label: 'FOR CREATORS',
            type: 'dark',
            href: '#'
        }
    ]
}

export const AboutCardsContent = [
    {
        title: 'LP GOVERNANCE',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed nibh at odio egestas efficitur. Vivamus tempus finibus elit sed commodo. Praesent tempus felis dui.',
        buttonLabel: 'LEARN MORE',
        image: AboutGovernance
    },
    {
        title: 'DIY FARMING',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed nibh at odio egestas efficitur. Vivamus tempus finibus elit sed commodo. Praesent tempus felis dui.',
        buttonLabel: 'LEARN MORE',
        image: AboutFarming
    },
    {
        title: 'ECO-ROUTING',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed nibh at odio egestas efficitur. Vivamus tempus finibus elit sed commodo. Praesent tempus felis dui.',
        buttonLabel: 'LEARN MORE',
        image: AboutEcoRouting
    },
    {
        title: 'BRIDGING',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sed nibh at odio egestas efficitur. Vivamus tempus finibus elit sed commodo. Praesent tempus felis dui.',
        buttonLabel: 'LEARN MORE',
        image: AboutBridging
    },
]