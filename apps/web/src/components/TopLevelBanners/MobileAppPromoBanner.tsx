import { ReactComponent as UniswapLogo } from 'assets/svg/uniswap_app_logo.svg'
import Column from 'components/Column'
import Row from 'components/Row'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { hideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { getWalletMeta } from 'utils/walletMeta'

const Wrapper = styled.div`
  height: 56px;
  width: 100%;
  background-color: ${({ theme }) => theme.accent2};
  padding: 10px 16px 10px 12px;
  z-index: ${Z_INDEX.sticky};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  display: none;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: flex;
  }
`

const StyledButton = styled.a`
  height: 28px;
  background: ${({ theme }) => theme.accent1};
  border-radius: 16px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
`

/**
 * We show the mobile app promo banner if:
 * - The user is on a mobile device our app supports
 * - The user is not using Safari (since we don't want to conflict with the Safari-native Smart App Banner)
 * - The user has not dismissed the banner during this session
 */
export function useMobileAppPromoBannerEligible() {
  const hideMobileAppPromoBanner = useAtomValue(hideMobileAppPromoBannerAtom)
  return (isWebIOS || isWebAndroid) && !hideMobileAppPromoBanner
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
  const [isVisible, setIsVisible] = useState(true)
  const theme = useTheme()
  const mobileAppPromoBannerEligible = useMobileAppPromoBannerEligible()
  const [, setHideMobileAppPromoBanner] = useAtom(hideMobileAppPromoBannerAtom)

  const provider = useEthersWeb3Provider()

  const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined

  if (!mobileAppPromoBannerEligible || !isVisible) {
    return null
  }

  return (
    <Wrapper>
      <Row gap="sm">
        <X
          data-testid="mobile-promo-banner-close-button"
          size={20}
          color={theme.neutral2}
          onClick={() => {
            setIsVisible(false)
            setHideMobileAppPromoBanner(true)
          }}
        />
        <UniswapLogo width="32px" height="32px" />
        <Column>
          <ThemedText.BodySmall>
            <Trans i18nKey="mobileAppPromo.banner.title" />
          </ThemedText.BodySmall>
          <ThemedText.Caption color="neutral2">
            <Trans i18nKey="mobileAppPromo.banner.getTheApp.link" />
          </ThemedText.Caption>
        </Column>
      </Row>
      <StyledButton href={getDownloadLink(navigator.userAgent, peerWalletAgent)}>
        <ThemedText.LabelSmall color="white" lineHeight="20px">
          <Trans i18nKey="common.getApp" />
        </ThemedText.LabelSmall>
      </StyledButton>
    </Wrapper>
  )
}
