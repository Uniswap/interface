import { InterfaceElementName } from '@uniswap/analytics-events'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { DownloadWalletOption } from 'components/WalletModal/DownloadWalletOption'
import { DetectedBadge } from 'components/WalletModal/shared'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useConnect } from 'hooks/useConnect'
import styled from 'lib/styled-components'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { PhoneDownload } from 'ui/src/components/icons/PhoneDownload'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Trans } from 'uniswap/src/i18n'
import { isMobileWeb, isWebIOS } from 'utilities/src/platform'
import { openDownloadApp } from 'utils/openDownloadApp'

export const OptionContainer = styled(Row)`
  padding: 16px;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  overflow: hidden;
  max-height: 72px;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
  z-index: ${Z_INDEX.default};
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`

export const AppIcon = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 10px;
  fill: linear-gradient(0deg, #fff1ff 0%, rgba(255, 255, 255, 0) 100%), #fffbff;
  filter: drop-shadow(0px 1.179px 3.537px rgba(255, 117, 249, 0.24));
`

export function UniswapWalletOptions() {
  const uniswapExtensionConnector = useConnectorWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const uniswapWalletConnectConnector = useConnectorWithId(
    CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
    {
      shouldThrow: true,
    },
  )

  const { connect } = useConnect()

  return (
    <Column gap="16px">
      <Column gap="md">
        {uniswapExtensionConnector ? (
          // If the extension is detected, show the option to connect
          <OptionContainer
            onClick={() => connect({ connector: uniswapExtensionConnector })}
            data-testid="connect-uniswap-extension"
          >
            <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
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
        <OptionContainer gap="md" onClick={() => connect({ connector: uniswapWalletConnectConnector })}>
          {isMobileWeb ? (
            <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
          ) : (
            <ScanQr size="$icon.40" minWidth={40} color="$accent1" backgroundColor="$accent2" borderRadius={8} p={7} />
          )}
          <Row gap="xs">
            <Column>
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.uniswapMobile" />
              </Text>
              <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                {isMobileWeb ? <Trans i18nKey="wallet.appSignIn" /> : <Trans i18nKey="wallet.scanToConnect" />}
              </Text>
            </Column>
          </Row>
        </OptionContainer>
        {isMobileWeb && (
          // If on a mobile web browser show the relevant app store download link
          <OptionContainer
            onClick={() => openDownloadApp({ element: InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON })}
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
