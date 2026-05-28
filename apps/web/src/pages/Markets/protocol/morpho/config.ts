/* eslint-disable import/no-unused-modules */

import { FEWTOKEN_MAINNET_ROUTER_ADDRESS } from 'pages/Markets/protocol/morpho/mainnetExecution'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type MorphoAddress = `0x${string}`
export type MorphoMarketId = `0x${string}`

interface MorphoTokenInfo {
  address: MorphoAddress
  decimals: number
  symbol: string
  name: string
  logoAddress?: MorphoAddress
  logoChainId?: UniverseChainId
}

interface MorphoWrapperConfig {
  address: MorphoAddress
  wrapInput: 'underlying'
  unwrapInput: 'protocol'
}

export interface MorphoAssetAdapterConfig {
  underlying: MorphoTokenInfo
  protocol: MorphoTokenInfo
  wrapper?: MorphoWrapperConfig
}

export interface MorphoExecutionDeploymentConfig {
  routerAddress: MorphoAddress
  morphoAddress: MorphoAddress
}

export interface MorphoProtocolDeploymentConfig {
  chainId: UniverseChainId
  morphoAddress: MorphoAddress
  execution?: MorphoExecutionDeploymentConfig
}

interface MorphoMarketConfig {
  id: MorphoMarketId
  collateralToken: MorphoTokenKey
  loanToken: MorphoTokenKey
  label: string
}

interface MorphoVaultConfig {
  address: MorphoAddress
  asset: MorphoTokenKey
  label: string
}

export const MORPHO_DEMO_CHAIN_ID = UniverseChainId.Sepolia
export const MORPHO_MAINNET_ADDRESS: MorphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb'
export const FEWTOKEN_ROUTER_ADDRESS: MorphoAddress = '0x732E149C075E53FD7C30D190210C9706D220318e'
export const FEWTOKEN_ROUTER_MORPHO_ADDRESS: MorphoAddress = '0xd011EE229E7459ba1ddd22631eF7bF528d424A14'

// Sepolia demo fewtoken wrapper addresses
const FEWTOKEN_WRAPPERS = {
  WETH: '0x98b902eF4f9fEB2F6982ceEB4E98761294854D61',
  DAI: '0x09D8486e42Aa76229a563bFa0f07CA301aCd29C9',
  USDS: '0x4806333CE64088e466b3914Ed058CCA06684C9cE',
  USDe: '0x4AD1fAa40BC31Af8b6D4D36Ab57a231D1b095ECB',
  wstETH: '0x68E567874121b1eE0a6E663baD06331F11949b0C',
  LINK: '0x4fd72Bae7c80A603348f7737c564109fd705610E',
} as const satisfies Record<string, MorphoAddress>

// Mainnet fewtoken wrapper addresses
const FEWTOKEN_MAINNET_WRAPPERS = {
  WETH: '0xa250CC729Bb3323e7933022a67B52200fE354767',
  BTC: '0x2078f336Fdd260f708BEc4a20c82b063274E1b23',
  UNI: '0xE8E1F50392Bd61D0F8F48E8E7aF51D3b8a52090a',
  DAI: '0x8A6fe57C08C84e0f4eE97aAe68a62e820a37d259',
  USDC: '0x0492560FA7Cfd6A85E50D8bE3F77318994F8f429',
  USDT: '0xef87f4608e601E8564800265AeE1c1FfaDF73283',
} as const satisfies Record<string, MorphoAddress>

const FEWTOKEN_VAULTS = {
  DAI: '0x9D9d28A3ae26a40Ce8B904c89Cc3C515EF1C0475',
  USDS: '0xd8eBC4A3FE203E5f34F67E3bD0D436c3FB288140',
  USDe: '0xeF3435733B5D835a5d2B644E5EaB46C6598e6641',
} as const satisfies Record<string, MorphoAddress>

