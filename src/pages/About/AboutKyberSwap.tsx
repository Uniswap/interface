import React, { useState } from 'react'
import { Text, Flex } from 'rebass'
import { Link } from 'react-router-dom'
import useTheme from 'hooks/useTheme'
import { Trans } from '@lingui/macro'
import {
  MoneyBag,
  Ethereum,
  Polygon,
  PolygonLogoFull,
  Binance,
  Clock,
  Avalanche,
  Fantom,
  FantomLogoFull,
  Cronos,
  CronosLogoFull,
  Aurora,
  AuroraFull,
  BestPrice,
  LowestSlippage,
  Enter,
  CircleFocus,
  Arbitrum,
  Bttc,
  Velas,
  VelasLogoFull,
  Oasis,
  OasisLogoFull,
  Drop,
  FarmIcon,
} from 'components/Icons'
import { Repeat, Plus, Edit, FileText } from 'react-feather'
import Loader from 'components/Loader'
import ForTraderImage from 'assets/svg/for_trader.svg'
import ForTraderImageLight from 'assets/svg/for_trader_light.svg'
import KNCGraphic from 'assets/images/knc-graphic.png'
import KNCBlack from 'assets/svg/knc_black.svg'
import SeamlessImg from 'assets/svg/seamless.svg'
import { useMedia } from 'react-use'
import { ExternalLink, StyledInternalLink } from 'theme'
import { useDarkModeManager } from 'state/user/hooks'
import githubImg from 'assets/svg/about_icon_github.png'
import githubImgLight from 'assets/svg/about_icon_github_light.png'
import { KNC } from 'constants/index'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import { useGlobalData } from 'state/about/hooks'
import { formatBigLiquidity } from 'utils/formatBalance'
import {
  Footer,
  FooterContainer,
  Wrapper,
  Powered,
  BtnOutlined,
  BtnPrimary,
  ForLiquidityProviderItem,
  ForTrader,
  ForTraderInfo,
  ForTraderDivider,
  StatisticWrapper,
  StatisticItem,
  SupportedChain,
  AboutPage,
  ForTraderInfoShadow,
  VerticalDivider,
  CommittedToSecurityDivider,
  OverflowStatisticWrapper,
  AboutKNC,
  TypicalAMM,
  KyberSwapSlippage,
  GridWrapper,
  Tabs,
  TabItem,
} from './styleds'
import { ButtonEmpty } from 'components/Button'
import { FooterSocialLink } from 'components/Footer/Footer'
import { dexListConfig } from 'constants/dexes'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import Banner from 'components/Banner'
// import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'
// import { Pagination, FreeMode } from 'swiper'
import { nativeOnChain } from 'constants/tokens'
import AntiSnippingAttack from 'components/Icons/AntiSnippingAttack'
import { VERSION } from 'constants/v2'

const KNC_NOT_AVAILABLE_IN = [
  ChainId.CRONOS,
  ChainId.AVAXMAINNET,
  ChainId.FANTOM,
  ChainId.BTTC,
  ChainId.ARBITRUM,
  ChainId.AURORA,
  ChainId.VELAS,
  ChainId.OASIS,
]

const getPoolsMenuLink = (chainId?: ChainId, path?: string) => {
  const pathname = path || 'pools'
  if (chainId && KNC_NOT_AVAILABLE_IN.includes(chainId)) return `/${pathname}/${nativeOnChain(chainId).symbol}`
  return `/${pathname}/${nativeOnChain(chainId as ChainId).symbol || 'ETH'}/${KNC[chainId as ChainId].address}`
}

