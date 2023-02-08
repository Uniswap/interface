import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Edit, FileText, Plus, Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import KNCGraphic from 'assets/images/knc-graphic.png'
import githubImg from 'assets/svg/about_icon_github.png'
import githubImgLight from 'assets/svg/about_icon_github_light.png'
import ForTraderImage from 'assets/svg/for_trader.svg'
import ForTraderImageLight from 'assets/svg/for_trader_light.svg'
import { ReactComponent as KNCSVG } from 'assets/svg/knc_black.svg'
import SeamlessImg from 'assets/svg/seamless.svg'
import Banner from 'components/Banner'
import { ButtonEmpty, ButtonLight } from 'components/Button'
import { FooterSocialLink } from 'components/Footer/Footer'
import {
  Arbitrum,
  Aurora,
  AuroraFull,
  Avalanche,
  BestPrice,
  Binance,
  Bttc,
  CircleFocus,
  Clock,
  Cronos,
  CronosLogoFull,
  Drop,
  Enter,
  EthW,
  Ethereum,
  Fantom,
  FantomLogoFull,
  FarmIcon,
  LowestSlippage,
  MoneyBagOutline,
  Oasis,
  OasisLogoFull,
  OptimismLogo,
  OptimismLogoFull,
  Polygon,
  PolygonLogoFull,
  Solana,
  SolanaLogoFull,
  Velas,
  VelasLogoFull,
} from 'components/Icons'
import AntiSnippingAttack from 'components/Icons/AntiSnippingAttack'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useGlobalData } from 'state/about/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'

import KyberSwapGeneralIntro from '../KyberSwapGeneralIntro'
import {
  AboutKNC,
  AboutPage,
  BtnOutlined,
  BtnPrimary,
  CommittedToSecurityDivider,
  Footer,
  FooterContainer,
  ForLiquidityProviderItem,
  ForTrader,
  ForTraderDivider,
  ForTraderInfo,
  ForTraderInfoShadow,
  GridWrapper,
  KyberSwapSlippage,
  OverflowStatisticWrapper,
  Powered,
  StatisticItem,
  StatisticWrapper,
  SupportedChain,
  TabItem,
  Tabs,
  TypicalAMM,
  VerticalDivider,
  Wrapper,
} from '../styleds'
import MeetTheTeam from './MeetTheTeam'

const KNCBlack = styled(KNCSVG)`
  path {
    fill: ${({ theme }) => theme.textReverse};
  }
`

const ForTraderInfoRow = styled.div`
  flex: 1 1 100%;
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
    gap: 24px;
    width: 100%;
    height: 100%;
  `}
`

const ForTraderInfoCell = styled.div`
  flex: 1 1 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex: 1;
  `}
`

export const KSStatistic = () => {
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  return (
    <Box sx={{ position: 'relative', marginTop: '20px' }}>
      <ForTraderInfoShadow />
      <ForTraderInfo>
        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              $24B
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>TVL From DEXs</Trans>
            </Text>
          </ForTraderInfoCell>

          <ForTraderDivider />

          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              70+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>DEXs</Trans>
            </Text>
          </ForTraderInfoCell>
        </ForTraderInfoRow>

        <ForTraderDivider horizontal={upToLarge} />

        <ForTraderInfoRow>
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              {MAINNET_NETWORKS.length - 1}+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>Chains</Trans>
            </Text>
          </ForTraderInfoCell>
          <ForTraderDivider />
          <ForTraderInfoCell>
            <Text fontWeight="600" fontSize="24px">
              20,000+
            </Text>
            <Text color={theme.subText} marginTop="4px" fontSize="14px">
              <Trans>Tokens</Trans>
            </Text>
          </ForTraderInfoCell>
        </ForTraderInfoRow>
      </ForTraderInfo>
    </Box>
  )
}

