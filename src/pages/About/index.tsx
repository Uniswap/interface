import React, { useState, useEffect, useCallback } from 'react'
import { Text, Flex } from 'rebass'
import { Link } from 'react-router-dom'
import useTheme from 'hooks/useTheme'
import { Trans } from '@lingui/macro'
import {
  MoneyBag,
  Ethereum,
  Polygon,
  Binance,
  Clock,
  Avalanche,
  Fantom,
  BestPrice,
  LowestSlippage,
  FarmIcon,
  Enter,
  CircleFocus,
  Telegram,
  Drop
} from 'components/Icons'
import { Repeat, Plus, Edit, FileText } from 'react-feather'
import Loader from 'components/Loader'
import ForTraderImage from 'assets/svg/for_trader.svg'
import ForTraderImageLight from 'assets/svg/for_trader_light.svg'
import SeamlessImg from 'assets/svg/seamless.svg'
import { useMedia } from 'react-use'
import { ExternalLink } from 'theme'
import { useDarkModeManager } from 'state/user/hooks'
import githubImg from 'assets/svg/about_icon_github.png'
import githubImgLight from 'assets/svg/about_icon_github_light.png'
import FantomLogoFull from 'components/Icons/FantomLogoFull'
import { KYBER_NETWORK_TWITTER_URL, KYBER_NETWORK_DISCORD_URL, KNC, MAX_ALLOW_APY } from 'constants/index'
import { ChainId, ETHER, Fraction, JSBI } from '@dynamic-amm/sdk'
import {
  convertToNativeTokenFromETH,
  useFarmRewardPerBlocks,
  getTradingFeeAPR,
  useFarmApr,
  useFarmRewards,
  useFarmRewardsUSD
} from 'utils/dmm'
import { useActiveWeb3React } from 'hooks'
import { useFarmsData } from 'state/farms/hooks'
import { useGlobalData } from 'state/about/hooks'
import { Farm } from 'state/farms/types'
import { isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { ethers } from 'ethers'
import { useBlockNumber } from 'state/application/hooks'
import { formatBigLiquidity } from 'utils/formatBalance'
import {
  Footer,
  FooterContainer,
  Wrapper,
  Powered,
  BtnOutlined,
  BtnPrimary,
  ForLiquidityProviderItem,
  TypicalAMM,
  KyberSwapSlippage,
  ForTrader,
  ForTraderInfo,
  ForTraderDivider,
  StatisticWrapper,
  StatisticItem,
  SupportedChain,
  AboutPage,
  ForTraderInfoShadow,
  GridWrapper,
  BackgroundBottom,
  VerticalDivider,
  CommittedToSecurityDivider
} from './styleds'
import TwitterIcon from 'components/Icons/TwitterIcon'
import Medium from 'components/Icons/Medium'
import Discord from 'components/Icons/Discord'
import { ButtonEmpty } from 'components/Button'

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
    case ChainId.FANTOM:
      return `/pools/FTM`
    default:
      return '/pools/ETH'
  }
}