export const KSStatistic = () => {
  const theme = useTheme()
  const above992 = useMedia('(min-width: 992px)')

  return (
    <>
      <div style={{ position: 'relative', marginTop: '20px' }}>
        <ForTraderInfoShadow />
        <ForTraderInfo>
          <Flex sx={{ gap: '24px' }} height={above992 ? '100%' : 'unset'} width={above992 ? 'unset' : '100%'}>
            <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
              <Text fontWeight="600" fontSize="24px">
                $24B
              </Text>
              <Text color={theme.subText} marginTop="4px" fontSize="14px">
                <Trans>TVL From DEXs</Trans>
              </Text>
            </Flex>

            <ForTraderDivider />

            <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
              <Text fontWeight="600" fontSize="24px">
                {Object.keys(dexListConfig).length - 1}+{/* DMM and KyberSwap are one */}
              </Text>
              <Text color={theme.subText} marginTop="4px" fontSize="14px">
                <Trans>DEXs</Trans>
              </Text>
            </Flex>
          </Flex>

          <ForTraderDivider horizontal={!above992} />

          <Flex sx={{ gap: '24px' }} height={above992 ? '100%' : 'unset'} width={above992 ? 'unset' : '100%'}>
            <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
              <Text fontWeight="600" fontSize="24px">
                {SUPPORTED_NETWORKS.length}
              </Text>
              <Text color={theme.subText} marginTop="4px" fontSize="14px">
                <Trans>Chains</Trans>
              </Text>
            </Flex>
            <ForTraderDivider />
            <Flex flexDirection="column" alignItems="center" flex={!above992 ? 1 : 'unset'}>
              <Text fontWeight="600" fontSize="24px">
                20,000+
              </Text>
              <Text color={theme.subText} marginTop="4px" fontSize="14px">
                <Trans>Tokens</Trans>
              </Text>
            </Flex>
          </Flex>
        </ForTraderInfo>
      </div>
    </>
  )
}

