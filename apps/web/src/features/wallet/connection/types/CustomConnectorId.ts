import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

const CUSTOM_CONNECTOR_IDS = [
  CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
  CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID,
] as const

/** Type for non-standard wallet connectors that require custom handling. */
export type CustomConnectorId = (typeof CUSTOM_CONNECTOR_IDS)[number]
