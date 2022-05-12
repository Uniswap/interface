import { Trans } from '@lingui/macro'
import KNCGraphic from 'assets/images/knc-graphic.png'
import CoinGecko from 'assets/svg/coingecko_color.svg'
import CoinGeckoLight from 'assets/svg/coingecko_color_light.svg'
import CoinMarketCap from 'assets/svg/coinmarketcap.svg'
import CoinMarketCapLight from 'assets/svg/coinmarketcap_light.svg'
import KyberDaoLight from 'assets/svg/kyber-dao-light.svg'
import KyberDao from 'assets/svg/kyber-dao.svg'
import RocketIcon from 'assets/svg/rocket.svg'
import TrophyIcon from 'assets/svg/trophy.svg'
import { FooterSocialLink } from 'components/Footer/Footer'
import { BestPrice } from 'components/Icons'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import React from 'react'
import { Archive, Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useDarkModeManager } from 'state/user/hooks'
import { Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'
import { ExternalLink } from 'theme'
import {
  AboutPage,
  BtnPrimary,
  Exchange,
  ExchangeWrapper,
  Footer,
  FooterContainer,
  ForLiquidityProviderItem,
  GridWrapper,
  MoreInfoWrapper,
  VerticalDivider,
  Wrapper,
} from './styleds'
import {
  Binance,
  Krystal,
  KyberSwap,
  FTX,
  Etoro,
  Huobi,
  Kraken,
  Okex,
  Bithumb,
  Gemini,
  TokyoCrypto,
  Upbit,
  Kucoin,
  Gate,
  Wazirx,
} from 'components/ExchangeIcons'

const LIST_EXCHANGES = [
  { name: 'KyberSwap', logo: <KyberSwap /> },
  { name: 'Krystal', logo: <Krystal /> },
  { name: 'Binance', logo: <Binance /> },
  { name: 'FTX', logo: <FTX /> },
  { name: 'Etoro', logo: <Etoro /> },
  { name: 'Huobi', logo: <Huobi /> },
  { name: 'Upbit', logo: <Upbit /> },
  { name: 'Kraken', logo: <Kraken /> },
  { name: 'Kucoin', logo: <Kucoin /> },
  { name: 'Gate', logo: <Gate /> },
  { name: 'Okex', logo: <Okex /> },
  { name: 'Bithumb', logo: <Bithumb /> },
  { name: 'Gemini', logo: <Gemini /> },
  { name: 'Wazirx', logo: <Wazirx /> },
  { name: 'TokyoCrypto', logo: <TokyoCrypto /> },
]

const LIST_WALLETS = [
  { logo: 'ledger', lightLogo: 'ledger_light' },
  { logo: 'metamask', lightLogo: 'metamask_light' },
  { logo: 'coin98', lightLogo: 'coin98' },
  { logo: 'krystal', lightLogo: 'krystal_light' },
  { logo: 'trezor', lightLogo: 'trezor_light' },
  { logo: 'mew', lightLogo: 'mew' },
  { logo: 'trust', lightLogo: 'trust_light' },
  { logo: 'enjin', lightLogo: 'enjin' },
  { logo: 'torus', lightLogo: 'torus' },
  { logo: 'argent', lightLogo: 'argent_light' },
  { logo: 'eidoo', lightLogo: 'eidoo' },
]

function AboutKNC() {
  const theme = useTheme()
  const [isDarkMode] = useDarkModeManager()
  const above768 = useMedia('(min-width: 768px)')
  const above500 = useMedia('(min-width: 500px)')

  const { mixpanelHandler } = useMixpanel()

  const DynamicTokenModel = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
      minHeight="360px"
    >
      <img width="64px" src={RocketIcon} alt="rocket_icon" />
      <Text
        marginTop="28px"
        fontWeight="500"
        fontSize="16"
        color={theme.primary}
        style={{ textTransform: 'uppercase' }}
      >
        <Trans>Dynamic Token Model</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          KNC enables KyberDAO to shape token behaviour and upgrades, making KNC much more adaptable and providing
          better support for innovation and growth.
        </Trans>
      </Text>
    </ForLiquidityProviderItem>
  )

  const ParticipationRewards = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
      minHeight="360px"
    >
      <img width="64px" src={TrophyIcon} alt="trophy_icon" />
      <Text
        marginTop="28px"
        fontWeight="500"
        fontSize="16"
        color={theme.primary}
        style={{ textTransform: 'uppercase' }}
      >
        <Trans>Participation Rewards</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          KNC holders can stake KNC in KyberDAO and vote on important decisions. Voters receive trading fees generated
          on KyberSwap and other benefits from ecosystem collaborations on Kyber.
        </Trans>
      </Text>
    </ForLiquidityProviderItem>
  )

  const LiquidityIncentitives = ({ width }: { width?: string }) => (
    <ForLiquidityProviderItem
      flexDirection="column"
      flex={1}
      alignItems={above768 ? 'flex-start' : 'center'}
      width={width}
      minHeight="360px"
    >
      <BestPrice size={64} />
      <Text marginTop="28px" fontWeight="500" color={theme.primary}>
        <Trans>LIQUIDITY INCENTIVES</Trans>
      </Text>

      <Text color={theme.subText} marginTop="24px" textAlign={above500 ? 'start' : 'center'} lineHeight={1.5}>
        <Trans>
          KyberDAO can propose various KNC incentives like liquidity mining rewards on KyberSwap on top of standard
          trading fees to provide more value to liquidity providers.
        </Trans>
      </Text>
    </ForLiquidityProviderItem>
  )

  return (
    <div style={{ position: 'relative', background: isDarkMode ? theme.buttonBlack : theme.white, width: '100%' }}>
      <AboutPage>
        <Wrapper>
          <Text as="h1" fontSize={['28px', '48px']} textAlign="center" lineHeight={['32px', '60px']} fontWeight="300">
            <Trans>
              Kyber Network Crystal{' '}
              <Text fontWeight="500" color={theme.primary} as="span">
                (KNC)
              </Text>
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
              KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap -
              the multi-chain decentralized exchange (DEX) protocol that provides the best rates for traders and highest
              passive income for liquidity providers
            </Trans>
          </Text>

          <Text
            color={theme.primary}
            marginTop={['100px', '160px']}
            fontWeight="500"
            fontSize={'20px'}
            textAlign="center"
          >
            <Trans>TOKEN UTILITY</Trans>
          </Text>
          <Text as="h2" marginTop="12px" fontWeight="500" fontSize={['28px', '36px']} textAlign="center">
            <Trans>What is KNC used for?</Trans>
          </Text>
          <Text color={theme.subText} marginTop={['40px', '48px']} fontSize="1rem" textAlign="center">
            <Trans>
              KNC allows token holders to play a critical role in building a wide base of stakeholders and capturing
              value created by products like KyberSwap on Kyber Network. KNC holders stake and vote to receive trading
              fees from protocols like KyberSwap. As more trades are executed on KyberSwap, more rewards are generated
              for KNC holders.
            </Trans>
          </Text>
          <Text color={theme.subText} marginTop={['20px', '24px']} fontSize="1rem" textAlign="center">
            <Trans>
              KNC is dynamic and can be upgraded, minted, or burned by KyberDAO to better support liquidity and growth.
              Holding KNC means having a stake in all the important innovation and liquidity protocols created for DeFi.
            </Trans>
          </Text>

          {above768 ? (
            <Flex sx={{ gap: '24px' }} marginTop={['40px', '48px']} flexDirection="row">
              <ParticipationRewards width="392px" />
              <DynamicTokenModel width="392px" />
              <LiquidityIncentitives width="392px" />
            </Flex>
          ) : (
            <GridWrapper>
              <ParticipationRewards />
              <DynamicTokenModel />
              <LiquidityIncentitives />
            </GridWrapper>
          )}

          <Flex
            justifyContent="center"
            width={above768 ? '236px' : '100%'}
            margin="auto"
            marginTop={['40px', '48px']}
            sx={{ gap: above768 ? '24px' : '16px' }}
          >
            <BtnPrimary
              width="216px"
              as={Link}
              to="/swap"
              onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
            >
              <Repeat />
              <Text fontSize="16px" marginLeft="8px">
                <Trans>Swap Now</Trans>
              </Text>
            </BtnPrimary>
          </Flex>

          <Flex
            sx={{ gap: '24px' }}
            marginTop={['100px', '160px']}
            alignItems="center"
            flexDirection={above768 ? 'row' : 'column'}
          >
            <img
              width="85%"
              src={isDarkMode ? KyberDao : KyberDaoLight}
              alt="KyberDao"
              style={{ display: above768 ? 'block' : 'none' }}
            />
            <Flex width="100%" flexDirection="column" height="max-content">
              <Text fontSize={['20px', '24px']} fontWeight={500} color={theme.primary}>
                <Trans>KYBER DAO</Trans>
              </Text>
              <Text as="h2" marginTop="12px" fontWeight="500" fontSize={['28px', '36px']}>
                <Trans>Stake KNC, Vote, Earn Rewards.</Trans>
              </Text>
              <Text
                fontSize="16px"
                marginTop={['40px', '48px']}
                color={theme.subText}
                lineHeight="24px"
                textAlign="left"
              >
                <Trans>
                  KyberDAO is a community platform that allows KNC token holders to participate in governance. KNC
                  holders can stake KNC to vote on proposals. In return, they receive rewards from fees generated on
                  KyberSwap through trading activities in Kyber Network.
                </Trans>
              </Text>
              <img
                width="100%"
                src={KyberDao}
                alt="KyberDao"
                style={{ display: above768 ? 'none' : 'block', marginTop: '40px' }}
              />
              <ExternalLink href="https://kyber.org/vote">
                <Flex
                  width={above768 ? '236px' : '100%'}
                  marginTop={['40px', '48px']}
                  sx={{ gap: above768 ? '24px' : '16px' }}
                  justifyContent="center"
                >
                  <BtnPrimary>
                    <Archive />
                    <Text fontSize="16px" marginLeft="8px">
                      <Trans>Stake KNC</Trans>
                    </Text>
                  </BtnPrimary>
                </Flex>
              </ExternalLink>
            </Flex>
          </Flex>
          <Text
            as="h2"
            fontWeight="500"
            marginTop={above768 ? '160px' : '100px'}
            fontSize={['28px', '36px']}
            textAlign="center"
          >
            <Trans>Where you can buy KNC</Trans>
          </Text>

          {above768 ? (
            <Exchange>
              {LIST_EXCHANGES.map(exchange => (
                <Flex key={exchange.name} margin="auto">
                  {exchange.logo}
                </Flex>
              ))}
            </Exchange>
          ) : (
            <Swiper
              slidesPerView={1}
              spaceBetween={30}
              modules={[Pagination]}
              loop={true}
              pagination={{
                clickable: true,
              }}
              style={{ marginTop: '24px' }}
            >
              {LIST_EXCHANGES.map(exchange => (
                <SwiperSlide key={exchange.logo}>
                  <ExchangeWrapper background={isDarkMode ? '#243036' : '#F5F5F5'}>
                    <Flex margin="auto">{exchange.logo}</Flex>
                  </ExchangeWrapper>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
          <Text
            as="h2"
            fontWeight="500"
            marginTop={above768 ? '160px' : '100px'}
            fontSize={['28px', '36px']}
            textAlign="center"
          >
            <Trans>Where you can store KNC</Trans>
          </Text>
          <Text fontSize="16px" marginTop={['40px', '48px']} color={theme.subText} lineHeight="24px" textAlign="center">
            <Trans>
              KNC is an ERC-20 token, so it can be stored in many Web3 wallets you control. Below are some examples.
            </Trans>
          </Text>

          {above768 ? (
            <Exchange>
              {LIST_WALLETS.map(wallet => (
                <img
                  key={wallet.logo}
                  src={require(`../../assets/wallets/${isDarkMode ? wallet.logo : wallet.lightLogo}.svg`)}
                  alt={wallet.logo}
                  style={{ margin: 'auto' }}
                />
              ))}
            </Exchange>
          ) : (
            <Swiper
              slidesPerView={1}
              spaceBetween={30}
              modules={[Pagination]}
              loop={true}
              pagination={{
                clickable: true,
              }}
              style={{ marginTop: '24px' }}
            >
              {LIST_WALLETS.map(wallet => (
                <SwiperSlide key={wallet.logo}>
                  <ExchangeWrapper background={isDarkMode ? '#243036' : '#F5F5F5'}>
                    <img
                      src={require(`../../assets/wallets/${isDarkMode ? wallet.logo : wallet.lightLogo}.svg`)}
                      alt={wallet.logo}
                      width="160px"
                      style={{ margin: 'auto' }}
                    />
                  </ExchangeWrapper>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          <MoreInfoWrapper background={isDarkMode ? '#243036' : '#F5F5F5'}>
            <Flex
              marginRight={above768 ? '180px' : '0px'}
              alignItems={!above768 ? 'center' : 'flex-start'}
              flexDirection={'column'}
            >
              <Text as="h2" fontWeight="500" fontSize={['28px', '36px']}>
                <Trans>More information about KNC is available on:</Trans>
              </Text>
              <Flex flexDirection={above768 ? 'row' : 'column'} marginTop="48px" style={{ gap: '48px' }}>
                <ExternalLink href={`https://www.coingecko.com/en/coins/kyber-network-crystal`}>
                  <img src={isDarkMode ? CoinGecko : CoinGeckoLight} alt="CoinGecko" width="165px" />
                </ExternalLink>
                <ExternalLink href={`https://coinmarketcap.com/currencies/kyber-network-crystal-v2/`}>
                  <img src={isDarkMode ? CoinMarketCap : CoinMarketCapLight} alt="CoinMarketCap" width="227px" />
                </ExternalLink>
              </Flex>
            </Flex>
            <img width={above768 ? '218px' : '287px'} src={KNCGraphic} alt="KNCGraphic" />
          </MoreInfoWrapper>
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
            <ExternalLink href={`https://kyber.network/about/knc`}>KNC</ExternalLink>
          </Flex>
          <FooterSocialLink />
        </FooterContainer>
      </Footer>
    </div>
  )
}

export default AboutKNC
