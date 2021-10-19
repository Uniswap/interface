import React, { useEffect, useState, useCallback } from 'react'
import ReactPlayer from 'react-player/lazy'

import { Box, Flex, Image, Text } from 'rebass'
import { Link } from 'react-router-dom'
import { Trans } from '@lingui/macro'
import aboutGraph from 'assets/svg/about_graph.svg'
import aboutGraphDark from 'assets/svg/about_graph_dark.svg'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { ExternalLink } from 'theme'
import { useGlobalData } from 'state/about/hooks'
import { useActiveWeb3React } from 'hooks'
import { ChainId, ETHER, Fraction, JSBI } from '@dynamic-amm/sdk'
import { DMM_ANALYTICS_URL, KNC, KYBER_NETWORK_DISCORD_URL, KYBER_NETWORK_TWITTER_URL } from 'constants/index'
import AccessLiquidity from '../../assets/svg/access-liquidity.svg'
import Straightforward from '../../assets/svg/straightforward.svg'
import NoRisk from '../../assets/svg/no-risk.svg'
import { formatBigLiquidity } from 'utils/formatBalance'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import githubImg from 'assets/svg/about_icon_github.png'
import githubImgLight from 'assets/svg/about_icon_github_light.png'

import { Farm } from 'state/farms/types'
import { useFarmsData } from 'state/farms/hooks'
import { getTradingFeeAPR, useFarmApr, useFarmRewardPerBlocks } from 'utils/dmm'
import useTokenBalance from 'hooks/useTokenBalance'
import { isAddressString } from 'utils'
import { ethers } from 'ethers'
import { useBlockNumber } from 'state/application/hooks'
import {
  Wrapper,
  SectionNumberContainer,
  TradingVolumeSection,
  SectionNumber,
  LiquidityNumber,
  AmpLiquidityNumber,
  Panel0,
  SectionCurveDetail,
  SectionAmp,
  SectionFee,
  SectionGraph,
  YoutubeVideo,
  Panel,
  Security,
  Powered,
  Footer,
  Image3,
  Image2,
  Image1,
  FooterLinkWrapper,
  SocialLinkWrapper,
  TradeButton,
  SectionAmpContent
} from './styleds'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { useMedia } from 'react-use'

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
  const theme = useTheme()
  const above576 = useMedia('(min-width: 576px)')
  const isDarkMode = useIsDarkMode()

  const poolsMenuLink = getPoolsMenuLink(chainId)
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]

  const { data: farms } = useFarmsData()

  const [maxApr, setMaxApr] = useState<{ [key: string]: number }>({
    [chainId as ChainId]: -1
  })
  const [indexx, setIndexx] = useState<number>(0)

  useEffect(() => {
    setIndexx(0)
  }, [farms])

  const handleAprUpdate = useCallback(
    (value: number) => {
      const max = maxApr[chainId as ChainId] || -1
      if (value > max) {
        setMaxApr(prev => ({
          ...prev,
          [chainId as ChainId]: value
        }))
      }
      setIndexx(prev => prev + 1)
    },
    [maxApr, chainId]
  )

  return (
    <Wrapper>
      <Image1 />
      <Image2 />
      <Image3 />
      <Text fontSize={[24, 58]} mt={[35, 150]}>
        <Text fontWeight={300} color={theme.text}>
          <Trans>DeFi's First Multi-Chain</Trans>
        </Text>
        <Text fontWeight={700}>
          <Text color={'#1183b7'} display={'inline-block'}>
            <Trans>Dynamic</Trans>&nbsp;
          </Text>
          <Text color={'#08a1e7'} display={'inline-block'}>
            <Trans>Market</Trans>&nbsp;
          </Text>
          <Text color={theme.lightBlue} display={'inline-block'}>
            <Trans>Maker</Trans>&nbsp;
          </Text>
          <Text color={theme.text} display={'inline-block'} fontWeight={300}>
            <Trans>Protocol</Trans>&nbsp;
          </Text>
        </Text>
      </Text>
      <Text px={4} mt={10} fontSize={[16, 21]} color={theme.subText}>
        <Trans>
          Providing frictionless crypto liquidity with greater flexibility and extremely high capital efficiency
        </Trans>
      </Text>

      <SectionNumberContainer>
        <TradingVolumeSection>
          <div>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color={theme.text}>
              {globalData ? formatBigLiquidity(globalData.totalVolumeUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2} color={theme.subText} minWidth="max-content">
              <Trans>Total Trading Volume</Trans>
            </Text>
          </div>
        </TradingVolumeSection>

        <SectionNumber>
          <LiquidityNumber>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color={theme.text} mt={[0, 0]}>
              {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2} minWidth="max-content">
              <Trans>Total Value Locked</Trans>
            </Text>
          </LiquidityNumber>
          <div className="line"></div>
          <AmpLiquidityNumber>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color={theme.text} mt={[0, 0]}>
              {globalData ? formatBigLiquidity(globalData.totalAmplifiedLiquidityUSD, 2, true) : <Loader />}
            </Text>
            <Text fontSize={14} mt={2} color={theme.subText} minWidth="max-content">
              <Trans>Total AMP Liquidity</Trans>*
            </Text>
          </AmpLiquidityNumber>
          <Text
            fontSize={10}
            fontStyle="italic"
            sx={{
              position: 'absolute',
              bottom: '-18px',
              right: '0px'
            }}
          >
            *<Trans>Equivalent TVL when compared to typical AMMs</Trans>
          </Text>
        </SectionNumber>

        {maxApr[chainId as ChainId] >= 0 && (
          <TradingVolumeSection>
            <Text fontSize={[24, 28]} fontWeight={[600, 700]} color={theme.text}>
              {maxApr[chainId as ChainId].toFixed(2)}%
            </Text>
            <Text fontSize={14} color={theme.subText} mt={2} minWidth="max-content">
              <Trans>Max APY</Trans>
            </Text>
          </TradingVolumeSection>
        )}
      </SectionNumberContainer>

      <Panel0>
        <TradeButton padding="12px 0px" as={Link} to={'/swap'}>
          <Trans>Trade Now</Trans>
        </TradeButton>
        <Flex sx={{ gap: '1rem' }}>
          <ButtonOutlined padding="12px 0px" as={Link} to={poolsMenuLink} style={{ fontSize: '16px' }}>
            <Trans>Add Liquidity</Trans>
          </ButtonOutlined>
          <ButtonOutlined
            padding="12px 0px"
            as={ExternalLink}
            href={`https://docs.dmm.exchange`}
            target="_blank"
            style={{ fontSize: '16px' }}
          >
            <Trans>Documentation</Trans>
          </ButtonOutlined>
        </Flex>
      </Panel0>

      <Text mt={[70, 100]} color={theme.text} fontSize={[24, 40]}>
        <span>
          <Trans>Amplified Liquidity Pools</Trans>
        </span>
      </Text>
      <SectionCurveDetail>
        <i>
          <Text mb={15} color={theme.subText}>
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
      </SectionCurveDetail>
      <Text fontSize={[16, 24]} fontWeight={600} px={2} color={theme.text}>
        <Trans>DMM can be up to 100x more capital efficient than typical AMMs</Trans>
      </Text>
      <SectionAmp>
        <SectionAmpContent bgColor="#105d81">
          <Text fontSize="18px">
            <Trans>Typical AMM</Trans>
          </Text>
          <div className="left">
            <Text fontSize="42px" fontWeight={600}>
              ~11%
            </Text>
            <Text fontSize="14px">
              <Trans>Slippage</Trans>
            </Text>
          </div>
        </SectionAmpContent>

        <SectionAmpContent bgColor="#1183b7">
          <div>
            <Text fontSize="18px">
              <Trans>DMM</Trans>
            </Text>
            <Text fontSize="12px" mt="4px">
              <Trans>Capital Amp Factor = 5</Trans>
            </Text>
          </div>

          <div className="left">
            <Text fontSize="42px" fontWeight={600}>
              ~2%
            </Text>
            <Text fontSize="14px">
              <Trans>Slippage</Trans>
            </Text>
          </div>
        </SectionAmpContent>

        <SectionAmpContent bgColor="#08a1e7">
          <div>
            <Text fontSize="18px">
              <Trans>DMM</Trans>
            </Text>
            <Text fontSize="12px" mt="4px">
              <Trans>Capital Amp Factor = 10</Trans>
            </Text>
          </div>

          <div className="left">
            <Text fontSize="42px" fontWeight={600}>
              ~0.1%
            </Text>
            <Text fontSize="14px">
              <Trans>Slippage</Trans>
            </Text>
          </div>
        </SectionAmpContent>
      </SectionAmp>
      <i>
        <Text fontSize={[12, 14]} px={2}>
          <Trans>*Slippage Incurred: Assuming liquidity of $1M for each token and a $100K trade</Trans>
        </Text>
      </i>

      <Text fontSize={[24, 36]} fontWeight={500} mt={100} mb={56} color={theme.text} style={{ position: 'relative' }}>
        <span>
          <Trans>Dynamic Fees</Trans>
        </span>
      </Text>

      <SectionFee>
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
      </SectionFee>

      <SectionGraph>
        <div
          className="left"
          style={{
            backgroundImage: isDarkMode ? `url(${aboutGraphDark})` : `url(${aboutGraph})`
          }}
        />
        <div className="right">
          <div className="item" style={{ borderLeft: above576 ? undefined : `1px dashed ${theme.border4}99` }}>
            <div className="box box_1"></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Reduce the impact of IL</Trans>
            </Text>
          </div>
          <div className="item">
            <div className="box box_2"></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Increase LP Profit</Trans>
            </Text>
          </div>
          <div className="item" style={{ borderBottom: `dashed 1px ${theme.border4}99` }}>
            <div className="box box_3"></div>
            <Text fontSize={[12, 14]} mt={[10, 25]}>
              <Trans>Encourage trading</Trans>
            </Text>
          </div>
        </div>
      </SectionGraph>

      <Text fontSize={[24, 36]} color={theme.text} mt={[50, 135]} px={2}>
        <span>
          <Trans>Permissionless and Frictionless Liquidity for DeFi</Trans>
        </span>
      </Text>
      <div style={{ padding: '0 24px' }}>
        <Box width={['100%', 780]} mx="auto">
          <img src={require('../../assets/svg/permissionless_frictionless.svg')} alt="" />
          <Text mt={[16, 20]} lineHeight="26px">
            <Trans>
              Anyone can provide liquidity by depositing token inventory into various pools and any taker (e.g. Dapps,
              aggregators, end users) can source liquidity from the DMM.
            </Trans>
          </Text>
        </Box>
      </div>

      <ButtonPrimary
        width="248px"
        padding="12px 18px"
        as={Link}
        to={poolsMenuLink}
        style={{ margin: '60px auto 100px auto', fontSize: '16px' }}
      >
        <Trans>Explore pools</Trans>
      </ButtonPrimary>

      <YoutubeVideo>
        <ReactPlayer url="https://www.youtube.com/watch?v=2xgboyu7rss" />
      </YoutubeVideo>

      <Text fontSize={[24, 36]} color={theme.text} mt={[100, 200]} mb={45} maxWidth={'700px'} mx="auto">
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
      <Panel>
        <ButtonOutlined
          padding="12px"
          as={ExternalLink}
          href={DMM_ANALYTICS_URL[chainId as ChainId]}
          style={{ width: '200px', fontSize: '16px' }}
        >
          <Trans>Analytics</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px"
          as={ExternalLink}
          href={`https://github.com/dynamic-amm`}
          style={{ width: '200px', fontSize: '16px' }}
        >
          <Trans>Github</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px"
          as={ExternalLink}
          href={`https://files.kyber.network/DMM-Feb21.pdf`}
          style={{ width: '200px', fontSize: '16px' }}
        >
          <Trans>Litepaper</Trans>
        </ButtonOutlined>
        <ButtonOutlined
          padding="12px"
          as={ExternalLink}
          href={KYBER_NETWORK_DISCORD_URL}
          style={{ width: '200px', fontSize: '16px' }}
        >
          <Trans>Developer Support</Trans>
        </ButtonOutlined>
      </Panel>

      <Text fontSize={[24, 36]} color={theme.text} mt={[100, 200]} mb={45} px={2}>
        <Trans>Committed to Security</Trans>
      </Text>
      <Security>
        <div>
          <Text fontSize={[12, 18]} fontWeight={500}>
            <Trans>Code Audited</Trans>
          </Text>
          <ExternalLink href="https://chainsecurity.com/wp-content/uploads/2021/04/ChainSecurity_KyberNetwork_DMM_Dynamic-Market-Making_Final.pdf">
            <img
              src={
                !isDarkMode
                  ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                  : require('../../assets/svg/chainsecurity.svg')
              }
              alt=""
            />
          </ExternalLink>
        </div>
        <div>
          <Text fontSize={18} fontWeight={500}>
            <Trans>On-chain and Open Source</Trans>
          </Text>
          <img src={isDarkMode ? githubImg : githubImgLight} alt="" height="44px" />
        </div>
        <div>
          <Text fontSize={18} fontWeight={500}>
            <Trans>Bug Bounty</Trans>
          </Text>
          <img src={require('../../assets/svg/about_icon_bug_bounty.svg')} alt="" height="48px" />
        </div>
        <div>
          <Text fontSize={18} fontWeight={500}>
            <Trans>Insured by</Trans>
          </Text>
          <img
            src={
              !isDarkMode ? require('../../assets/svg/unslashed_light.svg') : require('../../assets/svg/unslashed.svg')
            }
            alt=""
            height="34px"
            style={{ marginTop: '36px' }}
          />
        </div>
      </Security>

      <Text fontSize={18} fontWeight={500} mt={5}>
        <Trans>Powered by</Trans>
      </Text>
      <Powered>
        <img
          src={
            isDarkMode
              ? require('../../assets/svg/about_icon_kyber.svg')
              : require('../../assets/svg/about_icon_kyber_light.svg')
          }
          alt=""
        />
        <img src={require('../../assets/svg/about_icon_ethereum.png')} alt="" />
        <img
          src={
            isDarkMode
              ? require('../../assets/svg/about_icon_polygon.png')
              : require('../../assets/svg/about_icon_polygon_light.svg')
          }
          alt=""
        />
        <img src={require('../../assets/svg/about_icon_avalanche.png')} alt="" />
        <img src={require('../../assets/svg/about_icon_bsc.png')} alt="" />
      </Powered>
      <Footer>
        <FooterLinkWrapper>
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
        </FooterLinkWrapper>
        <SocialLinkWrapper>
          <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
            <Image src={require('../../assets/svg/about_icon_twitter.svg')} size="24px" />
          </ExternalLink>
          <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
            <Image src={require('../../assets/svg/about_icon_discord.svg')} size="24px" />
          </ExternalLink>
          <ExternalLink href={`https://blog.kyber.network`}>
            <Image src={require('../../assets/svg/about_icon_medium.svg')} size="24px" />
          </ExternalLink>
        </SocialLinkWrapper>
        <Text fontSize={12} ml={['auto', 0]} marginTop="0.75rem">
          (c) dmm.exchange
        </Text>

        {Object.values(farms)
          .flat()
          .map((farm, index) => index === indexx && <Apr key={farm.id} farm={farm} onAprUpdate={handleAprUpdate} />)}
      </Footer>
    </Wrapper>
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
    if (farmAPR > 0) onAprUpdate(apr)
  }, [apr, onAprUpdate, farmAPR])
  return <></>
}
