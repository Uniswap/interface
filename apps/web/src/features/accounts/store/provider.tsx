import { WalletName as SolanaWalletName, WalletReadyState as SolanaWalletReadyState } from '@solana/wallet-adapter-base'
import { Wallet as SolanaWallet, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider/constants'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { createAccountsStoreGetters } from 'features/accounts/store/getters'
import type { ExternalConnector, ExternalSession, ExternalWallet, WebAccountsData } from 'features/accounts/store/types'
import { normalizeWalletName } from 'features/wallet/connection/connectors/multiplatform'
import { useConnectWalletMutation } from 'features/wallet/connection/hooks/useConnectWalletMutation'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS, CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import type { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { AccessPattern, Connector, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { createAccountsStoreContextProvider } from 'uniswap/src/features/accounts/store/utils/createAccountsStoreContextProvider'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { PlatformSpecificAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'
import { isChainIdOnPlatform } from 'uniswap/src/features/platforms/utils/chains'
import {
  UseAccountReturnType,
  // biome-ignore lint/style/noRestrictedImports: direct wagmi hooks needed for web wallet integration
  useAccount as useWagmiAccount,
  // biome-ignore lint/style/noRestrictedImports: direct wagmi hooks needed for web wallet integration
  useChainId as useWagmiChainId,
  useConnectors as useWagmiConnectors,
  Connector as WagmiConnector,
} from 'wagmi'

/**
 * Web package implementation of the unified accounts store architecture.
 * Transforms external wallet data (wagmi + solana-adapter) into our common format,
 * providing consistent APIs across web, mobile, and shared packages.
 */

/** Utility intermediary type, for storing a flat representation of a single wallet/account/connector grouping, for a single wallet on one platform. */
type PlatformWalletInfo<P extends Platform> = {
  platform: P
  /** A identifier provided by the external library that sources a wallet. */
  libraryId: P extends Platform.EVM ? string : SolanaWalletName
  connectorId: string
  walletName: string
  walletIcon?: string
  connectorStatus: ConnectorStatus
  accountInfo?: {
    address: PlatformSpecificAddress<P>
    chainId: number
  }
  injected: boolean

  deduplicationId: string
  analyticsWalletType: string
}

/** Maps wagmi connection statuses to our unified ConnectorStatus enum. */
const WAGMI_STATUS_TO_CONNECTOR_STATUS = {
  // We currently do not differentiate between reconnecting and connecting states.
  reconnecting: ConnectorStatus.Connecting,
  connecting: ConnectorStatus.Connecting,
  connected: ConnectorStatus.Connected,
  disconnected: ConnectorStatus.Disconnected,
}

/** Builds platform wallet info from wagmi connector and account data. */
function buildEVMWalletInfo(params: {
  connector: Pick<WagmiConnector, 'id' | 'type' | 'name' | 'icon'>
  accountData: UseAccountReturnType | undefined
  fallbackChainId: EVMUniverseChainId
}): PlatformWalletInfo<Platform.EVM> {
  const { connector, accountData, fallbackChainId } = params

  const connectorStatus = accountData
    ? WAGMI_STATUS_TO_CONNECTOR_STATUS[accountData.status]
    : ConnectorStatus.Disconnected

  const injected = connector.type === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE
  const walletIcon = connector.icon
  const walletName = connector.name
  const deduplicationId = normalizeWalletName(connector.name)
  const libraryId = connector.id
  const connectorId = 'WagmiConnector_' + libraryId

  const address = accountData?.address
  const chainId = accountData?.chainId ?? fallbackChainId

  const accountInfo = address ? { address, chainId } : undefined

  return {
    platform: Platform.EVM,
    connectorId,
    libraryId,
    walletName,
    walletIcon,
    connectorStatus,
    accountInfo,
    injected,
    deduplicationId,
    analyticsWalletType: walletTypeToAmplitudeWalletType(connector.type),
  }
}

/** Determines connector status for a Solana wallet based on connection state. */
function getSolanaWalletStatus(wallet: SolanaWallet, isCurrentWalletActive: boolean): ConnectorStatus {
  if (!isCurrentWalletActive) {
    return ConnectorStatus.Disconnected
  }

  if (wallet.adapter.connected) {
    return ConnectorStatus.Connected
  }
  if (wallet.adapter.connecting) {
    return ConnectorStatus.Connecting
  }
  return ConnectorStatus.Disconnected
}

/** Builds platform wallet info from Solana wallet adapter data. */
function buildSVMWalletInfo(wallet: SolanaWallet, isCurrentWalletActive: boolean): PlatformWalletInfo<Platform.SVM> {
  const connectorStatus = getSolanaWalletStatus(wallet, isCurrentWalletActive)
  const injected = wallet.readyState === SolanaWalletReadyState.Installed
  const walletIcon = wallet.adapter.icon
  const walletName = wallet.adapter.name
  const deduplicationId = normalizeWalletName(wallet.adapter.name)

  // `@solana/wallet-adapter` does not expose a unique id for the wallet -- name is used in lieu of a more formal id.
  const libraryId = wallet.adapter.name
  const connectorId = 'SolanaWalletAdapter_' + libraryId

  const accountInfo = wallet.adapter.publicKey
    ? { address: wallet.adapter.publicKey.toBase58(), chainId: UniverseChainId.Solana }
    : undefined

  return {
    platform: Platform.SVM,
    connectorId,
    libraryId,
    walletName,
    walletIcon,
    connectorStatus,
    injected,
    accountInfo,
    deduplicationId,
    // TODO(SWAP-17): get better amplitude type mapping for Solana wallet connectors
    analyticsWalletType: injected ? 'Browser Extension' : wallet.adapter.name,
  }
}

/** Creates a session with single-chain scope for external wallet connections. */
function buildSession<P extends Platform>(params: {
  walletId: string
  platform: P
  currentChainId: number
}): ExternalSession<P> {
  const { walletId, platform, currentChainId } = params

  return {
    walletId,
    currentAccountIndex: 0,
    chainScope: {
      type: ChainScopeType.SingleChain,
      supportedChains: 'all',
      currentChain:
        isUniverseChainId(currentChainId) && isChainIdOnPlatform(currentChainId, platform)
          ? { supportedByApp: true, currentChainId }
          : { supportedByApp: false, unsupportedChain: currentChainId },
    },
  }
}

/** Creates an Account from platform wallet info if account data is available. */
function buildAccount<P extends Platform>(info: PlatformWalletInfo<P>, walletId: string): Account<P> | undefined {
  if (info.accountInfo) {
    return {
      walletId,
      platform: info.platform,
      address: info.accountInfo.address,
    }
  }
  return undefined
}

/** Creates an ExternalConnector from platform wallet info with appropriate access pattern. */
function buildConnector<P extends Platform>(
  info: PlatformWalletInfo<P>,
  walletId: string,
): Connector<P, ExternalSession<P>> {
  const access = info.injected ? AccessPattern.Injected : AccessPattern.SDK
  const status = info.connectorStatus
  const id = info.connectorId

  if (status === ConnectorStatus.Disconnected) {
    return { id, access, status, session: undefined }
  }

  if (info.accountInfo) {
    const session = buildSession({ walletId, platform: info.platform, currentChainId: info.accountInfo.chainId })

    return { id, access, status, session }
  }

  if (status === ConnectorStatus.Connected) {
    throw new Error('Connected status with no account info provided is not supported.')
  }

  return { id, access, status, session: undefined }
}

/** Creates an EVM-specific connector with external library ID. */
function buildEVMConnector(info: PlatformWalletInfo<Platform.EVM>, walletId: string): ExternalConnector<Platform.EVM> {
  return { ...buildConnector(info, walletId), platform: info.platform, externalLibraryId: info.libraryId }
}

/** Creates an SVM-specific connector with external library ID. */
function buildSVMConnector(info: PlatformWalletInfo<Platform.SVM>, walletId: string): ExternalConnector<Platform.SVM> {
  return { ...buildConnector(info, walletId), platform: info.platform, externalLibraryId: info.libraryId }
}

/** Builds complete store components (wallet, connectors, accounts) from cross-platform wallet info. */
function buildStoreComponents({
  evm,
  svm,
}: {
  evm?: PlatformWalletInfo<Platform.EVM>
  svm?: PlatformWalletInfo<Platform.SVM>
}): {
  wallet: ExternalWallet
  evmConnector?: ExternalConnector<Platform.EVM>
  svmConnector?: ExternalConnector<Platform.SVM>
  accounts: Account<Platform>[]
} {
  // Merge all wallet infos into a single item, preferring fields from the EVM library.
  const infos: PlatformWalletInfo<Platform>[] = [evm, svm].flatMap((info) => (info ? [info] : []))
  const {
    libraryId: walletId,
    walletName,
    walletIcon,
    analyticsWalletType,
  } = infos.reduce((acc, info) => ({ ...info, ...acc }))

  const accounts: Account<Platform>[] = infos.flatMap((info) => buildAccount(info, walletId) ?? [])

  const evmConnector = evm ? buildEVMConnector(evm, walletId) : undefined
  const svmConnector = svm ? buildSVMConnector(svm, walletId) : undefined

  const wallet: ExternalWallet = {
    id: walletId,
    name: walletName,
    icon: CONNECTOR_ICON_OVERRIDE_MAP[walletName] ?? walletIcon,
    signingCapability: SigningCapability.Interactive,
    addresses: [
      accounts.reduce(
        (acc, account) => ({ ...acc, [account.platform]: account.address }),
        {} as { [P in Platform]?: PlatformSpecificAddress<P> },
      ),
    ],
    connectorIds: {
      [Platform.EVM]: evmConnector?.id,
      [Platform.SVM]: svmConnector?.id,
    },
    analyticsWalletType,
  }

  return { wallet, evmConnector, svmConnector, accounts }
}

/** Maps deduplication ids to the wallet infos that share that id (to deduplicate info for the same wallet on different platforms). */
type DeduplicationMap = {
  [id in string]: {
    [Platform.EVM]?: PlatformWalletInfo<Platform.EVM>
    [Platform.SVM]?: PlatformWalletInfo<Platform.SVM>
  }
}

/** Groups wallet infos by deduplication ID to handle cross-platform wallet instances. */
function buildDeduplicationMap(infos: PlatformWalletInfo<Platform>[]): DeduplicationMap {
  const map: DeduplicationMap = {}

  for (const info of infos) {
    const key = info.deduplicationId
    map[key] = { [info.platform]: info, ...map[key] }
  }
  return map
}

/** Builds the complete accounts state from platform wallet infos with deduplication. */
function buildAccountsState(
  infos: PlatformWalletInfo<Platform>[],
  isConnecting: boolean,
): Omit<WebAccountsData, 'connectionQuery'> {
  const activeConnectors: WebAccountsData['activeConnectors'] = {}
  const connectors: WebAccountsData['connectors'] = {}
  const accounts: WebAccountsData['accounts'] = {}
  const wallets: WebAccountsData['wallets'] = {}

  // Infos will contain separate entries for e.g. MetaMask on EVM vs MetaMask on SVM; these need to be deduplicated.
  const deduplicationMap = buildDeduplicationMap(infos)

  for (const crossPlatformInfos of Object.values(deduplicationMap)) {
    // Step 1: Build the store components, deduplicating cross platform data for the same wallet if needed.
    const components = buildStoreComponents(crossPlatformInfos)

    // Step 2: Store all connectors + references to active connectors.
    if (components.evmConnector) {
      if (components.evmConnector.status !== ConnectorStatus.Disconnected) {
        activeConnectors.evm = components.evmConnector
      }
      connectors[components.evmConnector.id] = components.evmConnector
    }
    if (components.svmConnector) {
      if (components.svmConnector.status !== ConnectorStatus.Disconnected) {
        activeConnectors.svm = components.svmConnector
      }
      connectors[components.svmConnector.id] = components.svmConnector
    }

    // Step 3: Store all accounts.
    for (const account of components.accounts) {
      accounts[account.address] = account
    }

    // Step 4: Store the wallet.
    wallets[components.wallet.id] = components.wallet
  }

  return { wallets, connectors, accounts, activeConnectors, connectionQueryIsPending: isConnecting }
}

// Uniswap wallet connect connector conflicts with the normal WC connector, so we leave it out of our config and add it manually here.
const UNISWAP_WALLET_CONNECTOR = {
  id: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  type: 'uniswapWalletConnect',
  name: CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET,
  icon: CONNECTOR_ICON_OVERRIDE_MAP[CONNECTION_PROVIDER_NAMES.UNISWAP_WALLET],
}

/** Hook that builds EVM wallet infos from wagmi connectors and account data. */
function useEVMWalletInfos(pendingConnection: ExternalWallet | undefined): PlatformWalletInfo<Platform.EVM>[] {
  const wagmiAccount = useWagmiAccount()
  const connectors = useWagmiConnectors()
  const fallbackChainId = useWagmiChainId()

  return useMemo(() => {
    return [...connectors, UNISWAP_WALLET_CONNECTOR].map((connector) => {
      const currentConnectorIsActive =
        connector.id === wagmiAccount.connector?.id || pendingConnection?.id === connector.id
      const accountData = currentConnectorIsActive ? wagmiAccount : undefined
      return buildEVMWalletInfo({ connector, accountData, fallbackChainId })
    })
  }, [connectors, wagmiAccount, fallbackChainId, pendingConnection])
}

/** Hook that builds SVM wallet infos from Solana wallet adapter data. */
function useSVMWalletInfos(): PlatformWalletInfo<Platform.SVM>[] {
  const solanaWallet = useSolanaWallet()
  const isSolanaEnabled = useFeatureFlag(FeatureFlags.Solana)

  return useMemo(() => {
    const activeSolanaWallet = solanaWallet.wallet
    const allSolanaWallets = solanaWallet.wallets

    if (!isSolanaEnabled) {
      return []
    }

    return allSolanaWallets.flatMap((wallet) => {
      const currentSolanaWalletIsActive = wallet.adapter.name === activeSolanaWallet?.adapter.name

      const walletToUse = currentSolanaWalletIsActive ? activeSolanaWallet : wallet

      // Ignore the coinbase adapter if the extension is not detected, as it errs upon connection attempt in this state.
      if (
        wallet.readyState === SolanaWalletReadyState.NotDetected &&
        wallet.adapter.name === CONNECTION_PROVIDER_NAMES.COINBASE_SOLANA_WALLET_ADAPTER
      ) {
        return []
      }

      return buildSVMWalletInfo(walletToUse, currentSolanaWalletIsActive)
    })
    // `@solana/wallet-adapter` has inconsistent behavior for when sub-fields of the `useSolanaWallet` return types re-render -- to account for this, we use the entire return value as a dependency instead of its fields.
  }, [solanaWallet, isSolanaEnabled])
}

/** Main hook that combines EVM and SVM wallet data into unified accounts state. */
function useAccountsState(): WebAccountsData {
  const { pendingWallet, isConnecting } = useConnectWalletMutation()

  const evmWalletInfos = useEVMWalletInfos(pendingWallet)
  const svmWalletInfos = useSVMWalletInfos()

  return useMemo(
    () => buildAccountsState([...evmWalletInfos, ...svmWalletInfos], isConnecting),
    [evmWalletInfos, svmWalletInfos, isConnecting],
  )
}

/** Web package accounts store provider and context hook. */
export const { AccountsStoreContextProvider: WebAccountsStoreProvider, useAccountsStoreContext } =
  createAccountsStoreContextProvider({
    useAppAccountsState: useAccountsState,
    createGetters: createAccountsStoreGetters,
  })