export const MORPHO_TOKENS = {
  // ── Sepolia demo tokens ────────────────────────────────────────
  WETH: {
    address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    logoAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    logoChainId: UniverseChainId.Mainnet,
  },
  USDC: {
    address: '0xA7a151d60Bbd522d3611C2dB3F1F972Ee9904B3e',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    logoAddress: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    logoChainId: UniverseChainId.Mainnet,
  },
  DAI: {
    address: '0x5fbad067f69eBbc276410D78fF52823be133eD48',
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    logoAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    logoChainId: UniverseChainId.Mainnet,
  },
  USDS: {
    address: '0x7C0e19803954135612cff07c04c9f4182d75cfD4',
    decimals: 18,
    symbol: 'USDS',
    name: 'USD Standard',
    logoAddress: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
    logoChainId: UniverseChainId.Mainnet,
  },
  USDe: {
    address: '0x9B75e974b2D05389B3920314a92b1560DF5EE1eB',
    decimals: 18,
    symbol: 'USDe',
    name: 'Ethena USDe',
    logoAddress: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    logoChainId: UniverseChainId.Mainnet,
  },
  wstETH: {
    address: '0x4AA5304A7e86c34A39835Ca329335e33B9faE2EF',
    decimals: 18,
    symbol: 'wstETH',
    name: 'Wrapped liquid staked Ether 2.0',
    logoAddress: '0x7f39c581f595b53c5cb5bbd8d3ea6c935e2ca0a0',
    logoChainId: UniverseChainId.Mainnet,
  },
  LINK: {
    address: '0xC7F04A3d6803A549e9e058A89Be4725C0Ac548C0',
    decimals: 18,
    symbol: 'LINK',
    name: 'ChainLink Token',
    logoAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
    logoChainId: UniverseChainId.Mainnet,
  },

  // ── Mainnet execution tokens (separate keys to preserve Sepolia demo) ──
  WETH_MAINNET: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    logoAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    logoChainId: UniverseChainId.Mainnet,
  },
  WBTC: {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    logoAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    logoChainId: UniverseChainId.Mainnet,
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    decimals: 18,
    symbol: 'UNI',
    name: 'Uniswap',
    logoAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    logoChainId: UniverseChainId.Mainnet,
  },
  USDC_MAINNET: {
    address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    logoAddress: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    logoChainId: UniverseChainId.Mainnet,
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether USD',
    logoAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    logoChainId: UniverseChainId.Mainnet,
  },
  DAI_MAINNET: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    logoAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    logoChainId: UniverseChainId.Mainnet,
  },
} as const satisfies Record<string, MorphoTokenInfo>

export type MorphoTokenKey = keyof typeof MORPHO_TOKENS

export const MORPHO_PROTOCOL_DEPLOYMENTS: Readonly<Record<number, MorphoProtocolDeploymentConfig>> = Object.freeze({
  [MORPHO_DEMO_CHAIN_ID]: {
    chainId: MORPHO_DEMO_CHAIN_ID,
    morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    execution: {
      routerAddress: FEWTOKEN_ROUTER_ADDRESS,
      morphoAddress: FEWTOKEN_ROUTER_MORPHO_ADDRESS,
    },
  },
  [UniverseChainId.Mainnet]: {
    chainId: UniverseChainId.Mainnet,
    morphoAddress: MORPHO_MAINNET_ADDRESS,
    ...(FEWTOKEN_MAINNET_ROUTER_ADDRESS
      ? {
          execution: {
            routerAddress: FEWTOKEN_MAINNET_ROUTER_ADDRESS,
            morphoAddress: MORPHO_MAINNET_ADDRESS,
          },
        }
      : {}),
  },
})

export const MORPHO_MAINNET_EXECUTION_TEMPLATE = Object.freeze({
  chainId: UniverseChainId.Mainnet,
  routerAddress: FEWTOKEN_MAINNET_ROUTER_ADDRESS,
  morphoAddress: MORPHO_MAINNET_ADDRESS,
})

export function getMorphoProtocolDeployment(chainId: number): MorphoProtocolDeploymentConfig | undefined {
  return MORPHO_PROTOCOL_DEPLOYMENTS[chainId]
}

