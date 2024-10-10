import { InterfaceElementName, InterfaceModalName } from '@uniswap/analytics-events'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button/buttons'
import Modal from 'components/Modal'
import {
  LAUNCH_MODAL_DESKTOP_MAX_HEIGHT,
  LAUNCH_MODAL_DESKTOP_MAX_WIDTH,
  LAUNCH_MODAL_MOBILE_MAX_HEIGHT,
  LAUNCH_MODAL_MOBILE_MAX_IMAGE_HEIGHT,
} from 'components/TopLevelModals/constants'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import styled from 'lib/styled-components'
import { X } from 'react-feather'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ExternalLink, ThemedText } from 'theme/components'
import { Image } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Trans } from 'uniswap/src/i18n'

const ModalWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    flex-direction: column;
  }
  * {
    outline: none;
  }
`

const PromoImage = styled.img`
  display: flex;
  width: 240px;
  height: 100%;
  border-radius: 20px 0px 0px 20px;
  background: url('/images/extension_promo/announcement_modal_desktop.png');
  background-repeat: no-repeat;
  background-size: cover;
  flex: 1;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    background: url('/images/extension_promo/announcement_modal_mobile.png');
    background-size: cover;
    background-position: 50%;
    height: ${LAUNCH_MODAL_MOBILE_MAX_IMAGE_HEIGHT}px;
    width: 100%;
    flex: unset;
  }
`

const CloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  ${ClickableStyle}
  color: ${({ theme }) => theme.neutral2};
`

const TextWrapper = styled(Column)`
  padding: 20px 24px;
  gap: 16px;
  height: 100%;
  flex: 1;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    gap: 12px;
    text-align: center;
  }
`

const HeaderRow = styled(Row)`
  justify-content: space-between;
  align-items: flex-start;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const StyledExternalLink = styled(ExternalLink)`
  width: 100%;
`

const StyledThemeButton = styled(ThemeButton)`
  padding: 8px 0px;
  width: 100%;
  border-radius: 12px;
  ${ClickableStyle}

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    padding: 12px 20px;
    border-radius: 16px;
    font-size: 18px;
    line-height: 24px;
  }
`

// Once a user closes the modal, do not reopen for duration of session
const showExtensionLaunchAtom = atomWithStorage('showUniswapExtensionLaunchAtom', true)

export function ExtensionLaunchModal() {
  const [showExtensionLaunch, setShowExtensionLaunch] = useAtom(showExtensionLaunchAtom)
  const isOnLandingPage = useIsLandingPage()
  const uniswapExtensionConnector = useConnectorWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const isMobile = useIsMobile()

  return (
    <Trace modal={InterfaceModalName.EXTENSION_LAUNCH_PROMOTIONAL_MODAL}>
      <Modal
        maxWidth={isMobile ? undefined : LAUNCH_MODAL_DESKTOP_MAX_WIDTH}
        height={isMobile ? LAUNCH_MODAL_MOBILE_MAX_HEIGHT : LAUNCH_MODAL_DESKTOP_MAX_HEIGHT}
        isOpen={showExtensionLaunch && !isOnLandingPage && !uniswapExtensionConnector}
        hideBorder
        onDismiss={() => setShowExtensionLaunch(false)}
      >
        <ModalWrapper>
          <PromoImage />
          <TextWrapper>
            <HeaderRow>
              <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
              <Trace logPress element={InterfaceElementName.CLOSE_BUTTON}>
                <CloseIcon onClick={() => setShowExtensionLaunch(false)} />
              </Trace>
            </HeaderRow>
            <Column gap="xs">
              <ThemedText.SubHeader>
                <Trans i18nKey="extension.introduction" />
              </ThemedText.SubHeader>
              <ThemedText.SubHeaderSmall lineHeight="20px">
                <Trans i18nKey="extension.announcement" />
              </ThemedText.SubHeaderSmall>
            </Column>
            <Row gap="8px" marginTop="auto">
              {isMobile && (
                <Trace logPress element={InterfaceElementName.CLOSE_BUTTON}>
                  <StyledThemeButton
                    size={ButtonSize.small}
                    emphasis={ButtonEmphasis.medium}
                    onClick={() => setShowExtensionLaunch(false)}
                  >
                    <Trans i18nKey="common.dismiss" />
                  </StyledThemeButton>
                </Trace>
              )}
              <Trace logPress element={InterfaceElementName.LEARN_MORE_LINK}>
                <StyledExternalLink href="https://wallet.uniswap.org//?utm_medium=promo-dialogue&utm_source=web-app&utm_campaign=ext-launch&utm_creative=learn-more">
                  <StyledThemeButton
                    size={ButtonSize.small}
                    emphasis={isMobile ? ButtonEmphasis.high : ButtonEmphasis.medium}
                    onClick={() => setShowExtensionLaunch(false)}
                  >
                    <Trans i18nKey="common.button.learn" />
                  </StyledThemeButton>
                </StyledExternalLink>
              </Trace>
              {!isMobile && (
                <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
                  <StyledExternalLink href={uniswapUrls.chromeExtension}>
                    <StyledThemeButton
                      size={ButtonSize.small}
                      emphasis={ButtonEmphasis.high}
                      onClick={() => setShowExtensionLaunch(false)}
                    >
                      <Trans i18nKey="common.download" />
                    </StyledThemeButton>
                  </StyledExternalLink>
                </Trace>
              )}
            </Row>
          </TextWrapper>
        </ModalWrapper>
      </Modal>
    </Trace>
  )
}
