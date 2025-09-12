import { ReactComponent as UniswapLogo } from 'assets/svg/uniswap_app_logo.svg'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { hideMobileAppPromoBannerAtom, persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { Anchor, Flex, styled, Text, useSporeColors } from 'ui/src'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { getWalletMeta } from 'utils/walletMeta'

const Wrapper = styled(Flex, {
  height: 56,
  width: '100%',
  backgroundColor: '$accent2',
  pl: '$spacing12',
  pr: '$spacing16',
  zIndex: '$sticky',
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  display: 'none',
  $md: { display: 'flex' },
})

const StyledButton = styled(Anchor, {
  height: '$spacing28',
  background: '$accent1',
  borderRadius: '$rounded16',
  p: '$spacing8',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  textDecorationLine: 'none',
})

/**
 * We show the mobile app promo banner if:
 * - The user is on a mobile device our app supports
 * - The user is not using Safari (since we don't want to conflict with the Safari-native Smart App Banner)
 * - The user has not dismissed the banner during this session
 * - The user has not clicked the Uniswap wallet or Get Uniswap Wallet buttons in wallet options
 */
export function useMobileAppPromoBannerEligible(): boolean {
  const hideMobileAppPromoBanner = useAtomValue(hideMobileAppPromoBannerAtom)
  const persistHideMobileAppPromoBanner = useAtomValue(persistHideMobileAppPromoBannerAtom)
  return (isWebIOS || isWebAndroid) && !hideMobileAppPromoBanner && !persistHideMobileAppPromoBanner
}

const UNIVERSAL_DOWNLOAD_LINK = 'https://uniswapwallet.onelink.me/8q3y/39b0eeui'

function getDownloadLink(userAgent: string, peerWalletAgent?: string): string {
  if (userAgent.includes('MetaMaskMobile')) {
    return 'https://uniswapwallet.onelink.me/8q3y/ee713xnh'
  }
  if (userAgent.includes('Phantom')) {
    return 'https://uniswapwallet.onelink.me/8q3y/sjdi6xky'
  }
  if (userAgent.includes('OKApp')) {
    return 'https://uniswapwallet.onelink.me/8q3y/7i8g60sb'
  }
  if (userAgent.includes('BitKeep')) {
    return 'https://uniswapwallet.onelink.me/8q3y/93vro3iq'
  }
  if (userAgent.includes('DeFiWallet')) {
    return 'https://uniswapwallet.onelink.me/8q3y/ay1z22ab'
  }
  if (userAgent.includes('1inchWallet')) {
    return 'https://uniswapwallet.onelink.me/8q3y/03e2c5cw'
  }
  if (userAgent.includes('RHNCW')) {
    return 'https://uniswapwallet.onelink.me/8q3y/ipq1dx4n'
  }
  if (peerWalletAgent?.includes('CoinbaseWallet CoinbaseBrowser')) {
    return 'https://uniswapwallet.onelink.me/8q3y/24xpl5zh'
  }
  return UNIVERSAL_DOWNLOAD_LINK
}

export function MobileAppPromoBanner() {
  const { t } = useTranslation()
  const [, setHideMobileAppPromoBanner] = useAtom(hideMobileAppPromoBannerAtom)
  const colors = useSporeColors()

  const provider = useEthersWeb3Provider()

  const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined

  return (
    <Wrapper>
      <Flex shrink row gap="$spacing8" alignItems="center">
        <X
          data-testid="mobile-promo-banner-close-button"
          size={20}
          color={colors.neutral2.val}
          onClick={() => {
            setHideMobileAppPromoBanner(true)
          }}
        />
        <UniswapLogo width="32px" height="32px" />
        <Flex shrink>
          <Text variant="body3">{t('mobileAppPromo.banner.title')}</Text>
          <Text variant="body4" color="$neutral2">
            {t('mobileAppPromo.banner.getTheApp.link')}
          </Text>
        </Flex>
      </Flex>
      <StyledButton href={getDownloadLink(navigator.userAgent, peerWalletAgent)}>
        <Text variant="buttonLabel3" color="white" whiteSpace="nowrap">
          {t('common.getApp')}
        </Text>
      </StyledButton>
    </Wrapper>
  )
}
