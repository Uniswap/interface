import AppBody from 'pages/AppBody'
import React, { useContext, useEffect, useRef, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import style from './about.module.scss'

import { Text } from 'rebass'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'theme'
import { useActiveWeb3React } from 'hooks'

export default function About() {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  return (
    <div className={style.wrapper}>
      <style>@import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@900&display=swap');</style>
      <div className={style.image1}></div>
      <div className={style.image2}></div>
      <div className={style.image3} style={{ bottom: `0` }}></div>
      <Text fontSize={58} mt={150}>
        World's First
      </Text>
      <div>
        <Text fontSize={58} color={'#1183b7'} display={'inline-block'}>
          Dynamic&nbsp;
        </Text>
        <Text fontSize={58} color={'#08a1e7'} display={'inline-block'}>
          Market&nbsp;
        </Text>
        <Text fontSize={58} color={'#78d5ff'} display={'inline-block'}>
          Maker&nbsp;
        </Text>
        <Text fontSize={58} color={'#c9d2d7'} display={'inline-block'}>
          Protocol&nbsp;
        </Text>
      </div>

      <Text mt={10} fontSize={21} color={'#c9d2d7'}>
        Providing frictionless crypto liquidity with greater flexibility and extremely high capital efficiency
      </Text>

      <div className={style.section_number}>
        <div>
          <Text fontSize={42} fontWeight={900}>
            $265,987
          </Text>
          <Text fontSize={14}>Trading Volume</Text>
        </div>
        <div style={{ width: '0px', border: '1px solid #303e46' }}></div>
        <div>
          <Text fontSize={42} fontWeight={900}>
            $654,986
          </Text>
          <Text fontSize={14}>Total Value Locked</Text>
        </div>
      </div>

      <div className={style.panel0}>
        <ButtonPrimary padding="12px 28px" as={Link} to={`/pools/ETH`}>
          Add Liquidity
        </ButtonPrimary>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://docs.dmm.exchange`}
          target="_blank"
          style={{ fontSize: '16px' }}
        >
          Documentation
        </ButtonOutlined>
      </div>
      <Text mt={100} color={'#f4f4f4'} fontSize={40} style={{ position: 'relative' }}>
        <div
          className={[style.icon, style.icon_1].join(' ')}
          style={{ display: 'inline-block', width: '50px', height: '50px', position: 'absolute' }}
        ></div>
        <span style={{ marginLeft: '55px' }}>Programmable Pricing Curve</span>
      </Text>
      <div className={style.section_curve_details}>
        <i>
          <Text mb={15}>Less tokens required for high liquidity</Text>
        </i>
        <div>
          Kyber DMM’s Programmable Pricing Curve enables liquidity pool creators to set a suitable pricing curve and
          create amplified pools in advance, achieving&nbsp;
          <b>much higher capital efficiency</b> for providers and <b>better slippage</b> for users compared to AMMs.
        </div>
      </div>
      <Text fontSize={24} fontWeight={600}>
        DMM can be up to 100x more capital efficient than typical AMMs
      </Text>
      <div className={style.section_amp}>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>Typical AMM</div>
          <div>&nbsp;</div>
          <div>~11%</div>
          <div>Slippage</div>
        </div>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>DMM</div>
          <div>Capital Amp Factor = 5</div>
          <div>~2%</div>
          <div>Slippage</div>
        </div>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>DMM</div>
          <div>Capital Amp Factor = 10</div>
          <div>~0.1%</div>
          <div>Slippage</div>
        </div>
      </div>
      <i>
        <Text fontSize={14}>
          <b>*Slippage Incurred</b>: Assuming liquidity of $1M for each token and a $100K trade
        </Text>
      </i>

      <Text fontSize={36} fontWeight={500} mt={100} mb={56} color={'#f4f4f4'} style={{ position: 'relative' }}>
        <div
          className={[style.icon, style.icon_2].join(' ')}
          style={{ display: 'inline-block', width: '50px', height: '50px', position: 'absolute' }}
        ></div>
        <span style={{ marginLeft: '55px' }}>Dynamic Fees</span>
      </Text>

      <div className={style.section_fee}>
        <i>
          <Text mb={15}>Higher earnings potential for liquidity providers, reducing the impact of IL</Text>
        </i>
        <div>
          Kyber DMM trading fees are <b>adjusted dynamically</b> according to on-chain market conditions. In a volatile
          market (higher than usual volume), fees automatically increase to an optimal level, reducing the impact of
          impermanent loss. In periods of low volatility, fees decrease to encourage more trading.
        </div>
      </div>

      <div className={style.section_graph}>
        <div className={style.left}></div>
        <div className={style.right}>
          <div className={style.item}>
            <div className={[style.box, style.box_1].join(' ')}></div>
            <Text fontSize={14} mt={25}>
              Reduce the impact of IL
            </Text>
          </div>
          <div className={style.item}>
            <div className={[style.box, style.box_2].join(' ')}></div>
            <Text fontSize={14} mt={25}>
              Increase LP Profit
            </Text>
          </div>
          <div className={style.item}>
            <div className={[style.box, style.box_3].join(' ')}></div>
            <Text fontSize={14} mt={25}>
              Encourage trading
            </Text>
          </div>
        </div>
      </div>

      <Text fontSize={36} color={'#f4f4f4'} mt={135} style={{ position: 'relative' }}>
        <div
          className={[style.icon, style.icon_3].join(' ')}
          style={{ display: 'inline-block', width: '50px', height: '50px', position: 'absolute' }}
        ></div>
        <span style={{ marginLeft: '55px' }}>Permissionless and Frictionless Liquidity for DeFi</span>
      </Text>
      <div style={{ marginTop: '70px', position: 'relative' }}>
        <div className={style.wrapper5}>
          <div className={[style.icon, style.icon_1].join(' ')}></div>
          <Text fontSize={24} width={200} margin={'auto'}>
            Programmable Curves
          </Text>
          <Text fontSize={18} margin={'auto'} marginLeft={'20px'} width={'60%'}>
            Liquidity pool creators can easily customize their pricing curves depending on the nature of their token
            pairs to improve capital efficiency.
          </Text>
        </div>
        <div className={style.wrapper5}>
          <div className={[style.icon, style.icon_2].join(' ')}></div>
          <Text fontSize={24} width={200} margin={'auto'}>
            Dynamic Fees
          </Text>
          <Text fontSize={18} margin={'auto'} marginLeft={'20px'} width={'60%'}>
            LP fees will adjust based on market conditions (Trading Volume and Price Volatility) to reduce the impact of
            impermanent loss for LPs and maximise returns for takers.
          </Text>
        </div>
        <div className={style.wrapper5}>
          <div className={[style.icon, style.icon_3].join(' ')}></div>
          <Text fontSize={24} width={200} margin={'auto'}>
            Permissionless Liquidity Contribution
          </Text>
          <Text fontSize={18} margin={'auto'} marginLeft={'20px'} width={'60%'}>
            Anyone can provide liquidity by depositing token inventory into various pools and any taker (e.g. Dapps,
            aggregators, end users) can source liquidity from the DMM.
          </Text>
        </div>
      </div>

      <ButtonOutlined
        width="248px"
        padding="12px 18px"
        as={Link}
        to={`/pools/ETH`}
        style={{ margin: '60px auto', fontSize: '16px' }}
      >
        Explore pools
      </ButtonOutlined>

      <Text
        fontSize={36}
        color={'#f4f4f4'}
        mt={200}
        mb={45}
        width={'100%'}
        maxWidth={'700px'}
        marginLeft={'auto'}
        marginRight={'auto'}
      >
        Access DMM Liquidity for your Blockchain Platform
      </Text>
      <Text fontSize={20} style={{ width: '100%', maxWidth: '700px', margin: 'auto' }}>
        All the documentation and tools necessary for developers to connect their Dapps to frictionless liquidity to
        perform DeFi functions such token swaps, flash loans, on-chain liquidation, and portfolio rebalancing.
      </Text>
      <div className={style.panel}>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={process.env.REACT_APP_DMM_ANALYTICS_URL || `https://dev-dmm-info.knstats.com/`}
          style={{ width: 'auto', marginTop: '5px', fontSize: '16px' }}
        >
          Analytics
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://github.com/dynamic-amm`}
          style={{ width: 'auto', marginTop: '5px', fontSize: '16px' }}
        >
          Github
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://files.kyber.network/DMM-Feb21.pdf`}
          style={{ width: 'auto', marginTop: '5px', fontSize: '16px' }}
        >
          Lightpaper
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://docs.dmm.exchange`}
          style={{ width: 'auto', marginTop: '5px', fontSize: '16px' }}
        >
          Developer Support
        </ButtonOutlined>
      </div>

      <Text
        fontSize={36}
        color={'#f4f4f4'}
        mt={200}
        mb={45}
        width={'100%'}
        maxWidth={'700px'}
        marginLeft={'auto'}
        marginRight={'auto'}
      >
        Committed to Security
      </Text>
      <div className={style.security}>
        <div>
          <Text fontSize={18}>Code Audited</Text>
          <img src={require('../../assets/svg/about_icon_insurance.svg')} />
        </div>
        <div>
          <Text fontSize={18}>On-chain and Open Source</Text>
          <img src={require('../../assets/svg/about_icon_github.jpg')} />
        </div>
        <div>
          <Text fontSize={18}>Bug Bounty</Text>
          <img src={require('../../assets/svg/about_icon_bug_bounty.svg')} />
        </div>
      </div>
      <div className={style.powered}>
        <Text fontSize={18} display={'inline'}>
          Powered by{' '}
        </Text>
        <img src={require('../../assets/svg/about_icon_kyber.svg')} />
        <img src={require('../../assets/svg/about_icon_ethereum.png')} />
      </div>
      <div className={style.footer}>
        <div className={style.content}>
          <div className={style.left}>
            <Text>
              <ExternalLink href={`https://docs.dmm.exchange`}>DevPortal</ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://github.com/dynamic-amm`}>Github</ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://kyber.org`}>KyberDAO</ExternalLink>
            </Text>
            <Text>
              <a>Forum</a>
            </Text>
            <Text>
              <ExternalLink href={`https://files.kyber.network/DMM-Feb21.pdf`}>DMM Litepaper</ExternalLink>
            </Text>
            <Text>
              <a>FAQ</a>
            </Text>
            <Text>
              <ExternalLink href={`https://kyber.network/`}>Kyber Network</ExternalLink>
            </Text>
          </div>
          <div className={style.right}>
            <a>
              <img src={require('../../assets/svg/about_icon_twitter.svg')} />
            </a>
            <a>
              <img src={require('../../assets/svg/about_icon_discord.svg')} />
            </a>
            <a>
              <img src={require('../../assets/svg/about_icon_medium.svg')} />
            </a>
            <Text fontSize={12}>(c) kyber.dmm</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

{
  /* <div className={style.wrapper6}>
        <div>
          <div className={[style.box, style.box_1].join(' ')}></div>
          <div className={style.text_5}>Reduce the impact of IL</div>
          <div className={style.text_6}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. In facilisis sollicitudin ultricies. Nam viverra
            urna quis vulputate pulvinar. Curabitur aliquet id nisl et tempor.
          </div>
        </div>
        <div>
          <div className={[style.box, style.box_2].join(' ')}></div>
          <div className={style.text_5}>Increase LP Profit</div>
          <div className={style.text_6}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. In facilisis sollicitudin ultricies. Nam viverra
            urna quis vulputate pulvinar. Curabitur aliquet id nisl et tempor.
          </div>
        </div>
        <div>
          <div className={[style.box, style.box_3].join(' ')}></div>
          <div className={style.text_5}>Encourage trading</div>
          <div className={style.text_6}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. In facilisis sollicitudin ultricies. Nam viverra
            urna quis vulputate pulvinar. Curabitur aliquet id nisl et tempor.
          </div>
        </div>
      </div> */
}
