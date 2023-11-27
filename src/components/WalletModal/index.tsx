import { useWeb3React } from '@web3-react/core'
import IconButton from 'components/AccountDrawer/IconButton'
import { AutoColumn } from 'components/Column'
import { Settings } from 'components/Icons/Settings'
import { AutoRow } from 'components/Row'
import {
  connections,
  deprecatedNetworkConnection,
  eip6963Connection,
  injectedConnection,
  networkConnection,
} from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { EIP6963 } from 'connection/eip6963'
import { ConnectionType } from 'connection/types'
import { isSupportedChain } from 'constants/chains'
import { useEip6963Enabled } from 'featureFlags/flags/eip6963'
import { useFallbackProviderEnabled } from 'featureFlags/flags/fallbackProvider'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option, { DeprecatedInjectorMessage } from './Option'
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

// function getOptions() {
//   return EIP6963_PROVIDER_MAP.map
// }

// function subscribe(listener: () => void) {
//   EIP6963_PROVIDER_MAP.listeners.add(listener)
//   return () => {
//     EIP6963_PROVIDER_MAP.listeners.delete(listener)
//   }
// }

// function useInjectedOptions() {
//   return useSyncExternalStore(subscribe, getOptions)
// }

export default function WalletModal({ openSettings }: { openSettings: () => void }) {
  const { connector, chainId } = useWeb3React()
  const eip6963Enabled = useEip6963Enabled()
  const [showDeprecatedMessage, setShowDeprecatedMessage] = useState(false)

  const { activationState } = useActivationState()
  const fallbackProviderEnabled = useFallbackProviderEnabled()
  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      if (fallbackProviderEnabled) {
        networkConnection.connector.activate(chainId)
      } else {
        deprecatedNetworkConnection.connector.activate(chainId)
      }
    }
  }, [chainId, connector, fallbackProviderEnabled])

  const injectedOptionMap = EIP6963.useInjectedOptions()

  const connectionList = useMemo(() => {
    const eip6963Injectors = Array.from(injectedOptionMap.values())
    const list: JSX.Element[] = []

    for (const connection of connections) {
      if (
        connection.shouldDisplay(eip6963Enabled) &&
        !(eip6963Enabled && connection.type === ConnectionType.INJECTED && eip6963Injectors.length > 0)
      ) {
        list.push(<Option key={connection.getProviderInfo().name} connection={connection} />)
      }
    }

    // Return before adding EIP6963 options if flag is not enabled
    if (!eip6963Enabled || eip6963Injectors.length === 0) return list

    if (injectedConnection.shouldDisplay(eip6963Enabled)) {
      setShowDeprecatedMessage(true)
    }

    const injectorList: JSX.Element[] = []
    for (const injector of eip6963Injectors) {
      const injectedConnection = eip6963Connection.getInjection(injector.info) // creates wrapped version of eip6963Connection that will display specific wallet
      if (!injectedConnection) continue

      injectorList.push(<Option connection={injectedConnection} />)
    }

    list.splice(2, 0, ...injectorList)

    return list
  }, [injectedOptionMap, eip6963Enabled])

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
          <OptionGrid data-testid="option-grid">{connectionList}</OptionGrid>
          <PrivacyPolicyWrapper>{showDeprecatedMessage && <DeprecatedInjectorMessage />}</PrivacyPolicyWrapper>

          <PrivacyPolicyWrapper>
            <PrivacyPolicyNotice />
          </PrivacyPolicyWrapper>
        </AutoColumn>
      )}
    </Wrapper>
  )
}
