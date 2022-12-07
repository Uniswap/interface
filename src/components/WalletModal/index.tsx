import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, EventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { sendEvent } from 'components/analytics'
import { BadgeVariant, SmallBadge } from 'components/Badge'
import { AutoColumn } from 'components/Column'
import { DownloadButton } from 'components/WalletDropdown/DownloadButton'
import { networkConnection } from 'connection'
import { getConnection, getConnectionName, getIsCoinbaseWallet, getIsInjected, getIsMetaMask } from 'connection/utils'
import { useCallback, useEffect, useState } from 'react'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import { useConnectedWallets } from 'state/wallets/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'
import { isMobile } from 'utils/userAgent'

import { BaseButton as LearnMoreButton } from '../WalletDropdown/DownloadButton'
import AccordionGroup from './Accordion/AccordionGroup'
import { CoinbaseWalletOption, OpenCoinbaseWalletOption } from './CoinbaseWalletOption'
import { InjectedOption, InstallMetaMaskOption, MetaMaskOption } from './InjectedOption'
import PendingView from './PendingView'
import { UniwalletOption } from './UniwalletOption'
import { WalletConnectOption } from './WalletConnectOption'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.backgroundSurface};
  margin: 0;
  padding: 0;
  width: 100%;
`

export const OptionGrid = styled.div`
  display: grid;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

const sendAnalyticsEventAndUserInfo = (
  account: string,
  walletType: string,
  chainId: number | undefined,
  isReconnect: boolean
) => {
  sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
    result: WalletConnectionResult.SUCCEEDED,
    wallet_address: account,
    wallet_type: walletType,
    is_reconnect: isReconnect,
  })
  user.set(CustomUserProperties.WALLET_ADDRESS, account)
  user.set(CustomUserProperties.WALLET_TYPE, walletType)
  if (chainId) {
    user.postInsert(CustomUserProperties.ALL_WALLET_CHAIN_IDS, chainId)
  }
  user.postInsert(CustomUserProperties.ALL_WALLET_ADDRESSES_CONNECTED, account)
}

