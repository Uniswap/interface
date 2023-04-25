import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import IconButton from 'components/AccountDrawer/IconButton'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ConnectionType, getConnections, networkConnection } from 'connection'
import { useGetConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { isSupportedChain } from 'constants/chains'
import { useMgtmEnabled } from 'featureFlags/flags/mgtm'
import { useEffect, useState } from 'react'
import { Settings } from 'react-feather'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import ConnectionErrorView from './ConnectionErrorView'
import Option from './Option'
import PrivacyPolicyNotice from './PrivacyPolicyNotice'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.backgroundSurface};
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

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean,
  peerWalletAgent: string | undefined
) => {
  // User properties *must* be set before sending corresponding event properties,
  // so that the event contains the correct and up-to-date user properties.
  user.set(CustomUserProperties.WALLET_ADDRESS, account)
  user.set(CustomUserProperties.WALLET_TYPE, walletType)
  user.set(CustomUserProperties.PEER_WALLET_AGENT, peerWalletAgent ?? '')
  if (chainId) {
    user.postInsert(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account)

  sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WalletConnectionResult.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
    peer_wallet_agent: peerWalletAgent,
  })
}

export default function WalletModal({ openSettings }: { openSettings: () => void }) {
  const { connector, account, chainId, provider } = useWeb3React()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)

  const connections = getConnections()
  const getConnection = useGetConnection()

  const { activationState } = useActivationState()

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && isSupportedChain(chainId) && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletName = getConnection(connector).getName()
      const peerWalletAgent = provider ? getWalletMeta(provider)?.agent : undefined
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletName).length > 0
      sendAnalyticsEventAndUserInfo(account, walletName, chainId, isReconnect, peerWalletAgent)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType: walletName })
    }
    setLastActiveWalletAddress(account)
  }, [
    connectedWallets,
    addWalletToConnectedWallets,
    lastActiveWalletAddress,
    account,
    connector,
    chainId,
    provider,
    getConnection,
  ])

  const mgtmEnabled = useMgtmEnabled()

  return (
    <Wrapper data-testid="wallet-modal">
      <AutoRow justify="space-between" width="100%" marginBottom="16px">
        <ThemedText.SubHeader fontWeight={500}>Connect a wallet</ThemedText.SubHeader>
        <IconButton Icon={Settings} onClick={openSettings} data-testid="wallet-settings" />
      </AutoRow>
      {activationState.status === ActivationStatus.ERROR ? (
        <ConnectionErrorView state={activationState} />
      ) : (
        <AutoColumn gap="16px">
          <OptionGrid data-testid="option-grid">
            {connections.map((connection) =>
              // Hides Uniswap Wallet if mgtm is disabled
              connection.shouldDisplay() && !(connection.type === ConnectionType.UNIWALLET && !mgtmEnabled) ? (
                <Option key={connection.getName()} connection={connection} />
              ) : null
            )}
          </OptionGrid>
          <PrivacyPolicyWrapper>
            <PrivacyPolicyNotice />
          </PrivacyPolicyWrapper>
        </AutoColumn>
      )}
    </Wrapper>
  )
}
