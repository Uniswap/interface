import React, { useEffect, useState, useCallback } from 'react'
import ReactPlayer from 'react-player/lazy'
import style from './about.module.scss'

import { Box, Flex, Image, Text } from 'rebass'
import { Link } from 'react-router-dom'
import { Trans } from '@lingui/macro'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { ExternalLink } from 'theme'
import { useGlobalData } from 'state/about/hooks'
import { useActiveWeb3React } from 'hooks'
import { ChainId, ETHER, Fraction, JSBI } from 'libs/sdk/src'
import { DMM_ANALYTICS_URL, KNC } from '../../constants'
import AccessLiquidity from '../../assets/svg/access-liquidity.svg'
import Straightforward from '../../assets/svg/straightforward.svg'
import NoRisk from '../../assets/svg/no-risk.svg'
import { formatBigLiquidity } from 'utils/formatBalance'
import { convertToNativeTokenFromETH } from 'utils/dmm'

import { Farm } from 'state/farms/types'
import { useFarmsData } from 'state/farms/hooks'
import { getTradingFeeAPR, useFarmApr, useFarmRewardPerBlocks } from 'utils/dmm'
import useTokenBalance from 'hooks/useTokenBalance'
import { isAddressString } from 'utils'
import { ethers } from 'ethers'
import { useBlockNumber } from 'state/application/hooks'

const getPoolsMenuLink = (chainId?: ChainId) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.ROPSTEN:
      return `/pools/${convertToNativeTokenFromETH(ETHER, chainId).symbol}/${KNC[chainId as ChainId].address}`
    case ChainId.MATIC:
      return `/pools/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/${KNC[chainId as ChainId].address}`
    case ChainId.MUMBAI:
      return `/pools/0x19395624C030A11f58e820C3AeFb1f5960d9742a/${KNC[chainId as ChainId].address}`
    case ChainId.BSCTESTNET:
      return `/pools/BNB`
    case ChainId.BSCMAINNET:
      return `/pools/BNB`
    case ChainId.AVAXTESTNET:
      return `/pools/AVAX`
    case ChainId.AVAXMAINNET:
      return `/pools/AVAX`
    default:
      return '/pools/ETH'
  }
}