export default function WalletModal() {
  const dispatch = useAppDispatch()
  const { connector, account, chainId } = useWeb3React()

  const [connectedWallets, addWalletToConnectedWallets] = useConnectedWallets()
  const [walletView, setWalletView] = useState(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
  const [lastActiveWalletAddress, setLastActiveWalletAddress] = useState<string | undefined>(account)

  const [pendingConnector, setPendingConnector] = useState<Connector | undefined>()
  const pendingError = useAppSelector((state) =>
    pendingConnector ? state.connection.errorByConnectionType[getConnection(pendingConnector).type] : undefined
  )

  const openOptions = useCallback(() => {
    setWalletView(WALLET_VIEWS.OPTIONS)
  }, [setWalletView])

  useEffect(() => {
    setWalletView(account ? WALLET_VIEWS.ACCOUNT : WALLET_VIEWS.OPTIONS)
  }, [setWalletView, account])

  useEffect(() => {
    if (pendingConnector && walletView !== WALLET_VIEWS.PENDING) {
      updateConnectionError({ connectionType: getConnection(pendingConnector).type, error: undefined })
      setPendingConnector(undefined)
    }
  }, [pendingConnector, walletView])

  // Keep the network connector in sync with any active user connector to prevent chain-switching on wallet disconnection.
  useEffect(() => {
    if (chainId && connector !== networkConnection.connector) {
      networkConnection.connector.activate(chainId)
    }
  }, [chainId, connector])

  // When new wallet is successfully set by the user, trigger logging of Amplitude analytics event.
  useEffect(() => {
    if (account && account !== lastActiveWalletAddress) {
      const walletType = getConnectionName(getConnection(connector).type, getIsMetaMask())
      const isReconnect =
        connectedWallets.filter((wallet) => wallet.account === account && wallet.walletType === walletType).length > 0
      sendAnalyticsEventAndUserInfo(account, walletType, chainId, isReconnect)
      if (!isReconnect) addWalletToConnectedWallets({ account, walletType })
    }
    setLastActiveWalletAddress(account)
  }, [connectedWallets, addWalletToConnectedWallets, lastActiveWalletAddress, account, connector, chainId])

  const tryActivation = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      // log selected wallet
      sendEvent({
        category: 'Wallet',
        action: 'Change Wallet',
        label: connectionType,
      })

      try {
        setPendingConnector(connector)
        setWalletView(WALLET_VIEWS.PENDING)
        dispatch(updateConnectionError({ connectionType, error: undefined }))

        await connector.activate()

        dispatch(updateSelectedWallet({ wallet: connectionType }))
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
        dispatch(updateConnectionError({ connectionType, error: error.message }))

        sendAnalyticsEvent(EventName.WALLET_CONNECT_TXN_COMPLETED, {
          result: WalletConnectionResult.FAILED,
          wallet_type: getConnectionName(connectionType, getIsMetaMask()),
        })
      }
    },
    [dispatch]
  )

  const isInjected = getIsInjected()
  const isMetaMask = getIsMetaMask()
  const isCoinbaseWallet = getIsCoinbaseWallet()

  const isCoinbaseWalletBrowser = isMobile && isCoinbaseWallet
  const isMetaMaskBrowser = isMobile && isMetaMask
  const isInjectedMobileBrowser = isCoinbaseWalletBrowser || isMetaMaskBrowser

  return (
    <Wrapper data-testid="wallet-modal">
      <AutoColumn gap="16px">
        {walletView === WALLET_VIEWS.PENDING && pendingConnector && (
          <PendingView
            openOptions={openOptions}
            connector={pendingConnector}
            error={!!pendingError}
            tryActivation={tryActivation}
          />
        )}
        {walletView !== WALLET_VIEWS.PENDING && (
          <OptionGrid data-testid="option-grid">
            <>
              <UniwalletOption tryActivation={tryActivation} />
              {!isInjected
                ? !isMobile && <InstallMetaMaskOption />
                : !isCoinbaseWallet &&
                  (isMetaMask ? (
                    <MetaMaskOption tryActivation={tryActivation} />
                  ) : (
                    <InjectedOption tryActivation={tryActivation} />
                  ))}
              {!isInjectedMobileBrowser ? <WalletConnectOption tryActivation={tryActivation} /> : null}
              {isMobile && !isInjectedMobileBrowser ? (
                <OpenCoinbaseWalletOption />
              ) : !isMobile || isCoinbaseWalletBrowser ? (
                <CoinbaseWalletOption tryActivation={tryActivation} />
              ) : null}
            </>
          </OptionGrid>
        )}
        <AccordionGroup
          options={[
            {
              header: "Don't have a wallet?",
              text: (
                <>
                  <ThemedText.Caption paddingBottom="12px">
                    With Uniswap Wallet, you can safely store and send tokens and NFTs, swap tokens, and connect to
                    crypto apps.
                  </ThemedText.Caption>
                  <DownloadButton text="Download the app" />
                </>
              ),
            },
            {
              header: "What's a wallet?",
              text: (
                <>
                  <ThemedText.Caption paddingBottom="12px">
                    Connecting with a crypto wallet is a new way to log into apps on the decentralized web.
                  </ThemedText.Caption>
                  <LearnMoreButton>Learn More</LearnMoreButton>
                </>
              ),
            },
          ]}
        />
        <ThemedText.Caption>
          <Trans>By connecting a wallet, you agree to Uniswap Labs&apos;</Trans>{' '}
          <ExternalLink href="https://uniswap.org/terms-of-service/">
            <Trans>Terms of Service</Trans>{' '}
          </ExternalLink>
          <Trans>and consent to its</Trans>{' '}
          <ExternalLink href="https://uniswap.org/privacy-policy">
            <Trans>Privacy Policy.</Trans>
          </ExternalLink>
          <UpdateBadge date="11.30.22" />
        </ThemedText.Caption>
      </AutoColumn>
    </Wrapper>
  )
}

const UpdateBadgeWrapper = styled.span`
  margin-left: 4px;
`

function UpdateBadge({ date }: { date: string }) {
  return (
    <UpdateBadgeWrapper>
      <SmallBadge variant={BadgeVariant.SOFT}>
        <ThemedText.UtilityBadge>{`Updated ${date}`}</ThemedText.UtilityBadge>
      </SmallBadge>
    </UpdateBadgeWrapper>
  )
}
