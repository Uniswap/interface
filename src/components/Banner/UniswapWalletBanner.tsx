import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer'
import { DownloadButton, LearnMoreButton } from 'components/AccountDrawer/DownloadButton'
import { AutoColumn } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { useMgtmEnabled } from 'featureFlags/flags/mgtm'
import { X } from 'react-feather'
import { useHideUniswapWalletBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { isIOS } from 'utils/userAgent'

import bannerImageDark from '../../assets/images/uniswapWalletBannerDark.png'
import bannerImageLight from '../../assets/images/uniswapWalletBannerLight.png'

const PopupContainer = styled.div<{ show: boolean }>`
  ${({ show }) => !show && 'display: none'};

  box-shadow: ${({ theme }) =>
    theme.darkMode
      ? '0px -16px 24px rgba(0, 0, 0, 0.4), 0px -8px 12px rgba(0, 0, 0, 0.4), 0px -4px 8px rgba(0, 0, 0, 0.32)'
      : '0px -12px 20px rgba(51, 53, 72, 0.04), 0px -6px 12px rgba(51, 53, 72, 0.02), 0px -4px 8px rgba(51, 53, 72, 0.04)'};

  background-image: ${({ theme }) => (theme.darkMode ? `url(${bannerImageDark})` : `url(${bannerImageLight})`)};
  background-repeat: no-repeat;
  background-size: cover;

  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
  position: fixed;
  z-index: ${Z_INDEX.sticky};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
  width: 100%;
  bottom: 52px;
  height: 20%;
`

const InnerContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  justify-content: space-between;
  height: 100%;
  padding: 24px 16px;
`

const ButtonRow = styled(Row)`
  gap: 16px;
`

const StyledXButton = styled(X)`
  color: ${({ theme }) => theme.textSecondary};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

export default function UniswapWalletBanner() {
  const [hideUniswapWalletBanner, toggleHideUniswapWalletBanner] = useHideUniswapWalletBanner()
  const [walletDrawerOpen] = useAccountDrawer()
  const mgtmEnabled = useMgtmEnabled()

  const theme = useTheme()

  const shouldDisplay = Boolean(mgtmEnabled && !walletDrawerOpen && !hideUniswapWalletBanner && isIOS)

  return (
    <PopupContainer show={shouldDisplay}>
      <InnerContainer>
        <AutoColumn gap="8px">
          <RowBetween>
            <ThemedText.SubHeader>
              <Trans>Get the power of Uniswap in your pocket</Trans>
            </ThemedText.SubHeader>
            <StyledXButton
              data-testid="uniswap-wallet-banner"
              color={theme.textSecondary}
              size={20}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleHideUniswapWalletBanner()
              }}
            />
          </RowBetween>
          <ThemedText.BodySmall>
            <Trans>Download in the App Store today.</Trans>{' '}
          </ThemedText.BodySmall>
        </AutoColumn>

        <ButtonRow>
          <LearnMoreButton />
          <DownloadButton
            onClick={() => toggleHideUniswapWalletBanner()}
            element={InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON}
          />
        </ButtonRow>
      </InnerContainer>
    </PopupContainer>
  )
}