export const MORPHO_ASSET_ADAPTERS: Record<MorphoTokenKey, MorphoAssetAdapterConfig> = {
  WETH: {
    underlying: MORPHO_TOKENS.WETH,
    protocol: {
      address: FEWTOKEN_WRAPPERS.WETH,
      decimals: 18,
      symbol: 'fwWETH',
      name: 'Few Wrapped Wrapped Ether',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.WETH,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  USDC: {
    underlying: MORPHO_TOKENS.USDC,
    protocol: MORPHO_TOKENS.USDC,
  },
  DAI: {
    underlying: MORPHO_TOKENS.DAI,
    protocol: {
      address: FEWTOKEN_WRAPPERS.DAI,
      decimals: 18,
      symbol: 'fwDAI',
      name: 'Few Wrapped Dai Stablecoin',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.DAI,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  USDS: {
    underlying: MORPHO_TOKENS.USDS,
    protocol: {
      address: FEWTOKEN_WRAPPERS.USDS,
      decimals: 18,
      symbol: 'fwUSDS',
      name: 'Few Wrapped USD Standard',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.USDS,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  USDe: {
    underlying: MORPHO_TOKENS.USDe,
    protocol: {
      address: FEWTOKEN_WRAPPERS.USDe,
      decimals: 18,
      symbol: 'fwUSDe',
      name: 'Few Wrapped Ethena USDe',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.USDe,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  wstETH: {
    underlying: MORPHO_TOKENS.wstETH,
    protocol: {
      address: FEWTOKEN_WRAPPERS.wstETH,
      decimals: 18,
      symbol: 'fwwstETH',
      name: 'Few Wrapped Wrapped liquid staked Ether 2.0',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.wstETH,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  LINK: {
    underlying: MORPHO_TOKENS.LINK,
    protocol: {
      address: FEWTOKEN_WRAPPERS.LINK,
      decimals: 18,
      symbol: 'fwLINK',
      name: 'Few Wrapped ChainLink Token',
    },
    wrapper: {
      address: FEWTOKEN_WRAPPERS.LINK,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },

  // ── Mainnet execution adapters ─────────────────────────────────
  WETH_MAINNET: {
    underlying: MORPHO_TOKENS.WETH_MAINNET,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.WETH,
      decimals: 18,
      symbol: 'fwWETH',
      name: 'Few Wrapped Ether',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.WETH,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  WBTC: {
    underlying: MORPHO_TOKENS.WBTC,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.BTC,
      decimals: 8,
      symbol: 'fwBTC',
      name: 'Few Wrapped Bitcoin',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.BTC,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  UNI: {
    underlying: MORPHO_TOKENS.UNI,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.UNI,
      decimals: 18,
      symbol: 'fwUNI',
      name: 'Few Wrapped Uniswap',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.UNI,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  USDC_MAINNET: {
    underlying: MORPHO_TOKENS.USDC_MAINNET,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.USDC,
      decimals: 6,
      symbol: 'fwUSDC',
      name: 'Few Wrapped USD Coin',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.USDC,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  USDT: {
    underlying: MORPHO_TOKENS.USDT,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.USDT,
      decimals: 6,
      symbol: 'fwUSDT',
      name: 'Few Wrapped Tether USD',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.USDT,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
  DAI_MAINNET: {
    underlying: MORPHO_TOKENS.DAI_MAINNET,
    protocol: {
      address: FEWTOKEN_MAINNET_WRAPPERS.DAI,
      decimals: 18,
      symbol: 'fwDAI',
      name: 'Few Wrapped Dai Stablecoin',
    },
    wrapper: {
      address: FEWTOKEN_MAINNET_WRAPPERS.DAI,
      wrapInput: 'underlying',
      unwrapInput: 'protocol',
    },
  },
}

export const MORPHO_MARKET_CONFIGS: MorphoMarketConfig[] = [
  {
    id: '0xCCB30F9DB4B3ADD563F8FE45154FA809AB79C61D85BB39766759CA28A4CCF136',
    collateralToken: 'WETH',
    loanToken: 'DAI',
    label: 'WETH -> DAI',
  },
  {
    id: '0xa37efd7f0c4c3d2671dccdd566a9751b76a4790a41c19b9e5bf9204d6939b835',
    collateralToken: 'WETH',
    loanToken: 'USDS',
    label: 'WETH -> USDS',
  },
  {
    id: '0xef8c336d0ab091900e1055f6d7207b4cd43d977e9847bafd6ad1b0853cd7ed1a',
    collateralToken: 'wstETH',
    loanToken: 'USDS',
    label: 'wstETH -> USDS',
  },
  {
    id: '0x0798f801b033c38536005c8044c981a0d5935d304316a9ab5fcb89f99e47400e',
    collateralToken: 'LINK',
    loanToken: 'USDS',
    label: 'LINK -> USDS',
  },
  {
    id: '0xf806f75d988926559f16a321b4e63107d1a8c1453c7074bfc73d6f43beba0e5a',
    collateralToken: 'WETH',
    loanToken: 'USDe',
    label: 'WETH -> USDe',
  },
  {
    id: '0x60c9c860d858442c3c73a6a5427b330fcd000f2c7d19258b9e93bd57b34e8f7d',
    collateralToken: 'wstETH',
    loanToken: 'USDe',
    label: 'wstETH -> USDe',
  },
]

export const MORPHO_VAULT_CONFIGS: MorphoVaultConfig[] = [
  {
    address: FEWTOKEN_VAULTS.DAI,
    asset: 'DAI',
    label: 'DAI Vault',
  },
  {
    address: FEWTOKEN_VAULTS.USDS,
    asset: 'USDS',
    label: 'USDS Vault',
  },
  {
    address: FEWTOKEN_VAULTS.USDe,
    asset: 'USDe',
    label: 'USDe Vault',
  },
]