function About() {
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
  const above992 = useMedia('(min-width: 992px)')
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { chainId } = useActiveWeb3React()
  const poolsMenuLink = getPoolsMenuLink(chainId)
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  const { data: farms } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farms).flat(), false)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

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

  return (
    <div style={{ position: 'relative', background: isDarkMode ? theme.buttonBlack : theme.white, width: '100%' }}>
      <AboutPage>
        <Wrapper>
          <Text as="h2" fontSize={['28px', '48px']} textAlign="center" lineHeight={['32px', '60px']} fontWeight="300">
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
              KyberSwap is DeFi’s first dynamic market maker, providing the best token rates for traders and maximizing
              returns for liquidity providers, in one decentralized platform
            </Trans>
          </Text>

          <SupportedChain>
            <Ethereum />
            <Polygon />
            <Binance />
            <Avalanche />
            <Fantom />
          </SupportedChain>

          <Flex
            justifyContent="center"
            maxWidth="456px"
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            <BtnPrimary as={Link} to="/swap">
              <Repeat />
              <Text fontSize={['16px', '20px']} marginLeft="8px">
                <Trans>Swap Now</Trans>
              </Text>
            </BtnPrimary>
            <BtnOutlined as={Link} to={poolsMenuLink}>
              <MoneyBag color={theme.btnOutline} />
              <Text fontSize={['16px', '20px']} marginLeft="8px">
                <Trans>Start Earning</Trans>
              </Text>
            </BtnOutlined>
          </Flex>

          <StatisticWrapper>
            <StatisticItem>
              <Text fontSize={['24px', '28px']} fontWeight={600}>
                {aggregatorData?.totalVolume ? formatBigLiquidity(aggregatorData.totalVolume, 2, true) : <Loader />}
              </Text>
              <Text color={theme.subText} marginTop="8px">
                <Trans>Total Trading Volume</Trans>*
              </Text>
            </StatisticItem>
            <Flex sx={{ gap: '16px' }} flex={2}>
              <StatisticItem>
                <Text fontSize={['24px', '28px']} fontWeight={600}>
                  {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
                </Text>
                <Text color={theme.subText} marginTop="8px">
                  <Trans>Total Value Locked</Trans>
                </Text>
              </StatisticItem>
              <StatisticItem>
                <Text fontSize={['24px', '28px']} fontWeight={600}>
                  {globalData ? formatBigLiquidity(globalData.totalAmplifiedLiquidityUSD, 2, true) : <Loader />}
                </Text>
                <Text color={theme.subText} marginTop="8px">
                  <Trans>Total AMP Liquidity</Trans>**
                </Text>
              </StatisticItem>
            </Flex>

            <Flex
              sx={{ gap: '16px' }}
              flex={
                maxApr[chainId as ChainId] >= 0 && totalRewardsUSD > 0
                  ? 2
                  : maxApr[chainId as ChainId] >= 0 || totalRewardsUSD > 0
                  ? 1
                  : 0
              }
            >
              {totalRewardsUSD > 0 && (
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {formatBigLiquidity(totalRewardsUSD.toString(), 2, true)}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>Total Earnings</Trans>
                  </Text>
                </StatisticItem>
              )}
              {maxApr[chainId as ChainId] >= 0 && (
                <StatisticItem>
                  <Text fontSize={['24px', '28px']} fontWeight={600}>
                    {maxApr[chainId as ChainId] >= 0 ? maxApr[chainId as ChainId].toFixed(2) + '%' : <Loader />}
                  </Text>
                  <Text color={theme.subText} marginTop="8px">
                    <Trans>Max APR Available</Trans>
                  </Text>
                </StatisticItem>
              )}
            </Flex>
          </StatisticWrapper>

          <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="12px" color={theme.subText}>
            *<Trans>Includes DEX aggregation</Trans>
          </Text>
          <Text fontStyle="italic" textAlign="right" fontSize="12px" marginTop="8px" color={theme.subText}>
            **<Trans>TVL equivalent compared to AMMs</Trans>
          </Text>

          <ForTrader>
            <Flex flex={1} flexDirection="column" height="max-content">
              <Text fontSize={['16px', '20px']} fontWeight={500} color={theme.primary}>
                <Trans>FOR TRADERS</Trans>
              </Text>
              <Text marginTop="12px" fontSize={['28px', '36px']}>
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
                <Text marginLeft="12px">Best price guaranteed</Text>
              </Flex>
              <Flex marginTop="20px" alignItems="center">
                <LowestSlippage />
                <Text marginLeft="12px">Lowest possible slippage</Text>
              </Flex>

              <Flex marginTop="20px" alignItems="center">
                <Clock />
                <Text marginLeft="12px">Save time & effort</Text>
              </Flex>

              {above500 && (
                <BtnPrimary margin="48px 0" width="216px" as={Link} to="/swap">
                  <Repeat />
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
                alt=""
                style={{ marginTop: above992 ? '0.25rem' : '40px' }}
              />
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
                        28+
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
                        5
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
            </Flex>
            {!above500 && (
              <BtnPrimary margin="40px 0" as={Link} to="/swap">
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
          <Text marginTop="12px" fontWeight="500" fontSize={['28px', '36px']} textAlign="center">
            <Trans>Earn more with your crypto assets</Trans>
          </Text>
          <Text color={theme.subText} marginTop={['40px', '48px']} fontSize="1rem" textAlign="center">
            <Trans>Earn fees and rewards by depositing your tokens into our pools.</Trans>
          </Text>

          {above500 ? (
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
          )}

          <Flex
            justifyContent="center"
            maxWidth="456px"
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            <BtnPrimary as={Link} to={poolsMenuLink}>
              <MoneyBag color={theme.textReverse} />
              <Text fontSize="16px" marginLeft="8px">
                <Trans>Start Earning</Trans>
              </Text>
            </BtnPrimary>
            <BtnOutlined as={Link} to="/farms">
              <FarmIcon color={theme.btnOutline} />
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
              <Text fontWeight="500" fontSize={['28px', '36px']}>
                Seamless liquidity.
              </Text>
              <Text fontWeight="500" fontSize={['28px', '36px']}>
                For everyone
              </Text>

              <Text color={theme.subText} marginTop={['40px', '48px']} lineHeight={1.5}>
                Anyone can provide liquidity to KyberSwap by depositing tokens e.g. Traders, Token Teams.
              </Text>
              <Text color={theme.subText} marginTop="24px" lineHeight={1.5}>
                Anyone can access this liquidity from KyberSwap for their own use case e.g. Dapps, Aggregators.
              </Text>
              <Text color={theme.subText} marginTop="24px" lineHeight={1.5}>
                Thousands of users and multiple decentralized applications are already providing and using our
                liquidity.
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
              <img src={SeamlessImg} style={{ flex: 1 }} width="100%" alt="" />
            </Flex>
          </Flex>

          <Flex
            sx={{ gap: '24px' }}
            marginTop={['40px', '48px']}
            flexDirection={above768 ? 'row' : 'column'}
            maxWidth="696px"
          >
            <BtnPrimary as={Link} to="/create">
              <Plus />
              <Text marginLeft="8px">Create New Pool</Text>
            </BtnPrimary>
            <Flex sx={{ gap: above768 ? '24px' : '16px' }} maxWidth="456px">
              <BtnOutlined as={ExternalLink} href="https://forms.gle/gLiNsi7iUzHws2BY8">
                <Edit color={theme.btnOutline} />
                <Text marginLeft="8px" fontSize="16px">
                  <Trans>Contact Us</Trans>
                </Text>
              </BtnOutlined>

              <BtnOutlined as={ExternalLink} href="https://docs.kyberswap.com/">
                <FileText color={theme.btnOutline} />
                <Text marginLeft="8px" fontSize="16px">
                  <Trans>Docs</Trans>
                </Text>
              </BtnOutlined>
            </Flex>
          </Flex>

          <Text marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
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
                  <ExternalLink href="https://chainsecurity.com/wp-content/uploads/2021/04/ChainSecurity_KyberNetwork_DMM_Dynamic-Market-Making_Final.pdf">
                    <img
                      src={
                        !isDarkMode
                          ? 'https://chainsecurity.com/wp-content/themes/chainsecurity-wp/resources/images/temp/logo.svg'
                          : require('../../assets/svg/chainsecurity.svg')
                      }
                      alt=""
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
                      alt=""
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
                  <ExternalLink href="https://github.com/dynamic-amm">
                    <img src={isDarkMode ? githubImg : githubImgLight} alt="" width="125px" />
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
                  alt=""
                  width={above992 ? '186px' : '140px'}
                />
              </div>
            </Flex>
          </Flex>

          <Text marginTop={['100px', '160px']} fontSize={['28px', '36px']} fontWeight="500" textAlign="center">
            <Trans>Powered by</Trans>

            <Powered
              marginTop="48px"
              justifyContent="center"
              alignItems="center"
              sx={{ gap: '52px' }}
              flexDirection={above992 ? 'row' : 'column'}
              width="100%"
            >
              <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '52px' }}>
                <Flex flex={1} alignItems="center">
                  <img
                    src={
                      isDarkMode
                        ? require('../../assets/svg/about_icon_kyber.svg')
                        : require('../../assets/svg/about_icon_kyber_light.svg')
                    }
                    alt=""
                    width="100%"
                  />
                </Flex>
                <Flex flex={1} alignItems="center">
                  <img
                    src={
                      isDarkMode
                        ? require('../../assets/svg/about_icon_ethereum.png')
                        : require('../../assets/svg/about_icon_ethereum_light.png')
                    }
                    alt=""
                    width="100%"
                  />
                </Flex>
              </Flex>
              <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '52px' }}>
                <Flex flex={1} alignItems="center">
                  <img src={require('../../assets/svg/about_icon_bsc.svg')} alt="" width="100%" />
                </Flex>
                <Flex flex={1} alignItems="center">
                  <img
                    src={
                      isDarkMode
                        ? require('../../assets/svg/about_icon_polygon.png')
                        : require('../../assets/svg/about_icon_polygon_light.svg')
                    }
                    alt=""
                    width="100%"
                  />
                </Flex>
              </Flex>

              <Flex flex={1} justifyContent="center" alignItems="center" sx={{ gap: '52px' }}>
                <Flex flex={1} alignItems="center">
                  <img src={require('../../assets/svg/about_icon_avalanche.svg')} alt="" width="100%" />
                </Flex>
                <Flex flex={1} alignItems="center">
                  <FantomLogoFull color={isDarkMode ? '#fff' : '#1969FF'} />
                </Flex>
              </Flex>
            </Powered>
          </Text>
        </Wrapper>
        {Object.values(farms)
          .flat()
          .map((farm, index) => index === indexx && <Apr key={farm.id} farm={farm} onAprUpdate={handleAprUpdate} />)}
      </AboutPage>
      <BackgroundBottom />
      <Footer background={isDarkMode ? theme.background : theme.white}>
        <FooterContainer>
          <Flex flexWrap="wrap" sx={{ gap: '12px' }} justifyContent="center">
            <ExternalLink href={`https://docs.kyberswap.com`}>
              <Trans>Docs</Trans>
            </ExternalLink>
            <VerticalDivider />
            <ExternalLink href={`https://github.com/dynamic-amm`}>
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
            <ExternalLink href={`https://kyber.network/about/knc`}>KNC</ExternalLink>
          </Flex>
          <Flex alignItems="center" justifyContent="center" sx={{ gap: '24px' }}>
            <ExternalLink href="https://t.me/kybernetwork">
              <Telegram size={16} color={theme.subText} />
            </ExternalLink>
            <ExternalLink href={KYBER_NETWORK_TWITTER_URL}>
              <TwitterIcon color={theme.subText} />
            </ExternalLink>
            <ExternalLink href={KYBER_NETWORK_DISCORD_URL}>
              <Discord />
            </ExternalLink>
            <ExternalLink href={`https://blog.kyber.network`}>
              <Medium />
            </ExternalLink>
          </Flex>
        </FooterContainer>
      </Footer>
    </div>
  )
}

export default About

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
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  useEffect(() => {
    if (farmAPR > 0) onAprUpdate(apr)
  }, [apr, onAprUpdate, farmAPR])
  return <></>
}