function AboutKyberSwap() {
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { chainId } = useActiveWeb3React()
  const poolsMenuLink = getPoolsMenuLink(chainId)
  const createPoolLink = getPoolsMenuLink(chainId, 'create')
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  const { mixpanelHandler } = useMixpanel()

  const dataToShow = {
    totalTradingVolume: aggregatorData?.totalVolume,
    '24hTradingVolume': aggregatorData?.last24hVolume,
    totalValueLocked: globalData?.totalLiquidityUSD,
    totalAMPLiquidity: globalData?.totalAmplifiedLiquidityUSD,
    totalEarnings: aggregatorData?.totalEarnings || 0,
    maxAPRAvailable: aggregatorData?.maxApr,
  }

  const [activeTab, setActiveTab] = useState(VERSION.ELASTIC)

  const Compounding = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <LowestSlippage size={64} />
      <Text
        marginTop="28px"
        fontWeight="500"
        fontSize="16"
        color={theme.primary}
        textAlign={above768 ? 'start' : 'center'}
        style={{ textTransform: 'uppercase' }}
      >
        <Trans>Earn more due to compounding</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          We automatically reinvest your trading fee earnings by adding it back into the pool. And so you earn even more
          with less effort due to compounding.
        </Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/overview/overview-kyberswap-elastic">
          <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
            <Trans>Learn More</Trans>↗
          </Text>
        </ExternalLink>
      </ButtonEmpty>
    </ForLiquidityProviderItem>
  )

  const ForLPLowerSlippage = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection={above768 ? 'row' : 'column'}
      sx={{ gap: above768 ? '32px' : '48px' }}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <Flex flexDirection="column" alignItems={above768 ? 'flex-start' : 'center'} width="max-content">
        <LowestSlippage size={64} />
        <Text marginTop="28px" fontWeight="500" color={theme.primary}>
          <Trans>LOWER SLIPPAGE</Trans>
        </Text>
      </Flex>

      <Flex sx={{ gap: '24px' }} flexDirection="column" alignItems={above768 ? 'flex-start' : 'center'} flex={1}>
        <Text>
          <Trans>Amplified Liquidity Pools</Trans>
        </Text>
        <Text color={theme.subText} textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
          <Trans>
            We can amplify liquidity pools to provide much higher capital efficiency and better slippage for you.
            Deposit less tokens and still achieve better liquidity and volume.
          </Trans>
        </Text>

        <ButtonEmpty padding="0" width="fit-content">
          <ExternalLink href="https://docs.kyberswap.com">
            <Text color={theme.primary} fontSize="14px" fontWeight={600}>
              <Trans>Learn More</Trans>↗
            </Text>
          </ExternalLink>
        </ButtonEmpty>
      </Flex>

      {above768 && (
        <Flex alignItems="center" width="fit-content">
          <KyberSwapSlippage>
            <img src={isDarkMode ? '/logo-dark.svg' : '/logo.svg'} width="88px" alt="KyberSwap" />
            <Flex justifyContent="center">
              <Text fontWeight="500" fontSize="40px" lineHeight="48px">
                ~0.1
              </Text>
              <Text marginTop="6px">%</Text>
            </Flex>
            <Text fontSize="12px">Slippage</Text>
            <Text fontSize="10px" color={theme.subText} marginTop="12px">
              AMP Factor = 100
            </Text>
          </KyberSwapSlippage>
          <TypicalAMM background={isDarkMode ? undefined : '#DCDBDC'}>
            <Text color={theme.subText} fontSize="12px">
              Typical AMM
            </Text>
            <Flex marginTop="8px" justifyContent="center">
              <Text fontWeight="500" fontSize="40px" lineHeight="48px">
                ~11
              </Text>
              <Text marginTop="6px">%</Text>
            </Flex>
            <Text fontSize="12px">Slippage</Text>
          </TypicalAMM>
        </Flex>
      )}
    </ForLiquidityProviderItem>
  )

  const ForLPHigherReturn = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <BestPrice size={64} />
      <Text marginTop="28px" fontWeight="500" color={theme.primary}>
        <Trans>HIGHER RETURNS</Trans>
      </Text>

      <Text marginTop={['40px', '48px']}>
        <Trans>Dynamic Fees</Trans>
      </Text>
      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>We adjust trading fees dynamically based on market conditions to give you the best returns.</Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/dynamic-fee">
          <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
            <Trans>Learn More</Trans>↗
          </Text>
        </ExternalLink>
      </ButtonEmpty>
    </ForLiquidityProviderItem>
  )

  const ForLPBonusReward = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <Drop />
      <Text marginTop="28px" fontWeight="500" color={theme.primary}>
        <Trans>BONUS REWARDS</Trans>
      </Text>

      <Text marginTop={['40px', '48px']}>
        <Trans>Rainmaker Yield Farming</Trans>
      </Text>
      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          Deposit your tokens and farm attractive rewards. We collaborate with projects to get you the best rewards.
        </Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/guides/yield-farming">
          <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
            <Trans>Learn More</Trans>↗
          </Text>
        </ExternalLink>
      </ButtonEmpty>
    </ForLiquidityProviderItem>
  )

  // WAIT FOR PROMM TO RELEASE

  const ConcentratedLiquidity = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <BestPrice size={64} />
      <Text
        marginTop="28px"
        fontWeight="500"
        fontSize="16"
        color={theme.primary}
        style={{ textTransform: 'uppercase' }}
        textAlign={above768 ? 'start' : 'center'}
      >
        <Trans>Earn More with Concentrated Liquidity</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          As Liquidity Providers, you can now supply liquidity to a pool within a custom price range. This allows your
          liquidity to be used more efficiently. Consequently, you will earn more trading fees on your liquidity.
        </Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/overview/overview-kyberswap-elastic">
          <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
            <Trans>Learn More</Trans>↗
          </Text>
        </ExternalLink>
      </ButtonEmpty>
    </ForLiquidityProviderItem>
  )

  const PreventAttack = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
    >
      <AntiSnippingAttack size={64} />
      <Text marginTop="28px" fontWeight="500" color={theme.primary} textAlign={above768 ? 'start' : 'center'}>
        <Trans>PREVENT SNIPING ATTACKS</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          Sniping is where an attacker jumps in front of normal liquidity providers by adding and removing liquidity
          just before and right after a huge swap. To protect our liquidity providers, we have created an anti-sniping
          feature.
        </Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/overview/overview-kyberswap-elastic">
          <Text color={theme.primary} fontSize="14px" fontWeight={600} marginTop="24px">
            <Trans>Learn More</Trans>↗
          </Text>
        </ExternalLink>
      </ButtonEmpty>
    </ForLiquidityProviderItem>
  )

  return (
    <div style={{ position: 'relative', background: isDarkMode ? theme.buttonBlack : theme.white, width: '100%' }}>
      <AboutPage>
        <Banner margin="32px auto 0" padding="0 16px" maxWidth="1224px" />

        <Wrapper>
          <Text as="h1" fontSize={['28px', '48px']} textAlign="center" lineHeight={['32px', '60px']} fontWeight="300">
            <Trans>
              <Text color={theme.primary} as="span" fontWeight="500">
                Swap
              </Text>{' '}
              and{' '}
              <Text fontWeight="500" color={theme.primary} as="span">
                Earn
              </Text>{' '}
              Tokens at the Best Rates
            </Trans>
          </Text>

          <Text
            color={theme.subText}
            fontSize={['1rem', '1.25rem']}
            marginTop={['40px', '48px']}
            textAlign="center"
            lineHeight={1.5}
          >
            <Trans>
              KyberSwap is DeFi’s premier automated market maker, providing the best token prices for traders across
              multiple exchanges, and maximizing earnings for liquidity providers, in one decentralized platform.
            </Trans>
          </Text>

          <SupportedChain>
            <Ethereum />
            <Polygon />
            <Binance />
            <Avalanche />
            <Fantom />
            <Cronos />
            <Arbitrum />
            <Velas />
            <Aurora />
            <Oasis />
            <Bttc />
          </SupportedChain>

          <Flex
            justifyContent="center"
            maxWidth="456px"
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            <BtnPrimary onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)} as={Link} to="/swap">
              <Repeat />
              <Text fontSize={['16px', '20px']} marginLeft="8px">
                <Trans>Swap Now</Trans>
              </Text>
            </BtnPrimary>
            <BtnOutlined
              as={Link}
              to={poolsMenuLink}
              onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED)}
            >
              <MoneyBag color={theme.btnOutline} />
              <Text fontSize={['16px', '20px']} marginLeft="8px">
                <Trans>Start Earning</Trans>
              </Text>
            </BtnOutlined>
          </Flex>

          <OverflowStatisticWrapper>
            <StatisticWrapper>
              <Flex sx={{ gap: '16px' }} flex={2}>
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {dataToShow.totalTradingVolume ? (
                      formatBigLiquidity(dataToShow.totalTradingVolume, 2, true)
                    ) : (
                      <Loader />
                    )}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>Total Trading Volume</Trans>*
                  </Text>
                </StatisticItem>
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {dataToShow['24hTradingVolume'] ? (
                      formatBigLiquidity(dataToShow['24hTradingVolume'], 2, true)
                    ) : (
                      <Loader />
                    )}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>24H Trading Volume</Trans>*
                  </Text>
                </StatisticItem>
              </Flex>
              <Flex sx={{ gap: '16px' }} flex={2}>
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {dataToShow.totalValueLocked ? (
                      formatBigLiquidity(dataToShow.totalValueLocked, 2, true)
                    ) : (
                      <Loader />
                    )}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>Total Value Locked</Trans>
                  </Text>
                </StatisticItem>
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {dataToShow.totalAMPLiquidity ? (
                      formatBigLiquidity(dataToShow.totalAMPLiquidity, 2, true)
                    ) : (
                      <Loader />
                    )}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>Total AMP Liquidity</Trans>**
                  </Text>
                </StatisticItem>
              </Flex>
              {(dataToShow.totalEarnings > 0 || (dataToShow.maxAPRAvailable?.value ?? 0) > 0) && (
                <Flex
                  sx={{ gap: '16px' }}
                  flex={dataToShow.totalEarnings > 0 && (dataToShow.maxAPRAvailable?.value ?? 0) > 0 ? 2 : 1}
                >
                  {dataToShow.totalEarnings > 0 && (
                    <StatisticItem>
                      <Text fontSize={['24px', '28px']} fontWeight={600}>
                        {formatBigLiquidity(dataToShow.totalEarnings.toString() ?? 0, 2, true)}
                      </Text>
                      <Text color={theme.subText} marginTop="8px">
                        <Trans>Total Earnings</Trans>
                      </Text>
                    </StatisticItem>
                  )}
                  {dataToShow.maxAPRAvailable && (dataToShow.maxAPRAvailable.value || 0) > 0 && (
                    <StatisticItem>
                      <Text fontSize={['24px', '28px']} fontWeight={600}>
                        {dataToShow.maxAPRAvailable.value.toFixed(2) + '%'}
                      </Text>
                      <Text color={theme.subText} marginTop="8px">
                        <Link
                          to={`/${dataToShow.maxAPRAvailable.is_farm ? 'farms' : 'pools'}?networkId=${
                            dataToShow.maxAPRAvailable.chain_id
                          }&search=${dataToShow.maxAPRAvailable.id}`}
                          style={{ textDecorationLine: 'none' }}
                        >
                          <Trans>Max APY Available</Trans>↗
                        </Link>
                      </Text>
                    </StatisticItem>
                  )}
                </Flex>
              )}
            </StatisticWrapper>
            <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="12px" color={theme.subText}>
              *<Trans>Includes DEX aggregation</Trans>
            </Text>
            <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="8px" color={theme.subText}>
              **<Trans>TVL equivalent compared to AMMs</Trans>
            </Text>
            <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="8px" color={theme.subText}>
              **<Trans>Applicable to KyberSwap Classic</Trans>
            </Text>
          </OverflowStatisticWrapper>

          <AboutKNC>
            <img height="400px" src={KNCGraphic} alt="KNCGraphic" style={{ display: above768 ? 'block' : 'none' }} />
            <Flex width="100%" alignSelf="center" flexDirection="column" height="max-content">
              <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
                <Trans>ABOUT KNC</Trans>
              </Text>
              <Text as="h2" marginTop="12px" fontSize={['28px', '36px']} fontWeight="500">
                <Trans>Kyber Network Crystal (KNC)</Trans>
              </Text>
              <Text
                fontSize="16px"
                marginTop={['40px', '48px']}
                color={theme.subText}
                lineHeight="24px"
                textAlign="justify"
              >
                <Trans>
                  KNC is a utility and governance token, and an integral part of Kyber Network and its flagship product
                  KyberSwap. It is the glue that connects different stakeholders in Kyber's ecosystem
                </Trans>
              </Text>
              <img
                width="75%"
                src={KNCGraphic}
                alt="KNCGraphic"
                style={{ display: above768 ? 'none' : 'block', margin: 'auto', marginTop: '40px' }}
              />
              <BtnPrimary as={Link} to="/about/knc" margin="48px 0">
                <img width="14px" src={KNCBlack} alt="KNCBlack" />
                <Text fontSize={['14px', '16px']} marginLeft="8px">
                  <Trans>Find out more</Trans>
                </Text>
              </BtnPrimary>
            </Flex>
          </AboutKNC>

          <ForTrader>
            <Flex flex={1} flexDirection="column" height="max-content">
              <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
                <Trans>FOR TRADERS</Trans>
              </Text>
              <Text as="h2" marginTop="12px" fontSize={['28px', '36px']} fontWeight="500">
                <Trans>Swap your tokens at the best rates. No limits</Trans>
              </Text>
              <Text
                fontSize="16px"
                marginTop={['40px', '48px']}
                color={theme.subText}
                lineHeight="24px"
                textAlign="justify"
              >
                <Trans>
                  With our Dynamic Trade Routing technology, we aggregate liquidity from multiple DEXs (including
                  KyberSwap) and identify the best trade route for you.
                </Trans>
              </Text>

              <Flex marginTop="20px" alignItems="center">
                <BestPrice />
                <Text marginLeft="12px">
                  <Trans>Best price guaranteed</Trans>
                </Text>
              </Flex>
              <Flex marginTop="20px" alignItems="center">
                <LowestSlippage />
                <Text marginLeft="12px">
                  <Trans>Lowest possible slippage</Trans>
                </Text>
              </Flex>

              <Flex marginTop="20px" alignItems="center">
                <Clock />
                <Text marginLeft="12px">
                  <Trans>Save time & effort</Trans>
                </Text>
              </Flex>

              {above500 && (
                <BtnPrimary
                  margin="48px 0"
                  width="216px"
                  as={Link}
                  to="/swap"
                  onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
                >
                  <Repeat size={20} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>Swap Now</Trans>
                  </Text>
                </BtnPrimary>
              )}
            </Flex>
            <Flex flex={1} flexDirection="column">
              <img
                width="100%"
                src={isDarkMode ? ForTraderImage : ForTraderImageLight}
                alt="ForTrader"
                style={{ marginTop: above992 ? '0.25rem' : '40px' }}
              />
              <KSStatistic />
            </Flex>
            {!above500 && (
              <BtnPrimary
                margin="40px 0"
                as={Link}
                to="/swap"
                onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
              >
                <Repeat />
                <Text fontSize={['16px', '20px']} marginLeft="8px">
                  <Trans>Swap Now</Trans>
                </Text>
              </BtnPrimary>
            )}
          </ForTrader>

          <Text
            color={theme.primary}
            marginTop={['100px', '160px']}
            fontWeight="500"
            fontSize={['16px', '20px']}
            textAlign="center"
          >
            <Trans>FOR LIQUIDITY PROVIDERS</Trans>
          </Text>
          <Text as="h2" marginTop={['24px', '32px']} fontWeight="500" fontSize={['28px', '36px']} textAlign="center">
            <Trans>Earn more with your crypto assets</Trans>
          </Text>
          <Text
            color={theme.subText}
            margin="auto"
            marginTop={['40px', '48px']}
            fontSize="1rem"
            textAlign="center"
            maxWidth="900px"
            lineHeight={1.5}
          >
            <Trans>
              We give liquidity providers the option of choosing between two liquidity protocols so they can earn
              passive income - KyberSwap Elastic and KyberSwap Classic. Simply deposit your liquidity and start earning.
            </Trans>
          </Text>

          <Tabs>
            <TabItem active={activeTab === VERSION.ELASTIC} role="button" onClick={() => setActiveTab(VERSION.ELASTIC)}>
              KyberSwap Elastic
            </TabItem>
            <Text color={theme.subText}>|</Text>
            <TabItem role="button" active={activeTab === VERSION.CLASSIC} onClick={() => setActiveTab(VERSION.CLASSIC)}>
              KyberSwap Classic
            </TabItem>
          </Tabs>

          {activeTab === VERSION.CLASSIC &&
            (above500 ? (
              <Flex marginTop={['40px', '48px']} flexDirection="column">
                <ForLPLowerSlippage />
                <Flex marginTop="24px" sx={{ gap: '24px' }} flexDirection={above768 ? 'row' : 'column'}>
                  <ForLPHigherReturn />
                  <ForLPBonusReward />
                </Flex>
              </Flex>
            ) : (
              <GridWrapper>
                <ForLPLowerSlippage width="300px" />
                <ForLPHigherReturn width="300px" />
                <ForLPBonusReward width="300px" />
              </GridWrapper>
            ))}

          {activeTab === VERSION.ELASTIC &&
            (above500 ? (
              <Flex marginTop={['40px', '48px']} sx={{ gap: '24px' }}>
                <ConcentratedLiquidity />
                <Compounding />
                <PreventAttack />
              </Flex>
            ) : (
              <GridWrapper>
                <ConcentratedLiquidity width="300px" />
                <Compounding width="300px" />
                <PreventAttack width="300px" />
              </GridWrapper>
            ))}

          {/* WAIT FOR PROMM RELEASE */}
          {/* {above768 ? (
            <Flex sx={{ gap: '24px' }} marginTop={['40px', '48px']} flexDirection="row">
              <ConcentratedLiquidity width="392px" />
              <Compounding width="392px" />
              <PreventAttack width="392px" />
            </Flex>
          ) : (
            <Swiper
              slidesPerView={1}
              freeMode={true}
              pagination={{
                clickable: true,
              }}
              modules={[FreeMode, Pagination]}
              style={{ marginTop: '24px' }}
            >
              <SwiperSlide>
                <ConcentratedLiquidity />
              </SwiperSlide>
              <SwiperSlide>
                <Compounding />
              </SwiperSlide>
              <SwiperSlide>
                <PreventAttack />
              </SwiperSlide>
            </Swiper>
          )}*/}

          <Flex
            justifyContent="center"
            maxWidth="456px"
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            <BtnPrimary
              as={Link}
              to={poolsMenuLink}
              onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED)}
            >
              <MoneyBag size={20} color={theme.textReverse} />
              <Text fontSize="16px" marginLeft="8px">
                <Trans>Start Earning</Trans>
              </Text>
            </BtnPrimary>
            <BtnOutlined as={Link} to="/farms" onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_VIEW_FARMS_CLICKED)}>
              <FarmIcon size={20} color={theme.btnOutline} />
              <Text fontSize="16px" marginLeft="8px">
                <Trans>View Farms</Trans>
              </Text>
            </BtnOutlined>
          </Flex>

          <Flex
            sx={{ gap: '24px' }}
            marginTop={['100px', '160px']}
            alignItems="center"
            flexDirection={above768 ? 'row' : 'column'}
          >
            <Flex flex={1} flexDirection="column">
              <Text as="h2" fontWeight="500" fontSize={['28px', '36px']}>
                <Trans>Seamless liquidity.</Trans>
              </Text>
              <Text fontWeight="500" fontSize={['28px', '36px']}>
                <Trans>For everyone</Trans>
              </Text>

              <Text color={theme.subText} marginTop={['40px', '48px']} lineHeight={1.5}>
                <Trans>Anyone can provide liquidity to KyberSwap by depositing tokens e.g. Traders, Token Teams.</Trans>
              </Text>
              <Text color={theme.subText} marginTop="24px" lineHeight={1.5}>
                <Trans>
                  Anyone can access this liquidity from KyberSwap for their own use case e.g. Dapps, Aggregators.
                </Trans>
              </Text>
              <Text color={theme.subText} marginTop="24px" lineHeight={1.5}>
                <Trans>
                  Thousands of users and multiple decentralized applications are already providing and using our
                  liquidity.
                </Trans>
              </Text>

              <Flex marginTop="20px" alignItems="center">
                <Enter />
                <Text marginLeft="12px">
                  <Trans>No KYC or sign-ups required</Trans>
                </Text>
              </Flex>
              <Flex marginTop="20px" alignItems="center">
                <BestPrice />
                <Text marginLeft="12px">
                  <Trans>No extra deposit or withdrawal fees</Trans>
                </Text>
              </Flex>
              <Flex marginTop="20px" alignItems="center">
                <CircleFocus />
                <Text marginLeft="12px">
                  <Trans>List your tokens permissionlessly</Trans>
                </Text>
              </Flex>
            </Flex>
            <Flex flex={1}>
              <img src={SeamlessImg} style={{ flex: 1 }} width="100%" alt="SeamlessImg" />
            </Flex>
          </Flex>

          <Flex
            sx={{ gap: '24px' }}
            marginTop={['40px', '48px']}
            flexDirection={above768 ? 'row' : 'column'}
            maxWidth="696px"
          >
            <BtnPrimary
              as={Link}
              to={createPoolLink}
              onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_CREATE_NEW_POOL_CLICKED)}
            >
              <Plus size={20} />
              <Text marginLeft="8px" fontSize={['14px', '16px']}>
                <Trans>Create New Pool</Trans>
              </Text>
            </BtnPrimary>
            <Flex sx={{ gap: above768 ? '24px' : '16px' }} maxWidth="456px">
              <BtnOutlined as={ExternalLink} href="https://forms.gle/gLiNsi7iUzHws2BY8">
                <Edit color={theme.btnOutline} size={20} />
                <Text marginLeft="8px" fontSize={['14px', '16px']}>
                  <Trans>Contact Us</Trans>
                </Text>
              </BtnOutlined>

              <BtnOutlined as={ExternalLink} href="https://docs.kyberswap.com/">
                <FileText color={theme.btnOutline} size={20} />
                <Text marginLeft="8px" fontSize={['14px', '16px']}>
                  <Trans>Docs</Trans>
                </Text>
              </BtnOutlined>
            </Flex>
          </Flex>

          <Text as="h2" marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
            <Trans>Committed to Security</Trans>
          </Text>

          <Flex
            marginTop="40px"
            sx={{ gap: above992 ? '24px' : '0' }}
            flexDirection={above992 ? 'row' : 'column'}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              flex={1}
              sx={{ gap: above992 ? '24px' : '10px' }}
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              <div style={{ flex: 1, textAlign: 'center' }}>
                <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '21px' : '14px'}>
                  <Trans>Code Audited</Trans>
                </Text>

                <ButtonEmpty padding="0">
                  <ExternalLink href="https://chainsecurity.com/security-audit/kyber-network-dynamic-market-maker-dmm/">
                    <img
                      src={
                        !isDarkMode
                          ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                          : require('../../assets/svg/chainsecurity.svg')
                      }
                      alt="security"
                      width={above992 ? '197px' : '140px'}
                    />
                  </ExternalLink>
                </ButtonEmpty>
              </div>

              <CommittedToSecurityDivider height={!above992 ? '110px' : undefined} />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '24px' : '12px'}>
                  <Trans>Insured by</Trans>
                </Text>
                <ButtonEmpty padding="0">
                  <ExternalLink href="https://medium.com/unslashed/kyber-network-and-unslashed-finance-partner-over-a-20m-native-insurance-to-protect-kyber-network-df543045a97c">
                    <img
                      src={
                        !isDarkMode
                          ? require('../../assets/svg/unslashed_light.svg')
                          : require('../../assets/svg/unslashed.svg')
                      }
                      alt="unslashed"
                      width={above992 ? '170px' : '140px'}
                    />
                  </ExternalLink>
                </ButtonEmpty>
              </div>
            </Flex>

            {above992 ? <CommittedToSecurityDivider /> : <div />}

            <Flex
              flex={1}
              sx={{ gap: above992 ? '24px' : '10px' }}
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              <div style={{ flex: 1, textAlign: 'center' }}>
                <Text color={theme.subText} textAlign="center" marginBottom={above992 ? '16px' : '12px'}>
                  <Trans>On-chain & Open Source</Trans>
                </Text>
                <ButtonEmpty padding="0">
                  <ExternalLink href="https://github.com/KyberNetwork">
                    <img src={isDarkMode ? githubImg : githubImgLight} alt="github" width="125px" />
                  </ExternalLink>
                </ButtonEmpty>
              </div>
              <CommittedToSecurityDivider height={!above992 ? '110px' : undefined} />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <Text color={theme.subText} textAlign="center" marginBottom="16px">
                  <Trans>Bug Bounty</Trans>
                </Text>
                <img
                  src={require('../../assets/svg/about_icon_bug_bounty.svg')}
                  alt="bugbounty"
                  width={above992 ? '186px' : '140px'}
                />
              </div>
            </Flex>
          </Flex>

          <Text as="h2" marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
            <Trans>Powered by</Trans>

            <Powered>
              <img
                src={
                  isDarkMode
                    ? require('../../assets/svg/about_icon_kyber.svg')
                    : require('../../assets/svg/about_icon_kyber_light.svg')
                }
                alt="kyber_icon"
                width="100%"
              />
              <img
                src={
                  isDarkMode
                    ? require('../../assets/svg/about_icon_ethereum.png')
                    : require('../../assets/svg/about_icon_ethereum_light.png')
                }
                alt="ethereum_icon"
                width="100%"
              />
              <img src={require('../../assets/svg/about_icon_bsc.svg')} alt="bsc_icon" width="100%" />
              <PolygonLogoFull />
              <img src={require('../../assets/svg/about_icon_avalanche.svg')} alt="avalanche_icon" width="100%" />
              <FantomLogoFull color={isDarkMode ? '#fff' : '#1969FF'} width="100%" height="unset" />
              <CronosLogoFull color={isDarkMode ? undefined : '#142564'} />
              <img
                src={require(`../../assets/images/Arbitrum_HorizontalLogo${isDarkMode ? '-dark' : ''}.svg`)}
                alt=""
                width="100%"
              />
              <VelasLogoFull color={isDarkMode ? undefined : 'black'} />
              <AuroraFull />
              <OasisLogoFull />
              <img
                src={require(`../../assets/images/btt-logo${isDarkMode ? '-dark' : ''}.svg`)}
                alt="btt"
                width="100%"
              />
            </Powered>
          </Text>
        </Wrapper>
      </AboutPage>
      <Footer background={isDarkMode ? theme.background : theme.white}>
        <FooterContainer>
          <Flex flexWrap="wrap" sx={{ gap: '12px' }} justifyContent="center">
            <ExternalLink href={`https://docs.kyberswap.com`}>
              <Trans>Docs</Trans>
            </ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://github.com/KyberNetwork`}>
              <Trans>Github</Trans>
            </ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://kyber.org`}>KyberDAO</ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://gov.kyber.org`}>
              <Trans>Forum</Trans>
            </ExternalLink>
            {!above500 ? <div /> : <VerticalDivider />}
            <ExternalLink href={`https://kyber.network`}>Kyber Network</ExternalLink>
            <VerticalDivider />
            <StyledInternalLink to={`/about/knc`}>KNC</StyledInternalLink>
          </Flex>
          <FooterSocialLink />
        </FooterContainer>
      </Footer>
    </div>
  )
}

export default AboutKyberSwap
