import UNIWALLET_ICON from 'assets/wallets/uniswap-wallet-icon.png'
import Column from 'components/Column'
import Row from 'components/Row'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { CONNECTION } from 'components/Web3Provider/constants'
import { useConnect } from 'hooks/useConnect'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { Text } from 'ui/src'
import { Mobile, QrCode } from 'ui/src/components/icons'

const OptionContainer = styled(Row)`
  padding: 16px;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  overflow: hidden;
  max-height: 72px;
  justify-content: space-between;
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`
const AppIcon = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 10px;
  fill: linear-gradient(0deg, #fff1ff 0%, rgba(255, 255, 255, 0) 100%), #fffbff;
  filter: drop-shadow(0px 1.179px 3.537px rgba(255, 117, 249, 0.24));
`
const TagContainer = styled.div`
  @media screen and (max-width: 300px) {
    display: none;
  }
`
export function UniswapWalletOptions() {
  const uniswapExtensionConnector = useConnectorWithId(CONNECTION.UNISWAP_EXTENSION_RDNS)
  const uniswapWalletConnectConnector = useConnectorWithId(CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID, {
    shouldThrow: true,
  })

  const { connect } = useConnect()

  return (
    <Column gap="16px">
      <Column gap="md">
        {/* TODO(WEB-3931): If extension is not installed, show onboarding option instead */}
        {uniswapExtensionConnector && (
          <OptionContainer onClick={() => connect({ connector: uniswapExtensionConnector })}>
            <AppIcon src={UNIWALLET_ICON} alt="uniswap-app-icon" />
            <Row gap="xs">
              <Text variant="buttonLabel3" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.extension" />
              </Text>
            </Row>
            <TagContainer>
              <Text lineHeight={16} fontSize={12} color="$neutral2">
                <Trans i18nKey="common.detected" />
              </Text>
            </TagContainer>
          </OptionContainer>
        )}
        <OptionContainer gap="md" onClick={() => connect({ connector: uniswapWalletConnectConnector })}>
          <Mobile size="$icon.40" minWidth={40} color="$accent1" backgroundColor="$accent2" borderRadius={8} p={7} />
          <Row gap="xs">
            <Column>
              <Text variant="buttonLabel3" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.mobileWallet" />
              </Text>
              <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                <Trans i18nKey="wallet.scanToConnect" />
              </Text>
            </Column>
          </Row>
          <TagContainer>
            <QrCode size={20} color="$neutral2" />
          </TagContainer>
        </OptionContainer>
      </Column>
    </Column>
  )
}