function AboutKyberSwap() {
  const { isSolana, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

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

      <Text color={theme.text} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
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
        <Text color={theme.text} textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
          <Trans>
            We can amplify liquidity pools to provide much higher capital efficiency and better slippage for you.
            Deposit less tokens and still achieve better liquidity and volume.
          </Trans>
        </Text>

        <ButtonEmpty padding="0" width="fit-content">
          <ExternalLink href="https://docs.kyberswap.com/Classic/introduction">
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
      <Text color={theme.text} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>We adjust trading fees dynamically based on market conditions to give you the best returns.</Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/Classic/overview/dynamic-fee">
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
      <Text color={theme.text} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          Deposit your tokens and farm attractive rewards. We collaborate with projects to get you the best rewards.
        </Trans>
      </Text>

      <ButtonEmpty padding="0" width="fit-content">
        <ExternalLink href="https://docs.kyberswap.com/Classic/introduction">
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

      <Text color={theme.text} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
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

      <Text color={theme.text} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
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

  const renderCreateNewPoolButton = () => {
    return isSolana ? (
      <BtnPrimary disabled style={{ flex: '0 0 216px', padding: '12px' }}>
        <Plus size={20} />
        <Text marginLeft="8px" fontSize={['14px', '16px']}>
          <Trans>Create New Pool</Trans>
        </Text>
      </BtnPrimary>
    ) : (
      <BtnPrimary
        as={Link}
        to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=elastic&highlightCreateButton=true`}
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_CREATE_NEW_POOL_CLICKED)}
        style={{ flex: '0 0 216px', padding: '12px' }}
      >
        <Plus size={20} />
        <Text marginLeft="8px" fontSize={['14px', '16px']}>
          <Trans>Create New Pool</Trans>
        </Text>
      </BtnPrimary>
    )
  }

  const renderContactUsButton = () => {
    return (
      <ButtonLight style={{ flex: '0 0 216px' }} as={ExternalLink} href="https://forms.gle/gLiNsi7iUzHws2BY8">
        <Edit color={theme.primary} size={20} />
        <Text marginLeft="8px" fontSize={['14px', '16px']}>
          <Trans>Contact Us</Trans>
        </Text>
      </ButtonLight>
    )
  }

  const renderDocsButton = () => {
    return (
      <BtnOutlined style={{ flex: '0 0 216px' }} as={ExternalLink} href="https://docs.kyberswap.com/">
        <FileText color={theme.subText} size={20} />
        <Text marginLeft="8px" fontSize={['14px', '16px']}>
          <Trans>Docs</Trans>
        </Text>
      </BtnOutlined>
    )
  }

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

          <SupportedChain>
            <Ethereum />
            <EthW />
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
            <OptimismLogo />
            <Solana />
          </SupportedChain>

          <KyberSwapGeneralIntro />

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
                          to={`/${dataToShow.maxAPRAvailable.is_farm ? 'farms' : 'pools'}/${
                            NETWORKS_INFO[dataToShow.maxAPRAvailable.chain_id as ChainId].route
                          }?tab=${dataToShow.maxAPRAvailable.type || VERSION.CLASSIC}&search=${
                            dataToShow.maxAPRAvailable.id
                          }`}
                          style={{ textDecorationLine: 'none' }}
                        >
                          <Trans>Max APR Available</Trans>↗
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
                color={theme.text}
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
                  to={APP_PATHS.SWAP + '/' + networkInfo.route}
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
                to={APP_PATHS.SWAP + '/' + networkInfo.route}
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
            color={theme.text}
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

          <Flex
            justifyContent="center"
            maxWidth="456px"
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            {!isSolana ? (
              <>
                <BtnPrimary
                  as={Link}
                  to={
                    activeTab === VERSION.ELASTIC
                      ? `${APP_PATHS.POOLS}/${networkInfo.route}?tab=elastic`
                      : `${APP_PATHS.POOLS}/${networkInfo.route}?tab=classic&highlightCreateButton=true`
                  }
                  onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED)}
                >
                  <MoneyBagOutline size={20} color={theme.textReverse} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>Start Earning</Trans>
                  </Text>
                </BtnPrimary>
                <ButtonLight
                  as={Link}
                  to={
                    activeTab === VERSION.ELASTIC
                      ? `${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic`
                      : `${APP_PATHS.FARMS}/${networkInfo.route}?tab=classic`
                  }
                  onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_VIEW_FARMS_CLICKED)}
                  style={{
                    flex: 1,
                  }}
                >
                  <FarmIcon size={20} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>View Farms</Trans>
                  </Text>
                </ButtonLight>
              </>
            ) : (
              <>
                <BtnPrimary
                  disabled
                  style={{
                    flex: 1,
                  }}
                >
                  <MoneyBagOutline size={20} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>Start Earning</Trans>
                  </Text>
                </BtnPrimary>
                <BtnPrimary
                  disabled
                  style={{
                    flex: 1,
                  }}
                >
                  <FarmIcon size={20} />
                  <Text fontSize="16px" marginLeft="8px">
                    <Trans>View Farms</Trans>
                  </Text>
                </BtnPrimary>
              </>
            )}
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

              <Text color={theme.text} marginTop={['40px', '48px']} lineHeight={1.5}>
                <Trans>Anyone can provide liquidity to KyberSwap by depositing tokens e.g. Traders, Token Teams.</Trans>
              </Text>
              <Text color={theme.text} marginTop="24px" lineHeight={1.5}>
                <Trans>
                  Anyone can access this liquidity from KyberSwap for their own use case e.g. Dapps, Aggregators.
                </Trans>
              </Text>
              <Text color={theme.text} marginTop="24px" lineHeight={1.5}>
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

          {above768 ? (
            <Flex sx={{ gap: '24px' }} marginTop={['40px', '48px']} maxWidth="696px">
              {renderCreateNewPoolButton()}
              {renderContactUsButton()}
              {renderDocsButton()}
            </Flex>
          ) : (
            <Flex sx={{ gap: '24px', alignItems: 'center' }} marginTop={['40px', '48px']} flexDirection="column">
              <Flex sx={{ justifyContent: 'center' }}>{renderCreateNewPoolButton()}</Flex>
              <Flex sx={{ gap: '16px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                {renderContactUsButton()}
                {renderDocsButton()}
              </Flex>
            </Flex>
          )}

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
                  <ExternalLink href="https://chainsecurity.com/security-audit/kyberswap-elastic">
                    <img
                      src={
                        !isDarkMode
                          ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                          : require('assets/svg/chainsecurity.svg').default
                      }
                      alt="security"
                      width={above992 ? '197px' : '140px'}
                    />
                  </ExternalLink>
                </ButtonEmpty>
              </div>
            </Flex>

            {above992 ? <CommittedToSecurityDivider /> : <div />}

            <Flex
              flex={2}
              sx={{ gap: above992 ? '24px' : '10px' }}
              alignItems="center"
              justifyContent="center"
              width="100%"
              marginTop={above992 ? '0' : '16px'}
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
              <CommittedToSecurityDivider height={!above992 ? '90px' : undefined} />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <Text color={theme.subText} textAlign="center" marginBottom="16px">
                  <Trans>Bug Bounty</Trans>
                </Text>
                <img
                  src={require('assets/svg/about_icon_bug_bounty.svg').default}
                  alt="bugbounty"
                  width={above992 ? '186px' : '140px'}
                />
              </div>
            </Flex>
          </Flex>

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
                  KyberSwap. It is the glue that connects different stakeholders in Kyber&apos;s ecosystem
                </Trans>
              </Text>
              <img
                width="75%"
                src={KNCGraphic}
                alt="KNCGraphic"
                style={{ display: above768 ? 'none' : 'block', margin: 'auto', marginTop: '40px' }}
              />
              <BtnPrimary as={Link} to="/about/knc" margin="48px 0">
                <KNCBlack />
                <Text fontSize={['14px', '16px']} marginLeft="8px">
                  <Trans>Find out more</Trans>
                </Text>
              </BtnPrimary>
            </Flex>
          </AboutKNC>

          <MeetTheTeam />

          <Text as="h2" marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
            <Trans>Powered by</Trans>

            <Powered>
              <img
                src={
                  isDarkMode
                    ? require('assets/svg/about_icon_kyber.svg').default
                    : require('assets/svg/about_icon_kyber_light.svg').default
                }
                alt="kyber_icon"
                width="100%"
              />
              <img
                src={
                  isDarkMode
                    ? require('assets/svg/about_icon_ethereum.png').default
                    : require('assets/svg/about_icon_ethereum_light.png').default
                }
                alt="ethereum_icon"
                width="100%"
              />
              <img src={require('assets/svg/about_icon_bsc.svg').default} alt="bsc_icon" width="100%" />
              <PolygonLogoFull />
              <img src={require('assets/svg/about_icon_avalanche.svg').default} alt="avalanche_icon" width="100%" />
              <FantomLogoFull color={isDarkMode ? '#fff' : '#1969FF'} width="100%" height="unset" />
              <CronosLogoFull color={isDarkMode ? undefined : '#142564'} />
              <img
                src={require(`assets/images/Arbitrum_HorizontalLogo${isDarkMode ? '-dark' : ''}.svg`).default}
                alt=""
                width="100%"
              />
              <VelasLogoFull color={isDarkMode ? undefined : 'black'} />
              <AuroraFull />
              <OasisLogoFull />
              <img
                src={require(`assets/images/btt-logo${isDarkMode ? '-dark' : ''}.svg`).default}
                alt="btt"
                width="100%"
              />
              <OptimismLogoFull />
              <SolanaLogoFull />
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
