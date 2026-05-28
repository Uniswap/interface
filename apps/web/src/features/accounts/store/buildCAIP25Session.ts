import { DEFAULT_EVM_METHODS, EVM_NAMESPACE_IDENTIFIER } from 'uniswap/src/features/capabilities/caip25/constants'
import {
  CAIP25Session,
  CAIP372WalletInfo,
  SingleChainNamespaceScopeKey,
} from 'uniswap/src/features/capabilities/caip25/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Connector } from 'wagmi'

function getConnectorRdns(connector: Connector): string | undefined {
  if (typeof connector.rdns === 'string') {
    return connector.rdns
  }

  if (Array.isArray(connector.rdns)) {
    const firstRdns = connector.rdns[0]
    if (typeof firstRdns === 'string') {
      return firstRdns
    }
  }

  return undefined
}

/**
 * Builds a CAIP-25 session from wagmi connector and eip5792 capabilities data.
 *
 * @param params.connector - Wagmi connector instance
 * @param params.address - Wallet address
 * @param params.chainId - Current chain ID
 * @param params.capabilities - Capabilities data from wagmi's useCapabilities hook
 * @param params.includeAtomicCapability - Whether to include atomic capability in the session (default: true)
 * @returns Complete CAIP25Session object
 */
export function buildCAIP25Session(params: {
  connector?: Connector | null
  address?: string | null
  capabilities?: Record<string, Record<string, unknown>>
  enabledChains: UniverseChainId[]
  includeAtomicCapability?: boolean
}): CAIP25Session {
  const { connector, address, capabilities, enabledChains, includeAtomicCapability = true } = params

  // 1. Create wallet info
  const walletInfo: CAIP372WalletInfo = {
    uuid: connector?.uid ?? '',
    name: connector?.name ?? '',
    icon: connector?.icon,
    rdns: connector ? getConnectorRdns(connector) : undefined,
  }

  // 2. Create default scope
  const defaultScope = {
    chains: enabledChains.map((chainId) => chainId.toString()),
    accounts: address ? [address] : [],
    methods: DEFAULT_EVM_METHODS,
    notifications: [],
    capabilities: {},
  }

  // If we don't have 5792 capabilities, return the default scope
  if (!capabilities || Object.keys(capabilities).length === 0) {
    return {
      scopes: { [EVM_NAMESPACE_IDENTIFIER]: defaultScope },
      properties: {
        expiry: '0',
        walletInfo,
      },
    }
  }

  // 3. add overrides if we have capabilities
  const scopes: CAIP25Session['scopes'] = {}

  for (const [chainId, chainCapabilities] of Object.entries(capabilities)) {
    // Update the default scope to remove this chain we are overriding
    defaultScope.chains = defaultScope.chains.filter((c) => c !== chainId)

    const chainScopeKey: SingleChainNamespaceScopeKey = `${EVM_NAMESPACE_IDENTIFIER}:${chainId}`

    // Filter out atomic capability if one-click swap is disabled
    const filteredCapabilities = includeAtomicCapability
      ? chainCapabilities
      : Object.fromEntries(Object.entries(chainCapabilities).filter(([key]) => key !== 'atomic'))

    scopes[chainScopeKey] = {
      accounts: address ? [address] : [],
      methods: [...defaultScope.methods, 'wallet_sendCalls'],
      notifications: defaultScope.notifications,
      capabilities: filteredCapabilities,
    }
  }

  // `defaultScope` now only contains chains that don't have overrides -- add it to scopes
  scopes[`${EVM_NAMESPACE_IDENTIFIER}`] = defaultScope

  return {
    scopes,
    properties: {
      expiry: '0',
      walletInfo,
    },
  }
}
