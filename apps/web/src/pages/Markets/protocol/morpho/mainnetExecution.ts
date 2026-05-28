// Mainnet FewMorphoRouter execution configuration.
// All mainnet execution-specific addresses live here — rollout is a single file update.

interface FewtokenMainnetExecutionMarketConfig {
  marketId: `0x${string}`
  collateralAssetKey: string
  loanAssetKey: string
}

interface FewtokenMainnetExecutionVaultConfig {
  vaultAddress: `0x${string}`
  assetKey: string
}

export const FEWTOKEN_MAINNET_ROUTER_ADDRESS: `0x${string}` | undefined = '0x176F3aedaeeC9F65490803433d880F789467979d'

// collateralAssetKey / loanAssetKey must match keys in MORPHO_ASSET_ADAPTERS (config.ts).
// _MAINNET suffix keys distinguish mainnet tokens from Sepolia demo tokens.
export const FEWTOKEN_MAINNET_EXECUTION_MARKETS: readonly FewtokenMainnetExecutionMarketConfig[] = [
  // fwWETH collateral
  {
    marketId: '0x29cdb218675d395732eef7a806e53b8135b98a121c32579811fb78245d66c208',
    collateralAssetKey: 'WETH_MAINNET',
    loanAssetKey: 'USDC_MAINNET',
  },
  {
    marketId: '0x249d2c9e33e52990ec83b824b87135bd193f4c10b8546b08b6f886344be8951f',
    collateralAssetKey: 'WETH_MAINNET',
    loanAssetKey: 'USDT',
  },
  {
    marketId: '0x30a834d1d528aafa57d37e40f8ec2b0a12ad6c304edddddef0c8b50bec0e634b',
    collateralAssetKey: 'WETH_MAINNET',
    loanAssetKey: 'DAI_MAINNET',
  },
  // fwBTC collateral
  {
    marketId: '0x73a0be5679ba2382c8a36f05e1b1d3cb4f1e8f29ca422d4da5a69b65abf2bdfe',
    collateralAssetKey: 'WBTC',
    loanAssetKey: 'USDC_MAINNET',
  },
  {
    marketId: '0x008df4701e94fbeb1a04efa571cad8d8638af0ad57e18123430ca1b29768b52b',
    collateralAssetKey: 'WBTC',
    loanAssetKey: 'USDT',
  },
  {
    marketId: '0x14517db49f84dfd2ef3de085918d62b25982ccb2896c9195f9ffffaa7cbf84ff',
    collateralAssetKey: 'WBTC',
    loanAssetKey: 'DAI_MAINNET',
  },
  // fwUNI collateral
  {
    marketId: '0x326e69205500d7c4b96da8d18df90c5584c91d178b4730c51656d39f64388a2e',
    collateralAssetKey: 'UNI',
    loanAssetKey: 'USDC_MAINNET',
  },
  {
    marketId: '0x9780dbcca32562ff8b89c014294ed4ed1c262b8dcbb77f05bd1feacb355503ae',
    collateralAssetKey: 'UNI',
    loanAssetKey: 'USDT',
  },
  {
    marketId: '0xc73fd67d52aa7e33f507f79271ca099465adab7c3882d6cec47951a0806385e1',
    collateralAssetKey: 'UNI',
    loanAssetKey: 'DAI_MAINNET',
  },
]

// Vault addresses from DeployVaults output.
export const FEWTOKEN_MAINNET_EXECUTION_VAULTS: readonly FewtokenMainnetExecutionVaultConfig[] = [
  { vaultAddress: '0x310533D92D93c0dD7608D9A7B13017DA88a4828C', assetKey: 'USDC_MAINNET' }, // fwUSDC Vault
  { vaultAddress: '0x719b4b1F4c512F9a519F13D106EFA0B66bBACAD5', assetKey: 'USDT' }, // fwUSDT Vault
  { vaultAddress: '0x4fddD263891e6EdC5A56ed306B64FEAB2a4af74d', assetKey: 'DAI_MAINNET' }, // fwDAI  Vault
]