export default function About() {
  const { chainId } = useActiveWeb3React()

  const poolsMenuLink = getPoolsMenuLink(chainId)
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]

  const { data: farms } = useFarmsData()
  const [maxApr, setMaxApr] = useState<number>(-1)
  const [indexx, setIndexx] = useState<number>(0)

  const handleAprUpdate = useCallback(
    (value: any) => {
      if (!!maxApr && value > maxApr) {
        setMaxApr(value)
        setIndexx(indexx + 1)
      }
    },
    [maxApr, indexx]
  )

  return (
    <div className={style.wrapper}>
      <div className={style.image1}></div>
      <div className={style.image2}></div>
      <div className={style.image3} style={{ bottom: `0` }}></div>
      <Text fontSize={[24, 58]} mt={[35, 150]}>
        <Text fontWeight={300} color={'#ffffff'}>
          <Trans>DeFi's First Multi-Chain</Trans>
        </Text>
        <Text fontWeight={700}>
          <Text color={'#1183b7'} display={'inline-block'}>
            <Trans>Dynamic</Trans>&nbsp;
          </Text>
          <Text color={'#08a1e7'} display={'inline-block'}>
            <Trans>Market</Trans>&nbsp;
          </Text>
          <Text color={'#78d5ff'} display={'inline-block'}>
            <Trans>Maker</Trans>&nbsp;
          </Text>
          <Text color={'#ffffff'} display={'inline-block'} fontWeight={300}>
            <Trans>Protocol</Trans>&nbsp;
          </Text>
        </Text>
      </Text>
      <Text px={4} mt={10} fontSize={[16, 21]} color={'#ffffff'}>
        <Trans>
          Providing frictionless crypto liquidity with greater flexibility and extremely high capital efficiency
        </Trans>
      </Text>

      <div className={style.section_number_container}>
        <div className={`${style.section_number} ${style.trading_volume_section}`}>
          <div>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color="#FFFFFF">
              {globalData ? formatBigLiquidity(globalData.totalVolumeUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2}>
              <Trans>Total Trading Volume</Trans>
            </Text>
          </div>
        </div>

        <div className={style.section_number}>
          <div className={style.liquidity_number}>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color="#FFFFFF" mt={[0, 0]}>
              {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2}>
              <Trans>Total Value Locked</Trans>
            </Text>
          </div>
          <div className={style.line}></div>
          <div className={style.amp_liquidity_number}>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color="#FFFFFF" mt={[0, 0]}>
              {globalData ? formatBigLiquidity(globalData.totalAmplifiedLiquidityUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2}>
              <Trans>Total AMP Liquidity</Trans>
            </Text>
            <Text fontSize={10} fontStyle="italic" mt={2}>
              <Trans>Equivalent TVL when compared to typical AMMs</Trans>
            </Text>
          </div>
        </div>

        <div className={`${style.section_number} ${style.trading_volume_section}`}>
          <div>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color="#FFFFFF">
              {maxApr < 0 ? <Loader /> : `${maxApr.toFixed(2)}%`}
            </Text>
            <Text fontSize={14} mt={2}>
              <Trans>Max APY</Trans>
            </Text>
            <Text fontSize={14}>&nbsp;</Text>
          </div>
        </div>
      </div>

      <div className={style.panel0}>
        <ButtonPrimary padding="12px 10px" as={Link} to={poolsMenuLink}>
          <Trans>Add Liquidity</Trans>
        </ButtonPrimary>
        <ButtonOutlined
          padding="12px 10px"
          as={ExternalLink}
          href={`https://docs.dmm.exchange`}
          target="_blank"
          style={{ fontSize: '16px' }}
        >
          <Trans>Documentation</Trans>
        </ButtonOutlined>
      </div>
      <Text mt={[70, 100]} color={'#f4f4f4'} fontSize={[24, 40]}>
        <span>
          <Trans>Amplified Liquidity Pools</Trans>
        </span>
      </Text>
      <div className={style.section_curve_details}>
        <i>
          <Text mb={15}>
            <Trans>Less tokens required for high liquidity</Trans>
          </Text>
        </i>
        <div>
          <Trans>
            KyberDMM’s Programmable Pricing Curve enables liquidity pool creators to set a suitable pricing curve and
            create amplified pools in advance, achieving
          </Trans>
          &nbsp;
          <b>
            <Trans>much higher capital efficiency</Trans>
          </b>{' '}
          <Trans>for providers and</Trans>{' '}
          <b>
            <Trans>better slippage</Trans>
          </b>{' '}
          <Trans>for users compared to AMMs.</Trans>
        </div>
      </div>
      <Text fontSize={[16, 24]} fontWeight={600} px={2}>
        <Trans>DMM can be up to 100x more capital efficient than typical AMMs</Trans>
      </Text>
      <div className={style.section_amp}>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>
            <Trans>Typical AMM</Trans>
          </div>
          <div>&nbsp;</div>
          <div>~11%</div>
          <div>
            <Trans>Slippage</Trans>
          </div>
        </div>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>DMM</div>
          <div>
            <Trans>Capital Amp Factor = 5</Trans>
          </div>
          <div>~2%</div>
          <div>
            <Trans>Slippage</Trans>
          </div>
        </div>
        <div className={[style.box, style.box_1].join(' ')}>
          <div>DMM</div>
          <div>
            <Trans>Capital Amp Factor = 10</Trans>
          </div>
          <div>~0.1%</div>
          <div>
            <Trans>Slippage</Trans>
          </div>
        </div>
      </div>
      <i>
        <Text fontSize={[12, 14]} px={2} color="#859aa5">
          <Trans>*Slippage Incurred: Assuming liquidity of $1M for each token and a $100K trade</Trans>
        </Text>
      </i>

      <Text fontSize={[24, 36]} fontWeight={500} mt={100} mb={56} color={'#f4f4f4'} style={{ position: 'relative' }}>
        <span>
          <Trans>Dynamic Fees</Trans>
        </span>
      </Text>

      <div className={style.section_fee}>
        <i>
          <Text mb={15}>
            <Trans>Higher earnings potential for liquidity providers, reducing the impact of IL</Trans>
          </Text>
        </i>
        <div>
          <Trans>
            KyberDMM trading fees are <b>adjusted dynamically</b> according to on-chain market conditions. In a volatile
            market (higher than usual volume), fees automatically increase to an optimal level, reducing the impact of
            impermanent loss. In periods of low volatility, fees decrease to encourage more trading.
          </Trans>
        </div>
      </div>

      <div className={style.section_graph}>
        <div className={style.left}></div>
        <div className={style.right}>
          <div className={style.item}>
            <div className={[style.box, style.box_1].join(' ')}></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Reduce the impact of IL</Trans>
            </Text>
          </div>
          <div className={style.item}>
            <div className={[style.box, style.box_2].join(' ')}></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Increase LP Profit</Trans>
            </Text>
          </div>
          <div className={style.item}>
            <div className={[style.box, style.box_3].join(' ')}></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Encourage trading</Trans>
            </Text>
          </div>
        </div>
      </div>

      <Text fontSize={[24, 36]} color={'#f4f4f4'} mt={[50, 135]} px={2}>
        <span>
          <Trans>Permissionless and Frictionless Liquidity for DeFi</Trans>
        </span>
      </Text>
      <div style={{ padding: '0 24px' }}>
        <Box width={['100%', 780]} mx="auto">
          <img src={require('../../assets/svg/permissionless_frictionless.svg')} alt="" />
          <Text mt={[16, 20]} color="#c9d2d7" lineHeight="26px">
            <Trans>
              Anyone can provide liquidity by depositing token inventory into various pools and any taker (e.g. Dapps,
              aggregators, end users) can source liquidity from the DMM.
            </Trans>
          </Text>
        </Box>
      </div>

      <ButtonOutlined
        width="248px"
        padding="12px 18px"
        as={Link}
        to={poolsMenuLink}
        style={{ margin: '60px auto 100px auto', fontSize: '16px' }}
      >
        <Trans>Explore pools</Trans>
      </ButtonOutlined>

      <div className={style.youtube_video}>
        <ReactPlayer url="https://www.youtube.com/watch?v=2xgboyu7rss" />
      </div>

      <Text fontSize={[24, 36]} color={'#f4f4f4'} mt={[100, 200]} mb={45} maxWidth={'700px'} mx="auto">
        <Trans>Access DMM Liquidity for your Blockchain Platform</Trans>
      </Text>
      <Text fontSize={[16, 20]} maxWidth="700px" mx="auto">
        <Flex justifyContent="space-between">
          <div>
            <img src={AccessLiquidity} alt="icon" />
            <Text fontSize={[14, 18]} mt={[34]} mb={45} textAlign="center">
              <Trans>
                Open Access to <br /> Liquidity
              </Trans>
            </Text>
          </div>
          <div>
            <img src={Straightforward} alt="icon" />
            <Text fontSize={[14, 18]} mt={[34]} mb={45} textAlign="center">
              <Trans>
                Fully On-chain; <br /> Straightforward Integration
              </Trans>
            </Text>
          </div>
          <div>
            <img src={NoRisk} alt="icon" />
            <Text fontSize={[14, 18]} mt={[34]} mb={45} textAlign="center">
              <Trans>
                No external and <br /> centralized oracle risk
              </Trans>
            </Text>
          </div>
        </Flex>
        <Trans>
          All the documentation and tools necessary for developers to connect their Dapps to frictionless liquidity to
          perform DeFi functions such token swaps, flash loans, on-chain liquidation, and portfolio rebalancing.
        </Trans>
      </Text>
      <div className={style.panel}>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={DMM_ANALYTICS_URL[chainId as ChainId]}
          style={{ width: 'auto', fontSize: '16px' }}
        >
          <Trans>Analytics</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://github.com/dynamic-amm`}
          style={{ width: 'auto', fontSize: '16px' }}
        >
          <Trans>Github</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://files.kyber.network/DMM-Feb21.pdf`}
          style={{ width: 'auto', fontSize: '16px' }}
        >
          <Trans>Litepaper</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px 28px"
          as={ExternalLink}
          href={`https://discord.com/invite/HdXWUb2pQM`}
          style={{ width: 'auto', fontSize: '16px' }}
        >
          <Trans>Developer Support</Trans>
        </ButtonOutlined>
      </div>

      <Text fontSize={[24, 36]} color={'#f4f4f4'} mt={[100, 200]} mb={45} px={2}>
        <Trans>Committed to Security</Trans>
      </Text>
      <div className={style.security}>
        <div>
          <Text fontSize={[12, 18]} fontWeight={500}>
            <Trans>Code Audited</Trans>
          </Text>
          <ExternalLink href="https://chainsecurity.com/wp-content/uploads/2021/04/ChainSecurity_KyberNetwork_DMM_Dynamic-Market-Making_Final.pdf">
            <img src={require('../../assets/svg/chainsecurity.svg')} alt="" />
          </ExternalLink>
        </div>
        <div>
          <Text fontSize={[12, 18]} fontWeight={500}>
            <Trans>On-chain and Open Source</Trans>
          </Text>
          <img src={require('../../assets/svg/about_icon_github.jpg')} alt="" />
        </div>
        <div>
          <Text fontSize={[12, 18]} fontWeight={500}>
            <Trans>Bug Bounty</Trans>
          </Text>
          <img src={require('../../assets/svg/about_icon_bug_bounty.svg')} alt="" />
        </div>
        <div>
          <Text fontSize={[12, 18]} fontWeight={500}>
            <Trans>Insured by</Trans>
          </Text>
          <img src={require('../../assets/svg/unslashed.svg')} alt="" />
        </div>
      </div>

      <Text fontSize={[12, 18]} fontWeight={500} mt={5}>
        <Trans>Powered by</Trans>
      </Text>
      <div className={style.powered}>
        <img src={require('../../assets/svg/about_icon_kyber.svg')} alt="" />
        <img src={require('../../assets/svg/about_icon_ethereum.png')} alt="" />
        <img src={require('../../assets/svg/about_icon_polygon.png')} alt="" />
        <img src={require('../../assets/svg/about_icon_avalanche.png')} alt="" />
        <img src={require('../../assets/svg/about_icon_bsc.png')} alt="" />
      </div>
      <div className={style.footer}>
        <div className={style.content}>
          <div className={style.left}>
            <Text>
              <ExternalLink href={`https://docs.dmm.exchange`}>
                <Trans>DevPortal</Trans>
              </ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://github.com/dynamic-amm`}>
                <Trans>Github</Trans>
              </ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://kyber.org`}>KyberDAO</ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://gov.kyber.org`}>
                <Trans>Forum</Trans>
              </ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://files.kyber.network/DMM-Feb21.pdf`}>
                <Trans>DMM Litepaper</Trans>
              </ExternalLink>
            </Text>
            {/* <Text>
              <a>FAQ</a>
            </Text> */}
            <Text>
              <ExternalLink href={`http://files.dmm.exchange/privacy.pdf`}>
                <Trans>Privacy</Trans>
              </ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`http://files.dmm.exchange/tac.pdf`}>
                <Trans>Terms</Trans>
              </ExternalLink>
            </Text>
            <Text>
              <ExternalLink href={`https://kyber.network/`}>Kyber Network</ExternalLink>
            </Text>
          </div>
          <div className={style.right}>
            <ExternalLink href={`https://twitter.com/KyberNetwork/`}>
              <Image src={require('../../assets/svg/about_icon_twitter.svg')} />
            </ExternalLink>
            <ExternalLink href={`https://discord.gg/HdXWUb2pQM`}>
              <Image src={require('../../assets/svg/about_icon_discord.svg')} />
            </ExternalLink>
            <ExternalLink href={`https://blog.kyber.network`}>
              <Image src={require('../../assets/svg/about_icon_medium.svg')} />
            </ExternalLink>
            <Text fontSize={12} ml={['auto', 0]}>
              (c) dmm.exchange
            </Text>
          </div>
          {Object.values(farms)
            .flat()
            .map(
              (farm, index) =>
                index === indexx && (
                  <Apr
                    key={farm.id}
                    farm={farm}
                    onAprUpdate={handleAprUpdate}
                  />
                )
            )}
        </div>
      </div>
    </div>
  )
}

function Apr({ farm, onAprUpdate }: { farm: Farm; onAprUpdate: any }) {
  const farmRewardPerBlocks = useFarmRewardPerBlocks([farm])
  const poolAddressChecksum = isAddressString(farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const currentBlock = useBlockNumber()
  const isLiquidityMiningActive =
    currentBlock && farm.startBlock && farm.endBlock
      ? farm.startBlock <= currentBlock && currentBlock <= farm.endBlock
      : false

  const farmAPR = useFarmApr(farmRewardPerBlocks, liquidity.toString(), isLiquidityMiningActive)
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + tradingFeeAPR

  useEffect(() => {
    onAprUpdate(apr)
  }, [apr, onAprUpdate])
  return <></>
}
