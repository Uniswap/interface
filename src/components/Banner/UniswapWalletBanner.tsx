import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { openDownloadApp, openWalletMicrosite } from 'components/AccountDrawer/DownloadButton'
import { BaseButton } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { useMgtmEnabled } from 'featureFlags/flags/mgtm'
import { useScreenSize } from 'hooks/useScreenSize'
import { X } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { useHideUniswapWalletBanner } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { isIOS } from 'utils/userAgent'

import { ReactComponent as AppleLogo } from '../../assets/svg/apple_logo.svg'
import walletBannerPhoneImageSrc from '../../assets/svg/wallet_banner_phone_image.svg'

const PopupContainer = styled.div<{ show: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  ${({ show }) => !show && 'display: none'};

  background: url(${walletBannerPhoneImageSrc});
  background-repeat: no-repeat;
  background-position: bottom -1px right 15px;
  background-size: 166px;

  :hover {
    background-size: 170px;
  }
  transition: background-size ${({ theme }) => theme.transition.duration.medium}
    ${({ theme }) => theme.transition.timing.inOut};

  background-color: ${({ theme }) => theme.promotional};
  color: ${({ theme }) => theme.textPrimary};
  position: fixed;
  z-index: ${Z_INDEX.sticky};

  padding: 24px 16px 16px;

  border-radius: 20px;
  bottom: 20px;
  right: 20px;
  width: 390px;
  height: 164px;

  border: 1px solid ${({ theme }) => theme.backgroundOutline};

  box-shadow: ${({ theme }) => theme.deepShadow};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    bottom: 62px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: unset;
    right: 10px;
    left: 10px;
  }

  user-select: none;
`

const ButtonRow = styled(Row)`
  gap: 16px;
`
const StyledXButton = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 21px;
  right: 17px;

  color: ${({ theme }) => theme.white};
  ${OpacityHoverState};
`

const BannerButton = styled(BaseButton)`
  height: 40px;
  border-radius: 16px;
  padding: 10px;
  ${OpacityHoverState};
`

export default function UniswapWalletBanner() {
  const [hideUniswapWalletBanner, toggleHideUniswapWalletBanner] = useHideUniswapWalletBanner()
  const mgtmEnabled = useMgtmEnabled()
  const location = useLocation()
  const isLandingScreen = location.search === '?intro=true' || location.pathname === '/'

  const shouldDisplay = Boolean(mgtmEnabled && !hideUniswapWalletBanner && !isLandingScreen)

  const screenSize = useScreenSize()

  return (
    <PopupContainer show={shouldDisplay}>
      <StyledXButton
        data-testid="uniswap-wallet-banner"
        size={20}
        onClick={(e) => {
          // prevent click from bubbling to UI on the page underneath, i.e. clicking a token row
          e.preventDefault()
          e.stopPropagation()
          toggleHideUniswapWalletBanner()
        }}
      />

      <AutoColumn gap="8px">
        <ThemedText.HeadlineMedium fontSize="24px" lineHeight="28px" color="white" maxWidth="60%">
          <Trans>Uniswap in your pocket</Trans>
        </ThemedText.HeadlineMedium>
      </AutoColumn>

      <ButtonRow>
        {isIOS ? (
          <>
            <BannerButton
              backgroundColor="white"
              onClick={() => openDownloadApp(InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON)}
            >
              <AppleLogo width={14} height={14} />
              <ThemedText.LabelSmall color="black" marginLeft="5px">
                {!screenSize['xs'] ? <Trans>Download</Trans> : <Trans>Download app</Trans>}
              </ThemedText.LabelSmall>
            </BannerButton>

            <BannerButton backgroundColor="black" onClick={openWalletMicrosite}>
              <ThemedText.LabelSmall color="white">
                <Trans>Learn more</Trans>
              </ThemedText.LabelSmall>
            </BannerButton>
          </>
        ) : (
          <BannerButton backgroundColor="white" width="125px" onClick={openWalletMicrosite}>
            <ThemedText.LabelSmall color="black">
              <Trans>Learn more</Trans>
            </ThemedText.LabelSmall>
          </BannerButton>
        )}
      </ButtonRow>
    </PopupContainer>
  )
}
