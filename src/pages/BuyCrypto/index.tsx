import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowDown, ChevronDown, Repeat, X } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Image, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import applePay from 'assets/buy-crypto/apple-pay.svg'
import bankTransfer from 'assets/buy-crypto/bank-transfer.svg'
import buyNowImg from 'assets/buy-crypto/buy-now.png'
import gPay from 'assets/buy-crypto/google-pay.svg'
import introImg from 'assets/buy-crypto/intro.png'
import masterCard from 'assets/buy-crypto/master-card.svg'
import visa from 'assets/buy-crypto/visa.svg'
import ForTraderImage from 'assets/svg/for_trader.svg'
import ForTraderImageLight from 'assets/svg/for_trader_light.svg'
import SeamlessImg from 'assets/svg/seamless.svg'
import { ReactComponent as Brave } from 'assets/wallets-connect/brave.svg'
import c98 from 'assets/wallets-connect/coin98.svg'
import { ReactComponent as Coinbase } from 'assets/wallets-connect/coinbase.svg'
import { ReactComponent as Ledger } from 'assets/wallets-connect/ledger.svg'
import metamask from 'assets/wallets-connect/metamask.svg'
import walletConnect from 'assets/wallets-connect/wallet-connect.svg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import Cart from 'components/Icons/Cart'
import Deposit from 'components/Icons/Deposit'
import Modal from 'components/Modal'
import { TRANSAK_API_KEY, TRANSAK_URL } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { KSStatistic } from 'pages/About/AboutKyberSwap'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { ButtonText, ExternalLink } from 'theme'

const LedgerSVG = styled(Ledger)`
  path {
    fill: currentColor;
  }
`

const IntroWrapper = styled.div`
  background: radial-gradient(88.77% 152.19% at 12.8% -49.11%, #237c71 0%, #251c72 31%, #0f054c 100%);
  width: 100%;
  min-height: 100vh;
  display: flex;
`

const IntroContent = styled.div`
  max-width: 1200px;
  padding: 100px 24px 48px;
  margin: auto;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column-reverse;
    padding: 44px 16px 30px;
  `}
`

const StepItem = styled.div<{ active: boolean }>`
  cursor: pointer;
  border-radius: 50%;
  background: ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.border)};
  color: ${({ theme, active }) => (active ? theme.textReverse : theme.subText)};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`

const StepSeparator = styled.div<{ direction: 'vertical' | 'horizontal' }>`
  width: ${({ direction }) => (direction === 'vertical' ? '1px' : '16px')};
  height: ${({ direction }) => (direction === 'vertical' ? '16px' : '1px')};
  background: ${({ theme }) => theme.border};
`

const animation = keyframes`
  0% {
    transform: translate(0, 0);
  }
  20% {
    transform: translate(0, 10px);
  }
  40% {
    transform: translate(0, 0);
  }
`

const ScrollDownBtn = styled(ButtonText)`
  animation: ${animation} 1.5s infinite;
`

const DownloadWalletWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  width: 100%;
  min-height: 100vh;
  display: flex;
`

const DownloadWalletContent = styled(IntroContent)`
  padding: 120px 24px 48px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    padding: 80px 16px 30px;
  `}
`

const Address = styled.div`
  max-width: calc(100vw - 32px);
  gap: 4px;
  display: flex;
  border-radius: 999px;
  padding: 14px 18px;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  margin-top: 16px;
  width: fit-content;
`

const DownloadWalletRow = styled.a`
  display: flex;
  gap: 8px;
  border-radius: 999px;
  padding: 12px 16px;
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  font-weight: 500;
  background: ${({ theme }) => theme.buttonBlack};
  line-height: 24px;
  text-decoration: none;

  :hover {
    background: ${({ theme }) => rgba(theme.buttonBlack, 0.6)};
  }
