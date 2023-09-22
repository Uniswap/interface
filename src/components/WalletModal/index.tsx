import { useWeb3React } from '@web3-react/core'
import IconButton from 'components/AccountDrawer/IconButton'
import { AutoColumn } from 'components/Column'
import { Settings } from 'components/Icons/Settings'
import { AutoRow } from 'components/Row'
import { connections, networkConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { isSupportedChain } from 'constants/chains'
import { useEffect } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'
import PrivacyPolicyNotice from './PrivacyPolicyNotice'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: 14px 16px 16px;
  flex: 1;
`

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const PrivacyPolicyWrapper = styled.div`
  padding: 0 4px;
`

export default function WalletModal({ openSettings }: { openSettings: () => void }) {
  const { connector, chainId } = useWeb3React()

  const { activationState } = useActivationState()

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  return (
    <Wrapper data-testid="wallet-modal">
      <AutoRow justify="space-between" width="100%" marginBottom="16px">
        <ThemedText.SubHeader>Connect a wallet</ThemedText.SubHeader>
        <IconButton Icon={Settings} onClick={openSettings} data-testid="wallet-settings" />
      </AutoRow>
      {activationState.status === ActivationStatus.ERROR ? (
        <ConnectionErrorView />
      ) : (
        <AutoColumn gap="16px">
          <OptionGrid data-testid="option-grid">
            {connections
              .filter((connection) => connection.shouldDisplay())
              .map((connection) => (
                <Option key={connection.getName()} connection={connection} />
              ))}
          </OptionGrid>
          <PrivacyPolicyWrapper>
            <PrivacyPolicyNotice />
          </PrivacyPolicyWrapper>
        </AutoColumn>
      )}
    </Wrapper>
  )
}
