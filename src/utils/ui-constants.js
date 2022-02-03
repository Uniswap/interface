import React from 'react'
import TextyAnim from 'rc-texty'

// Hero Imports

import EthereumLogo from './../assets/images/logo-Ethereum.svg'
import ArbitrumLogo from './../assets/images/logo-Arbitrum.svg'
import xDaiLogo from './../assets/images/logo-xDai.svg'
import PolygonLogo from './../assets/images/logo-Polygon.svg'

// Hero Imports

import RoutingUniswap from './../assets/images/routing-Uniswap.svg'
import RoutingSushiSwap from './../assets/images/routing-SushiSwap.svg'
import RoutingBaoSwap from './../assets/images/routing-BaoSwap.svg'
import RoutingHoneySwap from './../assets/images/routing-HoneySwap.svg'

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

import Entry1 from './../assets/images/blog-entry-1.png'
import Entry2 from './../assets/images/blog-entry-2.png'
import Entry3 from './../assets/images/blog-entry-3.png'

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
    ]
}

export const FeaturesContent = {
    preHeader: 'Swapr Features',
    sectionTitle: 'Your DeFi Powertool',
    features: [
        {
            title: 'SWAP',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            image: Swap,
            animation: SwapAnim,
            buttons: [
                {
                    label: 'BRIDGE',
                    href: '#',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
        {
            title: 'ECO-ROUTING',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            animation: EcoRoutingAnim,
            image: EcoRouting,
            buttons: [
                {
                    label: 'SWAP',
                    href: '#',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
        {
            title: 'VOTE',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            image: Vote,
            animation: VoteAnim,
            buttons: [
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
        {
            title: 'FARMING',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            image: Farming,
            animation: FarmingAnim,
            buttons: [
                {
                    label: 'BRIDGE',
                    href: '#',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
        {
            title: 'DIY FARM',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            image: DiyFarm,
            animation: DiyFarmAnim,
            buttons: [
                {
                    label: 'BRIDGE',
                    href: '#',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
        {
            title: 'BRIDGE',
            content: 'It is a long established fact that a reader will be distracted. It is a long  established fact',
            image: Bridge,
            animation: BridgeAnim,
            buttons: [
                {
                    label: 'BRIDGE',
                    href: '#',
                    type: 'primary'
                },
                {
                    label: 'READ MORE',
                    href: '#',
                    type: 'dark'
                },
            ]
        },
    ]
}

export const CommunityBannerContent = {
    preHeader: 'A DXDao Product',
    content: 'Owned and funded by the Community',
    buttons: [
        {
            label: 'GET INVOLVED',
            href: '#',
            type: 'primary'
        },
        {
            label: 'FORUM',
            href: '#',
            type: 'dark'
        },
    ]
}

export const CommunityLinksContent = {
    preHeader: 'Tagline',
    title: <span>Join an unstoppable <br/>community</span>,
    links: [
        {
            image: Discord,
            alt: 'Discord Logo',
            title: 'Discord',
            content: 'Join in on community discussion on the Swapr Discord.',
            button: {
                label: 'JOIN DISCORD',
                href: '#',
            },
        },
        {
            image: Github,
            alt: 'GitHub Logo',
            title: 'GitHub',
            content: <>Contribute to the <br/>Swapr repositories on Github.</>,
            button: {
                label: 'VISIT GITHUB',
                href: '#',
            },
        },
        {
            image: Twitter,
            alt: 'Twitter Logo',
            title: 'Twitter',
            content: 'Get the latest Swapr announcements on the Swapr Twitter.',
            button: {
                label: 'Follow on Twitter',
                href: '#',
            },
        },
    ]
}

export const BlogContent = {
    readBlogPost: 'READ BLOG POST',
    posts: [
        {
            image: Entry1,
            title: 'Introducing Swapr Beta',
            content: 'The DXdao and Swapr community are excited to announce the launch of Swapr Beta…',
            postLink: '#'
        },
        {
            image: Entry2,
            title: 'Super Beta AMA',
            content: 'TSwapr AMA answers pressing questions preceding Swapr beta release',
            postLink: '#'
        },
        {
            image: Entry3,
            title: 'DXdao announces Swapr',
            content: 'Becoming the first DAO to launch a DeFi ProtAMA answers pressing questions preceding Swapr beta',
            postLink: '#'
        }
    ]
}

export const FooterContent = {
    linkColumns: [
        {
            title: 'About',
            footerLinks: [
                {
                    label: 'Faq',
                    href: '#'
                },
                {
                    label: 'Blog',
                    href: '#'
                },
                {
                    label: 'Audits',
                    href: '#'
                },
                {
                    label: 'Brand Assets',
                    href: '#'
                },
            ]
        },
        {
            title: 'Community',
            footerLinks: [
                {
                    label: 'Discord',
                    href: '#'
                },
                {
                    label: 'Twitter',
                    href: '#'
                },
                {
                    label: 'Keybase',
                    href: '#'
                },
                {
                    label: 'Forum',
                    href: '#'
                },
            ]
        },
        {
            title: 'Documentation',
            footerLinks: [
                {
                    label: 'DIY Liq. Mining',
                    href: '#'
                },
                {
                    label: 'Roadmap',
                    href: '#'
                },
                {
                    label: 'We\'re hiring',
                    href: '#'
                },
                {
                    label: 'Token',
                    href: '#'
                },
            ]
        },
        {
            title: 'Analytics',
            footerLinks: [
                // {
                //     label: 'DIY Liq. Mining',
                //     href: '#'
                // },
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
            value: <TextyAnim type="flash">$100,149,321</TextyAnim>,
        },
        {
            title: 'TRADES',
            value: <>
                <TextyAnim type="flash">1452</TextyAnim><TextyAnim type="flash" className="dim">0</TextyAnim><TextyAnim type="flash" className="hiddable-mobile">00</TextyAnim>
                </>,
        },
        {
            title: 'TOTAL FEES COLLECTED',
            value: <>
                <TextyAnim type="flash">14,523</TextyAnim><TextyAnim type="flash" className="dim">00</TextyAnim>
                </>,
        },
        {
            title: 'SWPR PRICE',
            value: <>
                <TextyAnim type="flash">$49</TextyAnim><TextyAnim type="flash" className="dim">0</TextyAnim><TextyAnim type="flash" className="hiddable-mobile">00</TextyAnim>
            </>,
        },
        {
            title: 'TVL',
            value: <TextyAnim>$10,149,321</TextyAnim>,
            externalSource: true,
            headingDollar: true,
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