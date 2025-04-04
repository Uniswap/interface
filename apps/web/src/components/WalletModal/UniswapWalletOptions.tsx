import { InterfaceElementName } from '@uniswap/analytics-events'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { DownloadWalletOption } from 'components/WalletModal/DownloadWalletOption'
import { RecentBadge } from 'components/WalletModal/Option'
import { DetectedBadge } from 'components/WalletModal/shared'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { uniswapWalletConnect } from 'components/Web3Provider/walletConnect'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useConnect } from 'hooks/useConnect'
import { useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { useCallback, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { PhoneDownload } from 'ui/src/components/icons/PhoneDownload'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { signInWithPasskey } from 'uniswap/src/data/rest/embeddedWallet'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isMobileWeb, isWebIOS } from 'utilities/src/platform'
import { openDownloadApp } from 'utils/openDownloadApp'
import { Connector } from 'wagmi'

export const OptionContainer = styled(Row)<{ hideBackground?: boolean; recent?: boolean }>`
  padding: 16px;
  gap: 12px;
  border-radius: 16px;
  border: ${({ theme, recent }) => recent && `2px solid ${theme.accent2}`};
  overflow: hidden;
  max-height: 72px;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  z-index: ${Z_INDEX.default};
  background: ${({ theme, hideBackground }) => !hideBackground && theme.surface2};
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`

export const AppIcon = styled.img<{ isEmbeddedWalletEnabled?: boolean }>`
  height: ${({ isEmbeddedWalletEnabled }) => (isEmbeddedWalletEnabled ? '32px' : '40px')};
  width: ${({ isEmbeddedWalletEnabled }) => (isEmbeddedWalletEnabled ? '32px' : '40px')};
  border-radius: 10px;
  fill: linear-gradient(0deg, #fff1ff 0%, rgba(255, 255, 255, 0) 100%), #fffbff;
  filter: drop-shadow(0px 1.179px 3.537px rgba(255, 117, 249, 0.24));
`

export function UniswapWalletOptions() {
  const uniswapExtensionConnector = useConnectorWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const embeddedWalletConnector = useConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const [, setPersistHideMobileAppPromoBanner] = useAtom(persistHideMobileAppPromoBannerAtom)

  const { connect } = useConnect()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const recentConnectorId = useRecentConnectorId()
  const isRecent = (connector: Connector) => connector.id === recentConnectorId
  const handleSignInWithPasskey = useCallback(async () => {
    const existingWalletAddress = await signInWithPasskey()
    if (existingWalletAddress) {
      // TODO[EW]: move from localstorage to context layer
      localStorage.setItem('embeddedUniswapWallet.address', existingWalletAddress)
      connect({ connector: embeddedWalletConnector })
    }
  }, [connect, embeddedWalletConnector])
  const iconSize = useMemo(
    () => (isEmbeddedWalletEnabled ? iconSizes.icon32 : iconSizes.icon40),
    [isEmbeddedWalletEnabled],
  )

  return (
    <Column gap="16px">
      <Column gap="8px">
        {uniswapExtensionConnector ? (
          // If the extension is detected, show the option to connect
          <OptionContainer
            onClick={() => connect({ connector: uniswapExtensionConnector })}
            data-testid="connect-uniswap-extension"
          >
            <Image height={iconSize} source={UNISWAP_LOGO} width={iconSize} />
            <Row gap="xs">
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.extension" />
              </Text>
            </Row>
            <DetectedBadge />
          </OptionContainer>
        ) : // If not on a mobile web browser show the download wallet modal (includes link to download extension)
        !isMobileWeb ? (
          <DownloadWalletOption />
        ) : null}
        {isEmbeddedWalletEnabled ? (
          <OptionContainer
            recent={isRecent(embeddedWalletConnector)}
            onClick={handleSignInWithPasskey}
            data-testid="connect-passkey-embedded-wallet"
          >
            <Passkey size={iconSizes.icon32} />
            <Row justify="space-between">
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.passkey" />
              </Text>
              {isRecent(embeddedWalletConnector) && <RecentBadge />}
            </Row>
          </OptionContainer>
        ) : null}
        <OptionContainer
          gap="md"
          onClick={() => {
            setPersistHideMobileAppPromoBanner(true)
            connect({
              // Initialize Uniswap Wallet on click instead of in wagmi config
              // to avoid multiple wallet connect sockets being opened
              // and causing issues with messages getting dropped
              connector: uniswapWalletConnect(),
            })
          }}
        >
          {isMobileWeb ? (
            <Image height={iconSize} source={UNISWAP_LOGO} width={iconSize} />
          ) : (
            <ScanQr
              size={iconSize}
              minWidth={iconSize}
              color="$accent1"
              backgroundColor="$accent2"
              borderRadius={8}
              p={7}
            />
          )}
          <Row justify="space-between">
            <Column>
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.uniswapMobile" />
              </Text>
              {isEmbeddedWalletEnabled ? null : (
                <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                  {isMobileWeb ? <Trans i18nKey="wallet.appSignIn" /> : <Trans i18nKey="wallet.scanToConnect" />}
                </Text>
              )}
            </Column>
          </Row>
        </OptionContainer>
        {isMobileWeb && (
          // If on a mobile web browser show the relevant app store download link
          <OptionContainer
            onClick={() => {
              setPersistHideMobileAppPromoBanner(true)
              openDownloadApp({ element: InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON })
            }}
          >
            <PhoneDownload size="$icon.40" minWidth={40} color="$accent1" backgroundColor="$accent2" borderRadius={8} />
            <Row gap="xs">
              <Flex grow>
                <Text variant="buttonLabel3" color="$neutral1" whiteSpace="nowrap">
                  <Trans i18nKey="common.getUniswapWallet" />
                </Text>
                <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                  {isWebIOS ? (
                    <Trans i18nKey="common.downloadAppStore" />
                  ) : (
                    <Trans i18nKey="common.downloadPlayStore" />
                  )}
                </Text>
              </Flex>
              {isWebIOS ? (
                <AppStoreLogo size="$icon.24" />
              ) : (
                <Flex p="$padding6" borderRadius="$rounded8" backgroundColor="$neutral1">
                  <GooglePlayStoreLogo />
                </Flex>
              )}
            </Row>
          </OptionContainer>
        )}
      </Column>
    </Column>
  )
}
