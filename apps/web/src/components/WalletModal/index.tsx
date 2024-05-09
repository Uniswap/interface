import { useWeb3React } from '@web3-react/core'
import IconButton from 'components/AccountDrawer/IconButton'
import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Column from 'components/Column'
import { Settings } from 'components/Icons/Settings'
import Row, { AutoRow } from 'components/Row'
import { networkConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { useIsSupportedChainId } from 'constants/chains'
import { useUniswapWalletOptions } from 'hooks/useUniswapWalletOptions'
import { Trans } from 'i18n'
import { useEffect } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { Text } from 'ui/src'
import ConnectionErrorView from './ConnectionErrorView'
import { DeprecatedInjectorMessage } from './Option'
import PrivacyPolicyNotice from './PrivacyPolicyNotice'
import { UniswapWalletOptions } from './UniswapWalletOptions'
import { useOrderedConnections } from './useOrderedConnections'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: 14px 16px 16px;
  flex: 1;
  gap: 16px;
`

const OptionGrid = styled.div`
  display: grid;
  flex: 1;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const TextSectionWrapper = styled.div`
  padding: 0 4px;
`

const Line = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.surface3};
`

export default function WalletModal({ openSettings }: { openSettings: () => void }) {
  const { connector, chainId } = useWeb3React()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const showMoonpayText = useShowMoonpayText()

  const { activationState } = useActivationState()
  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector, isSupportedChain])

  const showUniswapWalletOptions = useUniswapWalletOptions()
  const { orderedConnections, showDeprecatedMessage } = useOrderedConnections(!!showUniswapWalletOptions)

  return (
    <Wrapper data-testid="wallet-modal">
      <AutoRow justify="space-between" width="100%">
        <ThemedText.SubHeader>Connect a wallet</ThemedText.SubHeader>
        <IconButton Icon={Settings} onClick={openSettings} data-testid="wallet-settings" />
      </AutoRow>
      {showUniswapWalletOptions && (
        <>
          <UniswapWalletOptions />
          <Row align="center" padding="8px 0px">
            <Line />
            <Text variant="body3" color="$neutral2" mx={18} whiteSpace="nowrap">
              <Trans>Other wallets</Trans>
            </Text>
            <Line />
          </Row>
        </>
      )}
      {activationState.status === ActivationStatus.ERROR ? (
        <ConnectionErrorView />
      ) : (
        <Column gap="md" flex="1">
          <Row flex="1" align="flex-start">
            <OptionGrid data-testid="option-grid">{orderedConnections}</OptionGrid>
          </Row>
          {showDeprecatedMessage && (
            <TextSectionWrapper>
              <DeprecatedInjectorMessage />
            </TextSectionWrapper>
          )}
          <Column gap="md">
            <TextSectionWrapper>
              <PrivacyPolicyNotice />
            </TextSectionWrapper>
            {showMoonpayText && (
              <>
                <Line />
                <TextSectionWrapper>
                  <ThemedText.Caption color="neutral3">
                    <Trans>Fiat onramp powered by MoonPay USA LLC</Trans>
                  </ThemedText.Caption>
                </TextSectionWrapper>
              </>
            )}
          </Column>
        </Column>
      )}
    </Wrapper>
  )
}
