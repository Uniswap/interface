import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ReactComponent as AppleLogo } from 'assets/svg/apple_logo.svg'
import baseLogoUrl from 'assets/svg/base_background_icon.svg'
import { useScreenSize } from 'hooks/useScreenSize'
import { useLocation } from 'react-router-dom'
import { useHideBaseWalletBanner } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { openDownloadApp, openWalletMicrosite } from 'utils/openDownloadApp'
import { isIOS, isMobileSafari } from 'utils/userAgent'

import { BannerButton, BaseBackgroundImage, ButtonRow, PopupContainer, StyledXButton } from './styled'

export default function BaseWalletBanner() {
  const { chainId } = useWeb3React()
  const [hideBaseWalletBanner, toggleHideBaseWalletBanner] = useHideBaseWalletBanner()
  const location = useLocation()
  const isLandingScreen = location.search === '?intro=true' || location.pathname === '/'

  const shouldDisplay = Boolean(!hideBaseWalletBanner && !isLandingScreen && chainId === ChainId.BASE)

  const screenSize = useScreenSize()

  if (isMobileSafari) return null

  return (
    <PopupContainer show={shouldDisplay}>
      <StyledXButton
        data-testid="uniswap-wallet-banner"
        size={20}
        onClick={(e) => {
          // prevent click from bubbling to UI on the page underneath, i.e. clicking a token row
          e.preventDefault()
          e.stopPropagation()
          toggleHideBaseWalletBanner()
        }}
      />

      <BaseBackgroundImage src={baseLogoUrl} alt="transparent base background logo" />

      <ThemedText.HeadlineMedium fontSize="24px" lineHeight="28px" color="white" maxWidth="224px">
        <Trans>
          Swap on{' '}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.5689 10C19.5689 15.4038 15.1806 19.7845 9.76737 19.7845C4.63163 19.7845 0.418433 15.8414 0 10.8225H12.9554V9.17755H0C0.418433 4.15863 4.63163 0.215576 9.76737 0.215576C15.1806 0.215576 19.5689 4.59621 19.5689 10Z"
              fill="white"
            />
          </svg>{' '}
          BASE in the Uniswap wallet
        </Trans>
      </ThemedText.HeadlineMedium>

      <ButtonRow>
        {isIOS ? (
          <>
            <BannerButton
              backgroundColor="white"
              onClick={() =>
                openDownloadApp({
                  element: InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON,
                  appStoreParams: 'pt=123625782&ct=base-app-banner&mt=8',
                })
              }
            >
              <AppleLogo width={14} height={14} />
              <ThemedText.LabelSmall color="black" marginLeft="5px">
                {!screenSize['xs'] ? <Trans>Download</Trans> : <Trans>Download app</Trans>}
              </ThemedText.LabelSmall>
            </BannerButton>

            <BannerButton backgroundColor="black" onClick={() => openWalletMicrosite()}>
              <ThemedText.LabelSmall color="white">
                <Trans>Learn more</Trans>
              </ThemedText.LabelSmall>
            </BannerButton>
          </>
        ) : (
          <BannerButton backgroundColor="white" width="125px" onClick={() => openWalletMicrosite()}>
            <ThemedText.LabelSmall color="black">
              <Trans>Learn more</Trans>
            </ThemedText.LabelSmall>
          </BannerButton>
        )}
      </ButtonRow>
    </PopupContainer>
  )
}
