import { InterfaceElementName } from '@uniswap/analytics-events'
import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import { AppIcon, OptionContainer } from 'components/WalletModal/UniswapWalletOptions'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { Trans } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { colors } from 'theme/colors'
import { Z_INDEX } from 'theme/zIndex'
import { Text } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'

// The light background is needed so that when hovered the background image always becomes lighter even when the app is in dark mode
const LightBackground = styled.div`
  max-height: 72px;
  width: 100%;
  background: ${colors.surface1_light};
  border-radius: 16px;
  position: relative;
`

const BackgroundImage = styled.div<{ backgroundImage?: string; isHovered?: boolean }>`
  background: url(${({ backgroundImage }) => backgroundImage});
  background-repeat: no-repeat;
  background-size: cover;
  opacity: ${({ isHovered }) => (isHovered ? 0.54 : 1)};
  max-height: 72px;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: ${Z_INDEX.deprecated_zero};
  transition: opacity ${({ theme }) => theme.transition.duration.fast} ${({ theme }) => theme.transition.timing.inOut};
`

export const DownloadWalletOption = () => {
  const openGetTheAppModal = useOpenModal({ name: ApplicationModal.GET_THE_APP })
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  // Hovered state is passed from the background component to the background image which is layered underneath the option container
  const [optionHovered, setOptionHovered] = useState(false)
  return (
    <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_CONNECTOR}>
      <LightBackground
        onMouseEnter={() => setOptionHovered(true)}
        onMouseLeave={() => setOptionHovered(false)}
        data-testid="download-uniswap-wallet"
      >
        <BackgroundImage backgroundImage="/images/extension_promo/background_connector.png" isHovered={optionHovered} />
        <OptionContainer onClick={openGetTheAppModal} hideBackground>
          <AppIcon isEmbeddedWalletEnabled={isEmbeddedWalletEnabled} src={UNIWALLET_ICON} alt="uniswap-app-icon" />
          <Row gap="xs">
            <Column>
              <Text variant="buttonLabel2" color="$white" whiteSpace="nowrap">
                <Trans i18nKey="common.getUniswapWallet" />
              </Text>
              <Text variant="body4" color="$white" whiteSpace="nowrap">
                <Trans i18nKey="common.availableOnIOSAndroidChrome" />
              </Text>
            </Column>
          </Row>
        </OptionContainer>
      </LightBackground>
    </Trace>
  )
}