`

const Step = ({
  currentStep = 1,
  direction = 'vertical',
  onStepClick,
}: {
  currentStep: 1 | 2 | 3 | 4
  direction: 'vertical' | 'horizontal'
  onStepClick: (step: number) => void
}) => {
  const steps = [1, 2, 3, 4]
  return (
    <Flex
      width="fit-content"
      flexDirection={direction === 'vertical' ? 'column' : 'row'}
      sx={{ gap: '4px' }}
      alignItems="center"
      justifyContent="center"
    >
      {steps.map((item, index) => (
        <React.Fragment key={item}>
          <StepItem role="button" active={currentStep === item} onClick={() => onStepClick(item)}></StepItem>
          {index !== steps.length - 1 && <StepSeparator direction={direction} />}
        </React.Fragment>
      ))}
    </Flex>
  )
}

function BuyCrypto() {
  const theme = useTheme()

  const upToMedium = useMedia('(max-width: 992px)')
  const upToSmall = useMedia('(max-width: 768px)')

  const { account, chainId, networkInfo } = useActiveWeb3React()

  const toggleWalletModal = useWalletModalToggle()

  const step0Ref = useRef<HTMLDivElement>(null)
  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)

  const supportedNetworks: { [chain in ChainId]: string | null } = {
    [ChainId.MAINNET]: 'ethereum',
    [ChainId.MATIC]: 'polygon',
    [ChainId.ARBITRUM]: 'arbitrum',
    [ChainId.OPTIMISM]: 'optimism',
    [ChainId.BSCMAINNET]: 'bsc',
    [ChainId.AVAXMAINNET]: 'avaxcchain',
    [ChainId.FANTOM]: 'fantom',
    [ChainId.VELAS]: 'velasevm',
    [ChainId.SOLANA]: 'solana',

    [ChainId.CRONOS]: null,
    [ChainId.GÖRLI]: null,
    [ChainId.MUMBAI]: null,
    [ChainId.BSCTESTNET]: null,
    [ChainId.AVAXTESTNET]: null,
    [ChainId.ARBITRUM_TESTNET]: null,
    [ChainId.BTTC]: null,
    [ChainId.AURORA]: null,
    [ChainId.OASIS]: null,
    [ChainId.ETHW]: null,
  }
  const supportedCurrencies = [
    'AVAX',
    'USDC',
    'ETH',
    'USDS',
    'BNB',
    'BUSD',
    'DAI',
    'USDT',
    'WBTC',
    'FTM',
    'MATIC',
    'WETH',
    'VLX',
    'SOL',
  ]

  const redirectURL = window.location.hostname.includes('localhost')
    ? 'https://kyberswap.com/swap'
    : window.location.origin + '/swap'
  const transakUrl = `${TRANSAK_URL}?apiKey=${TRANSAK_API_KEY}&cryptoCurrencyList=${supportedCurrencies.join(
    ',',
  )}&networks=${Object.values(supportedNetworks).filter(Boolean).join(',')}${
    account ? `&walletAddress=${account}` : ''
  }&defaultNetwork=${
    supportedNetworks[chainId] || supportedNetworks[ChainId.MAINNET]
  }&excludeFiatCurrencies=SGD&redirectURL=${redirectURL}`

  const [isDarkMode] = useDarkModeManager()
  const { mixpanelHandler } = useMixpanel()

  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const handleStepClick = (value: number) => {
    switch (value) {
      case 1:
        step0Ref.current?.scrollIntoView({ behavior: 'smooth' })
        break
      case 2:
        step1Ref.current?.scrollIntoView({ behavior: 'smooth' })
        break

      case 3:
        step2Ref.current?.scrollIntoView({ behavior: 'smooth' })
        break

      case 4:
        step3Ref.current?.scrollIntoView({ behavior: 'smooth' })
        break

      default:
        break
    }
  }

  const qs = useParsedQueryString<{ step?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => {
      const { step, ...rest } = qs
      const stepNumber = Number(step)
      if (!isNaN(stepNumber)) {
        handleStepClick(stepNumber)
        navigate({ search: stringify(rest) }, { replace: true })
      }
    }, 500)
  }, [qs, navigate])

  return (
    <>
      <Modal isOpen={showDownloadModal} onDismiss={() => setShowDownloadModal(false)} maxWidth="512px">
        <Flex width="100%" padding="30px 24px" flexDirection="column">
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="20px" fontWeight="500">
              <Trans>Download a Wallet</Trans>
            </Text>

            <ButtonText onClick={() => setShowDownloadModal(false)} style={{ lineHeight: 0 }}>
              <X size={24} color={theme.text} />
            </ButtonText>
          </Flex>

          <Flex sx={{ gap: '20px' }} marginTop="24px" flexDirection="column" justifyContent="center">
            {Object.values(SUPPORTED_WALLETS)
              .filter(e => e.installLink)
              .map(item => (
                <DownloadWalletRow
                  key={item.installLink}
                  href={item.installLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image width="24px" src={isDarkMode ? item.icon : item.iconLight} />
                  {item.name}
                </DownloadWalletRow>
              ))}
          </Flex>
        </Flex>
      </Modal>

      <IntroWrapper ref={step0Ref}>
        <IntroContent>
          {!upToMedium && <Step currentStep={1} direction="vertical" onStepClick={handleStepClick} />}

          <Flex flexDirection="column" marginLeft={!upToMedium ? '68px' : 0}>
            <Flex
              flex={1}
              alignItems="center"
              flexDirection={upToMedium ? 'column-reverse' : 'row'}
              data-aos="fade-right"
            >
              <Flex flexDirection="column" flex={1}>
                <Text
                  color={'white'}
                  fontSize={upToMedium ? '28px' : '44px'}
                  lineHeight={upToMedium ? '32px' : '60px'}
                  marginTop={upToMedium ? '40px' : undefined}
                >
                  <Trans>Buy crypto easily with over 50+ currencies</Trans>
                </Text>

                <Text
                  color={'#A7B6BD'}
                  fontSize={upToMedium ? '16px' : '20px'}
                  lineHeight={upToMedium ? '24px' : '28px'}
                  marginTop={upToMedium ? '40px' : '48px'}
                >
                  You can now seamlessly buy 100+ cryptocurrencies on over 10+ blockchains using a wide range of payment
                  options!
                </Text>

                <Flex sx={{ gap: '28px' }} marginTop="24px">
                  <Image src={visa} width={upToSmall ? '36px' : '64px'} />
                  <Image src={masterCard} width={upToSmall ? '36px' : '64px'} />
                  <Image src={gPay} width={upToSmall ? '36px' : '64px'} />
                  <Image src={applePay} width={upToSmall ? '36px' : '64px'} />
                  <Image src={bankTransfer} width={upToSmall ? '36px' : '64px'} />
                </Flex>

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '48px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  onClick={() => step1Ref?.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Get Started</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>

              <Flex sx={{ flex: 1, marginLeft: upToSmall ? 'auto' : '48px', maxWidth: upToMedium ? '252px' : '496px' }}>
                <Image src={introImg} data-aos="zoom-in-left" />
              </Flex>
            </Flex>

            <Flex justifyContent="space-between" marginTop={upToMedium ? '42px' : '64px'}>
              <ScrollDownBtn
                onClick={() => {
                  step1Ref?.current?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
              >
                {upToMedium ? (
                  <ChevronDown size={36} color={theme.subText} />
                ) : (
                  <ArrowDown size={48} color={theme.subText} />
                )}
              </ScrollDownBtn>

              {upToMedium && <Step direction="horizontal" currentStep={1} onStepClick={handleStepClick} />}
            </Flex>
          </Flex>
        </IntroContent>
      </IntroWrapper>
      <DownloadWalletWrapper ref={step1Ref}>
        <DownloadWalletContent>
          <Flex flexDirection="column">
            <Flex alignItems="center">
              {!upToMedium && (
                <>
                  <Step direction="vertical" currentStep={2} onStepClick={handleStepClick} />
                  <Image src={SeamlessImg} marginLeft="68px" maxWidth="496px" data-aos="zoom-in-right" flex={1} />
                </>
              )}
              <Flex flexDirection="column" marginLeft={!upToMedium ? '48px' : 0} data-aos="fade-left" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 1</Trans>
                </Text>
                <Text fontSize={upToMedium ? '28px' : '36px'} fontWeight="500" marginTop="8px">
                  <Trans>Download a wallet</Trans>
                </Text>
                <Text color={theme.subText} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  <Trans>
                    A cryptocurrency wallet gives you access to your digital tokens and acts as a gateway to many
                    blockchain applications like KyberSwap. You can buy, store, send and swap tokens using this wallet.
                    <br />
                    <br />
                    On KyberSwap we support a list of wallets including: MetaMask, Coin98, Wallet Connect, Coinbase
                    Wallet, Ledger and others
                  </Trans>
                </Text>

                <Flex sx={{ gap: upToMedium ? '28px' : '40px' }} marginTop="28px">
                  <Image src={metamask} width={upToSmall ? '36px' : '48px'} />
                  <Image src={c98} width={upToSmall ? '36px' : '48px'} />
                  <Image src={walletConnect} width={upToSmall ? '36px' : '48px'} />
                  <Coinbase width={upToSmall ? '36px' : '48px'} />
                  <LedgerSVG width={upToSmall ? '36px' : '48px'} />
                  <Brave width={upToSmall ? '36px' : '48px'} height="48px" />
                </Flex>

                <Flex margin={upToMedium ? '40px 0 0' : '48px 0 0'} sx={{ gap: '24px' }}>
                  <ButtonPrimary
                    style={{ flex: upToSmall ? 2 : 1 }}
                    width={upToSmall ? '100%' : '50%'}
                    padding="10px"
                    onClick={() => {
                      mixpanelHandler(MIXPANEL_TYPE.TRANSAK_DOWNLOAD_WALLET_CLICKED)
                      setShowDownloadModal(true)
                    }}
                  >
                    <Deposit width={24} height={24} />
                    <Text fontSize="14px" marginLeft="8px">
                      <Trans>Download Wallet</Trans>
                    </Text>
                  </ButtonPrimary>
                  <ButtonLight
                    style={{ flex: 1 }}
                    onClick={() => {
                      step2Ref?.current?.scrollIntoView({
                        behavior: 'smooth',
                      })
                    }}
                  >
                    <Text fontSize="14px">
                      <Trans>{!upToMedium ? 'Already have a wallet? ' : ' '}Skip</Trans>
                    </Text>
                  </ButtonLight>
                </Flex>
              </Flex>
            </Flex>

            <Flex>
              {!upToMedium && <Flex flex={1} marginLeft="68px" />}
              <Flex
                justifyContent="space-between"
                marginTop={upToMedium ? '42px' : '64px'}
                flex={1}
                marginLeft={!upToMedium ? '48px' : 0}
              >
                <ScrollDownBtn
                  onClick={() => {
                    step2Ref?.current?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }}
                >
                  {upToMedium ? (
                    <ChevronDown size={36} color={theme.subText} />
                  ) : (
                    <ArrowDown size={48} color={theme.subText} />
                  )}
                </ScrollDownBtn>

                {upToMedium && <Step direction="horizontal" currentStep={2} onStepClick={handleStepClick} />}
              </Flex>
            </Flex>
          </Flex>
        </DownloadWalletContent>
      </DownloadWalletWrapper>

      <IntroWrapper ref={step2Ref}>
        <IntroContent>
          {!upToMedium && <Step currentStep={3} direction="vertical" onStepClick={handleStepClick} />}

          <Flex flexDirection="column" marginLeft={!upToMedium ? '68px' : 0}>
            <Flex
              flex={1}
              alignItems="center"
              flexDirection={upToMedium ? 'column-reverse' : 'row'}
              data-aos="fade-right"
            >
              <Flex flexDirection="column" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 2</Trans>
                </Text>

                <Text color={'white'} fontSize={upToMedium ? '28px' : '44px'} lineHeight={upToMedium ? '32px' : '60px'}>
                  <Trans>Buy Crypto</Trans>
                </Text>

                <Text color={'#A7B6BD'} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  Note: Clicking &quot;Buy Crypto&quot; will bring you to a third party website, owned and operated by
                  an independent party over which KyberSwap has no control (&quot;
                  <ExternalLink href="https://app.transak.com/">Third Party Website</ExternalLink>&quot;).
                  <br />
                  <br />
                  For support, please contact Transak{' '}
                  <ExternalLink href="https://support.transak.com/">here</ExternalLink>
                </Text>

                <Text color={'#A7B6BD'} marginTop="24px">
                  Your wallet address
                </Text>

                {!account ? (
                  <ButtonLight margin={'16px 0 0'} width={upToSmall ? '100%' : '50%'} onClick={toggleWalletModal}>
                    Connect your wallet
                  </ButtonLight>
                ) : (
                  <Address>
                    <Text
                      flex={1}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {account}
                    </Text>
                    <CopyHelper toCopy={account} />
                  </Address>
                )}

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '44px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  as="a"
                  target="popup"
                  href={transakUrl}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.TRANSAK_BUY_CRYPTO_CLICKED)
                    const w = 500
                    const h = 625
                    const left = window.innerWidth / 2 - w / 2
                    const top = window.innerHeight / 2 - h / 2
                    window.open(transakUrl, 'popup', `width=${w},height=${h},top=${top},left=${left}`)
                    return false
                  }}
                >
                  <Cart />
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Buy Crypto</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>

              <Flex
                sx={{
                  flex: 1,
                  marginLeft: upToSmall ? 'auto' : '48px',
                  maxWidth: upToMedium ? '252px' : '496px',
                }}
              >
                <Image src={buyNowImg} data-aos="zoom-in-left" />
              </Flex>
            </Flex>

            <Flex justifyContent="space-between" marginTop={upToMedium ? '42px' : '64px'}>
              <ScrollDownBtn
                onClick={() => {
                  step3Ref?.current?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
              >
                {upToMedium ? (
                  <ChevronDown size={36} color={theme.subText} />
                ) : (
                  <ArrowDown size={48} color={theme.subText} />
                )}
              </ScrollDownBtn>

              {upToMedium && <Step direction="horizontal" currentStep={3} onStepClick={handleStepClick} />}
            </Flex>
          </Flex>
        </IntroContent>
      </IntroWrapper>

      <DownloadWalletWrapper>
        <DownloadWalletContent ref={step3Ref}>
          <Flex flexDirection="column">
            <Flex alignItems="center">
              {!upToMedium && (
                <>
                  <Step direction="vertical" currentStep={4} onStepClick={handleStepClick} />
                  <Flex>
                    <Image
                      src={isDarkMode ? ForTraderImage : ForTraderImageLight}
                      marginLeft="68px"
                      maxWidth="496px"
                      data-aos="zoom-in-right"
                      flex={1}
                    />
                  </Flex>
                </>
              )}
              <Flex flexDirection="column" marginLeft={!upToMedium ? '48px' : 0} data-aos="fade-left" flex={1}>
                <Text color={theme.primary} fontSize="16px" fontWeight="500">
                  <Trans>Step 3</Trans>
                </Text>
                <Text fontSize={upToMedium ? '28px' : '36px'} fontWeight="500" marginTop="8px">
                  <Trans>Swap on KyberSwap</Trans>
                </Text>
                <Text color={theme.subText} lineHeight={1.5} marginTop={upToMedium ? '40px' : '48px'}>
                  <Trans>
                    Now that you have purchased your crypto, you can trade from over 20,000+ tokens on KyberSwap! We
                    give you the best trading rates in the market!
                  </Trans>
                </Text>

                <KSStatistic />

                <ButtonPrimary
                  margin={upToMedium ? '40px 0 0' : '48px 0 0'}
                  width={upToSmall ? '100%' : '50%'}
                  padding="10px"
                  as={Link}
                  to={APP_PATHS.SWAP + '/' + networkInfo.route}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.TRANSAK_SWAP_NOW_CLICKED)
                  }}
                >
                  <Repeat size={24} />
                  <Text fontSize="14px" marginLeft="8px">
                    <Trans>Swap Now</Trans>
                  </Text>
                </ButtonPrimary>
              </Flex>
            </Flex>

            {upToMedium && (
              <Flex marginTop="40px" justifyContent="flex-end">
                <Step direction="horizontal" currentStep={4} onStepClick={handleStepClick} />
              </Flex>
            )}
          </Flex>
        </DownloadWalletContent>
      </DownloadWalletWrapper>
    </>
  )
}

export default BuyCrypto
