import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { CurrencyAmount, Token as SdkToken } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  getEarnAmountValidation,
  getEarnDepositMinimumValidation,
  getEarnDepositPercentageInput,
  getEarnFiatPercentageInput,
  getEarnPercentageInput,
  getEarnWithdrawableAmount,
  getEarnWithdrawInputAmount,
  getMaxDepositTokenAmount,
  getProjectedAnnualEarnings,
} from 'uniswap/src/features/earn/amount'
import { EARN_MIN_DEPOSIT_USD } from 'uniswap/src/features/earn/config'
import {
  getEarnDepositSourceOptions,
  getEarnDepositSourceOptionsBySupport,
  getEarnVaultDepositSourceCurrencyIds,
} from 'uniswap/src/features/earn/depositSources'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnVaultDisplayCurrencyId,
  getEarnPositionInfo,
  getEarnPositionInfosByVaultId,
  getEarnVaultId,
  getEarnVaultInfo,
  getEarnVaultInfos,
  getEarnVaultsSortedForExplore,
  getEarnVaultTokenDetailsCurrencyIds,
  getEarnVaultsSortedByPosition,
  getTotalEarnDepositedUsd,
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  resolveEarnAmountPosition,
  selectEarnVaultForToken,
} from 'uniswap/src/features/earn/utils'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/withdrawDestination'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyIdWithThrow,
} from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_ADDRESS_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const BASE_USDT_ADDRESS = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'
const UNICHAIN_USDT0_ADDRESS = '0x9151434b16b9763660705744891fA906F660EcC5'
const ZKSYNC_USDT_ADDRESS = '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71B54bdA02913'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

function createDataApiVault(overrides: Partial<DataApiEarnVault> = {}): DataApiEarnVault {
  return new DataApiEarnVault({
    address: VAULT_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    name: 'Gauntlet USDC Prime',
    symbol: 'gtUSDCprime',
    underlyingToken: new Token({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: TokenType.ERC20,
    }),
    totalAssetsUsd: 50_000_000,
    liquidityUsd: 5_000_000,
    liquidityRaw: '5000000000000',
    apy: 0.052,
    netApy: 0.048,
    curatorName: 'Gauntlet',
    ...overrides,
  })
}

function createSharedVault(overrides: Partial<EarnVaultInfo> = {}): EarnVaultInfo {
  return {
    id: getEarnVaultId({
      chainId: UniverseChainId.Mainnet,
      vaultAddress: VAULT_ADDRESS,
    }),
    currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    vaultAddress: VAULT_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    apyPercent: 4,
    exposureCurrencyIds: [],
    exposures: [],
    totalDepositsUsd: 0,
    liquidityUsd: 0,
    curator: { name: 'Gauntlet' },
    ...overrides,
  }
}

function createBalance(quantity: number, balanceUSD: number | undefined): PortfolioBalance {
  return {
    quantity,
    balanceUSD,
    currencyInfo: undefined,
  } as unknown as PortfolioBalance
}

function createBalanceWithCurrencyId({
  balanceUSD,
  currencyId,
  quantity,
}: {
  balanceUSD: number | undefined
  currencyId: string
  quantity: number
}): PortfolioBalance {
  const chainId = Number(currencyId.split('-')[0]) as UniverseChainId
  const address = currencyId.split('-')[1] ?? ''
  return {
    quantity,
    balanceUSD,
    currencyInfo: {
      currencyId,
      currency:
        currencyId === buildNativeCurrencyId(chainId)
          ? nativeOnChain(chainId)
          : new SdkToken(chainId, address, 18, 'WETH'),
      logoUrl: undefined,
    },
  } as unknown as PortfolioBalance
}

describe('earn API mappers', () => {
  it('maps data-api vaults into frontend-ready EarnVaultInfo', () => {
    const vault = getEarnVaultInfo(createDataApiVault())

    expect(vault).toMatchObject({
      id: getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: VAULT_ADDRESS,
      }),
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
      vaultAddress: VAULT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      apyPercent: 4.8,
      totalDepositsUsd: 50_000_000,
      liquidityUsd: 5_000_000,
      liquidityRaw: '5000000000000',
      curator: { name: 'Gauntlet' },
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    })
    expect(vault?.deploymentDate).toBeUndefined()
    expect(vault?.morphoUrl).toBe('https://morpho.org/')
    expect(vault?.exposureAndRiskUrl).toBe(`https://app.morpho.org/ethereum/vault/${VAULT_ADDRESS}`)
  })

  it('defaults exposures to an empty list when the backend omits them', () => {
    expect(getEarnVaultInfo(createDataApiVault())?.exposures).toEqual([])
  })

  it('maps per-asset exposure breakdown with USD values and shares', () => {
    const exposureToken = new Token({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: TokenType.ERC20,
    })

    const vault = getEarnVaultInfo({
      ...createDataApiVault(),
      exposures: [
        { token: exposureToken, assetsRaw: '101500000000', assetsUsd: 101_500_000, share: 0.82 },
        { token: exposureToken, assetsRaw: '0' },
      ],
    } as unknown as Parameters<typeof getEarnVaultInfo>[0])

    expect(vault?.exposures).toEqual([
      { currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS), valueUsd: 101_500_000, share: 0.82 },
      { currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS), valueUsd: undefined, share: undefined },
    ])
  })

  it('filters out vaults without a supported chain or underlying token', () => {
    expect(getEarnVaultInfo(createDataApiVault({ chainId: 999_999 }))).toBeUndefined()
    expect(getEarnVaultInfo(createDataApiVault({ underlyingToken: undefined }))).toBeUndefined()
    expect(getEarnVaultInfo(createDataApiVault({ address: '' }))).toBeUndefined()

    expect(
      getEarnVaultInfos([
        createDataApiVault(),
        createDataApiVault({ chainId: 999_999 }),
        createDataApiVault({ underlyingToken: undefined }),
        createDataApiVault({ address: '' }),
      ]),
    ).toHaveLength(1)
  })

  it('maps native-currency vaults with native currency ids', () => {
    const vault = getEarnVaultInfo(
      createDataApiVault({
        underlyingToken: new Token({
          chainId: UniverseChainId.Mainnet,
          address: 'ETH',
          symbol: 'ETH',
          decimals: 18,
          name: 'Ethereum',
          type: TokenType.NATIVE,
        }),
      }),
    )

    expect(vault?.currencyId).toBe(buildNativeCurrencyId(UniverseChainId.Mainnet))
    expect(vault?.displayCurrencyId).toBe(buildNativeCurrencyId(UniverseChainId.Mainnet))
  })

  it('maps wrapped-native vaults to native display currency ids while preserving the underlying', () => {
    const wethCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)
    const ethCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const vault = getEarnVaultInfo(
      createDataApiVault({
        underlyingToken: new Token({
          chainId: UniverseChainId.Mainnet,
          address: WETH_ADDRESS,
          symbol: 'WETH',
          decimals: 18,
          name: 'Wrapped Ether',
          type: TokenType.ERC20,
        }),
      }),
    )

    expect(vault?.currencyId ? areCurrencyIdsEqual(vault.currencyId, wethCurrencyId) : false).toBe(true)
    expect(vault?.displayCurrencyId).toBe(ethCurrencyId)
    expect(getEarnVaultDisplayCurrencyId(wethCurrencyId)).toBe(ethCurrencyId)
  })

  it('falls back to gross APY when net APY is missing', () => {
    const vault = getEarnVaultInfo(createDataApiVault({ netApy: undefined }))

    expect(vault?.apyPercent).toBe(5.2)
  })

  it('maps API positions and indexes them by vault id', () => {
    const position = new DataApiEarnPosition({
      vault: createDataApiVault(),
      sharesRaw: '1000000000000000000000',
      currentAssetsRaw: '1005000000',
      currentAssetsUsd: 1005,
    })

    const mappedPosition = getEarnPositionInfo(position)

    expect(mappedPosition).toEqual({
      vaultId: getEarnVaultId({
        chainId: UniverseChainId.Mainnet,
        vaultAddress: VAULT_ADDRESS,
      }),
      depositedUsd: 1005,
      depositedRaw: '1005000000',
      apyPercent: 4.8,
      sharesRaw: '1000000000000000000000',
    })
    expect(getEarnPositionInfosByVaultId([position]).get(mappedPosition?.vaultId ?? '')).toEqual(mappedPosition)
  })

  it('defaults missing raw position amounts to zero', () => {
    const mappedPosition = getEarnPositionInfo(
      new DataApiEarnPosition({
        vault: createDataApiVault(),
        currentAssetsUsd: 0,
      }),
    )

    expect(mappedPosition).toMatchObject({
      depositedRaw: '0',
      sharesRaw: '0',
    })
  })

  it('builds currency ids for token project deployments', () => {
    expect(
      getTokenProjectCurrencyIds([
        { chain: GraphQLApi.Chain.Ethereum, address: USDC_ADDRESS },
        { chain: GraphQLApi.Chain.Ethereum, address: null },
        { chain: GraphQLApi.Chain.Base, address: BASE_USDC_ADDRESS },
      ]),
    ).toEqual([
      buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
      buildCurrencyId(UniverseChainId.Base, BASE_USDC_ADDRESS),
    ])
  })

  it('selects the highest APY vault for a token regardless of address casing', () => {
    expect(
      selectEarnVaultForToken({
        tokenCurrencyIds: [buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS_LOWERCASE)],
        vaults: [createSharedVault({ apyPercent: 4 }), createSharedVault({ id: 'higher', apyPercent: 5.25 })],
      })?.id,
    ).toBe('higher')
  })

  it('selects wrapped-native vaults from native and wrapped token details pages', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })

    expect(getEarnVaultTokenDetailsCurrencyIds(vault)).toEqual([
      buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      buildNativeCurrencyId(UniverseChainId.Mainnet),
    ])
    expect(
      selectEarnVaultForToken({
        tokenCurrencyIds: [buildNativeCurrencyId(UniverseChainId.Mainnet)],
        vaults: [vault],
      }),
    ).toBe(vault)
    expect(
      selectEarnVaultForToken({
        tokenCurrencyIds: [buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)],
        vaults: [vault],
      }),
    ).toBe(vault)
  })

  it('includes native and wrapped deposit source ids for wrapped-native vaults', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })

    expect(
      getEarnVaultDepositSourceCurrencyIds({
        vault,
        tokenProjectCurrencyIds: [
          buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
          buildCurrencyId(UniverseChainId.Base, BASE_WETH_ADDRESS),
        ],
      }),
    ).toEqual([
      buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      buildNativeCurrencyId(UniverseChainId.Mainnet),
      buildCurrencyId(UniverseChainId.Base, BASE_WETH_ADDRESS),
      buildNativeCurrencyId(UniverseChainId.Base),
    ])
  })

  it('builds deposit source options for same-chain ETH and WETH balances', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const nativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const wrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [wrappedCurrencyId],
      portfolioBalances: {
        [nativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: nativeCurrencyId,
          quantity: 1,
          balanceUSD: 3000,
        }),
        [wrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: wrappedCurrencyId,
          quantity: 2,
          balanceUSD: 6000,
        }),
      },
    })

    expect(options.map((option) => option.id)).toEqual([wrappedCurrencyId, nativeCurrencyId])
  })

  it('sorts wrapped-native deposit source options by balance with deterministic tie-breakers', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const mainnetNativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const baseNativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Base)
    const baseWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Base)
    const unichainNativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Unichain)
    const unichainWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Unichain)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [unichainWrappedCurrencyId, baseWrappedCurrencyId],
      portfolioBalances: {
        [unichainNativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: unichainNativeCurrencyId,
          quantity: 0.5,
          balanceUSD: 1_500,
        }),
        [baseWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: baseWrappedCurrencyId,
          quantity: 3,
          balanceUSD: 10_000,
        }),
        [mainnetNativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: mainnetNativeCurrencyId,
          quantity: 1,
          balanceUSD: 3_000,
        }),
        [unichainWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: unichainWrappedCurrencyId,
          quantity: 2,
          balanceUSD: 6_000,
        }),
        [baseNativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: baseNativeCurrencyId,
          quantity: 3,
          balanceUSD: 10_000,
        }),
      },
    })

    expect(options.map((option) => option.id)).toEqual([
      baseNativeCurrencyId,
      baseWrappedCurrencyId,
      unichainWrappedCurrencyId,
      mainnetNativeCurrencyId,
      unichainNativeCurrencyId,
    ])
  })

  it('ranks priced deposit sources above unpriced ones regardless of token-unit size', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const baseWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Base)
    const mainnetNativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [baseWrappedCurrencyId],
      portfolioBalances: {
        [baseWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: baseWrappedCurrencyId,
          quantity: 1_000_000,
          balanceUSD: undefined,
        }),
        [mainnetNativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: mainnetNativeCurrencyId,
          quantity: 0.01,
          balanceUSD: 50,
        }),
      },
    })

    expect(options.map((option) => option.id)).toEqual([mainnetNativeCurrencyId, baseWrappedCurrencyId])
  })

  it('splits deposit source options by chained-actions chain support', () => {
    const vault = createSharedVault()
    const mainnetCurrencyId = vault.currencyId
    const polygonCurrencyId = buildCurrencyId(UniverseChainId.Polygon, USDC_ADDRESS)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [polygonCurrencyId],
      portfolioBalances: {
        [mainnetCurrencyId]: createBalanceWithCurrencyId({
          currencyId: mainnetCurrencyId,
          quantity: 1,
          balanceUSD: 1,
        }),
        [polygonCurrencyId]: createBalanceWithCurrencyId({
          currencyId: polygonCurrencyId,
          quantity: 2,
          balanceUSD: 2,
        }),
      },
    })

    expect(getEarnDepositSourceOptionsBySupport({ depositSourceOptions: options })).toEqual({
      supportedDepositSourceOptions: [expect.objectContaining({ id: mainnetCurrencyId })],
      unsupportedDepositSourceOptions: [expect.objectContaining({ id: polygonCurrencyId })],
    })
  })

  it('treats zero USD balances as unpriced and orders them by token quantity', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const mainnetNativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const baseWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Base)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [baseWrappedCurrencyId],
      portfolioBalances: {
        [mainnetNativeCurrencyId]: createBalanceWithCurrencyId({
          currencyId: mainnetNativeCurrencyId,
          quantity: 5,
          balanceUSD: 0,
        }),
        [baseWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: baseWrappedCurrencyId,
          quantity: 10,
          balanceUSD: 0,
        }),
      },
    })

    // Both rows have balanceUsd === 0 so they're treated as unpriced and ranked by token quantity.
    // Native-first tie-breaker doesn't kick in because the quantities differ.
    expect(options.map((option) => option.id)).toEqual([baseWrappedCurrencyId, mainnetNativeCurrencyId])
  })

  it('breaks ties by chainId when balances and nativeness match', () => {
    const vault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const baseWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Base)
    const unichainWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Unichain)
    const mainnetWrappedCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)

    const options = getEarnDepositSourceOptions({
      vault,
      tokenProjectCurrencyIds: [unichainWrappedCurrencyId, baseWrappedCurrencyId],
      portfolioBalances: {
        [unichainWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: unichainWrappedCurrencyId,
          quantity: 1,
          balanceUSD: 100,
        }),
        [baseWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: baseWrappedCurrencyId,
          quantity: 1,
          balanceUSD: 100,
        }),
        [mainnetWrappedCurrencyId]: createBalanceWithCurrencyId({
          currencyId: mainnetWrappedCurrencyId,
          quantity: 1,
          balanceUSD: 100,
        }),
      },
    })

    // All three wrapped tokens tie on USD and nativeness; ascending chainId then breaks the tie:
    // Mainnet (1) < Unichain (130) < Base (8453).
    expect(options.map((option) => option.chainId)).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Unichain,
      UniverseChainId.Base,
    ])
  })

  it('uses destination-chain assets for withdraw destinations', () => {
    const wrappedNativeVault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const usdcVault = createSharedVault()
    const mainnetUsdt = getChainInfo(UniverseChainId.Mainnet).tokens.USDT
    const unichainUsdc = getChainInfo(UniverseChainId.Unichain).tokens.USDC
    const optimismUsdt = getChainInfo(UniverseChainId.Optimism).tokens.USDT
    if (!mainnetUsdt || !unichainUsdc || !optimismUsdt) {
      throw new Error('Expected stablecoin fixtures to be configured')
    }
    const usdtVault = createSharedVault({
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, mainnetUsdt.address),
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, mainnetUsdt.address),
    })
    const unsupportedTokenAddress = '0x0000000000000000000000000000000000000001'
    const unsupportedVault = createSharedVault({
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, unsupportedTokenAddress),
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, unsupportedTokenAddress),
    })

    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: wrappedNativeVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBe(buildNativeCurrencyId(UniverseChainId.Unichain))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdcVault,
        destinationChainId: UniverseChainId.Mainnet,
      }),
    ).toBe(usdcVault.currencyId)
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdcVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBe(buildCurrencyId(UniverseChainId.Unichain, unichainUsdc.address))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdtVault,
        destinationChainId: UniverseChainId.Optimism,
      }),
    ).toBe(buildCurrencyId(UniverseChainId.Optimism, optimismUsdt.address))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdtVault,
        destinationChainId: UniverseChainId.Base,
      }),
    ).toBe(buildCurrencyId(UniverseChainId.Base, BASE_USDT_ADDRESS))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdtVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBe(buildCurrencyId(UniverseChainId.Unichain, UNICHAIN_USDT0_ADDRESS))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdtVault,
        destinationChainId: UniverseChainId.Zksync,
      }),
    ).toBe(buildCurrencyId(UniverseChainId.Zksync, ZKSYNC_USDT_ADDRESS))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: unsupportedVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBeUndefined()
  })

  it('falls back to token price when USD balance is unavailable', () => {
    expect(
      getTokenBalanceUsd({
        balance: createBalance(10, undefined),
        tokenPriceUsd: 1,
      }),
    ).toBe(10)
  })

  it('computes projected annual earnings from APY', () => {
    expect(getProjectedAnnualEarnings({ balance: 1_000, apyPercent: 5.23 })).toBeCloseTo(52.3)
  })

  it('builds percentage amount inputs from local fiat when USD balance is priced', () => {
    expect(
      getEarnPercentageInput({
        balanceQuantity: 2,
        balanceUsd: 6_000,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd * 1.5,
        percentage: 0.25,
        tokenDecimals: 18,
      }),
    ).toEqual({
      exactAmountFiat: '2250.00',
      exactAmountToken: '0.500000000000000000',
      inputInFiat: true,
    })
  })

  it('builds percentage amount inputs from token balance when fiat pricing is missing', () => {
    expect(
      getEarnPercentageInput({
        balanceQuantity: 2,
        balanceUsd: undefined,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd * 1.5,
        percentage: 0.25,
        tokenDecimals: 6,
      }),
    ).toEqual({
      exactAmountFiat: '',
      exactAmountToken: '0.500000',
      inputInFiat: false,
    })
  })

  it('forces 100% deposit shortcuts into exact token units when a raw Max amount is available', () => {
    expect(
      getEarnDepositPercentageInput({
        balanceQuantity: 1,
        balanceUsd: 1,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd,
        exactMaxTokenAmount: '0.999999999999999999',
        percentage: 1,
        tokenDecimals: 18,
      }),
    ).toEqual({
      exactAmountFiat: '1.00',
      exactAmountToken: '0.999999999999999999',
      inputInFiat: false,
    })
  })

  it('builds withdraw percentage amount inputs from local fiat', () => {
    expect(
      getEarnFiatPercentageInput({
        balanceUsd: 1_000,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd * 1.5,
        percentage: 0.5,
      }),
    ).toBe('750.00')
  })

  it('can round max withdraw fiat input down so it does not exceed available liquidity', () => {
    expect(
      getEarnFiatPercentageInput({
        balanceUsd: 10.005,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd,
        percentage: 1,
        rounding: 'down',
      }),
    ).toBe('10.00')
  })

  it('does not round an 18-decimal Max deposit above the raw wallet balance', () => {
    const dai = new SdkToken(UniverseChainId.Mainnet, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai')

    expect(
      getMaxDepositTokenAmount({
        balanceQuantity: 1,
        balanceRaw: '999999999999999999',
        currency: dai,
      }),
    ).toBe('0.999999999999999999')
  })

  it('uses the exact raw balance for 6-decimal and native Max deposits', () => {
    const usdc = new SdkToken(UniverseChainId.Mainnet, USDC_ADDRESS, 6, 'USDC', 'USD Coin')

    expect(
      getMaxDepositTokenAmount({
        balanceQuantity: 123.456789,
        balanceRaw: '123456789',
        currency: usdc,
      }),
    ).toBe('123.456789')
    expect(
      getMaxDepositTokenAmount({
        balanceQuantity: 1,
        balanceRaw: '999999999999999999',
        currency: nativeOnChain(UniverseChainId.Mainnet),
      }),
    ).toBe('0.999999999999999999')
  })

  it('falls back to the float-derived Max deposit amount when no raw balance is available', () => {
    const usdc = new SdkToken(UniverseChainId.Mainnet, USDC_ADDRESS, 6, 'USDC', 'USD Coin')

    expect(
      getMaxDepositTokenAmount({
        balanceQuantity: 1.5,
        balanceRaw: undefined,
        currency: usdc,
      }),
    ).toBe('1.500000')
  })

  it('validates earn amount entries against comparable balances', () => {
    expect(
      getEarnAmountValidation({
        availableAmount: 1,
        comparisonAmount: 1.1,
        inputAmount: 10,
      }),
    ).toEqual({
      hasAmount: true,
      isOverBalance: true,
      isReviewDisabled: true,
    })
    expect(
      getEarnAmountValidation({
        availableAmount: 1,
        comparisonAmount: 0.9,
        inputAmount: 10,
      }),
    ).toEqual({
      hasAmount: true,
      isOverBalance: false,
      isReviewDisabled: false,
    })
    expect(
      getEarnAmountValidation({
        availableAmount: 1,
        comparisonAmount: undefined,
        inputAmount: 10,
      }),
    ).toMatchObject({ isReviewDisabled: true })
  })

  it('never flags max withdrawals as over balance when skipOverBalanceCheck is set', () => {
    // The displayed fiat amount can round a hair above the available balance, but MAX_SHARES
    // redeems the full position regardless, so review must stay enabled.
    expect(
      getEarnAmountValidation({
        availableAmount: 12,
        comparisonAmount: 12.01,
        inputAmount: 12.01,
        skipOverBalanceCheck: true,
      }),
    ).toEqual({
      hasAmount: true,
      isOverBalance: false,
      isReviewDisabled: false,
    })
  })

  it('only flags deposit amounts below the minimum after the user enters a positive amount', () => {
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: 0,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(false)
    expect(
      getEarnDepositMinimumValidation({
        hasInputAmount: true,
        inputAmount: 0,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(true)
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: EARN_MIN_DEPOSIT_USD - 0.01,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(true)
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: EARN_MIN_DEPOSIT_USD,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(false)
  })

  it('accepts deposit amounts that round to the minimum at display precision', () => {
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: EARN_MIN_DEPOSIT_USD - 0.0001,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(false)
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: EARN_MIN_DEPOSIT_USD - 0.006,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(true)
    expect(
      getEarnDepositMinimumValidation({
        fiatDecimals: 0,
        inputAmount: EARN_MIN_DEPOSIT_USD - 0.4,
        minimumAmount: EARN_MIN_DEPOSIT_USD,
      }),
    ).toBe(false)
  })

  it('rounds half-cent boundaries like Intl.NumberFormat display formatting', () => {
    // 1.005 and 1.006 both render as "$1.01", but Math.round(1.005 * 100) is 100 from float error
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: 1.005,
        minimumAmount: 1.006,
      }),
    ).toBe(false)
    // 2.005 also renders as "$2.01"; its float error survives a Number.EPSILON nudge
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: 2.005,
        minimumAmount: 2.01,
      }),
    ).toBe(false)
    expect(
      getEarnDepositMinimumValidation({
        inputAmount: 1.004,
        minimumAmount: 1.005,
      }),
    ).toBe(true)
  })

  it('uses share units for MAX_SHARES withdraw quote amounts', () => {
    const currency = new SdkToken(UniverseChainId.Mainnet, USDC_ADDRESS, 6, 'USDC')
    const exactAssetsAmount = CurrencyAmount.fromRawAmount(currency, '123456')
    const position = { depositedRaw: '1000000', sharesRaw: '987654321' }

    expect(
      getEarnWithdrawInputAmount({
        currency,
        exactAssetsAmount,
        position,
        withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS,
      })?.quotient.toString(),
    ).toBe('123456')
    expect(
      getEarnWithdrawInputAmount({
        currency,
        exactAssetsAmount,
        position,
        withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      })?.quotient.toString(),
    ).toBe('987654321')
  })

  it('waits for confirmed raw shares before building MAX_SHARES withdraw quote amounts', () => {
    const currency = new SdkToken(UniverseChainId.Mainnet, USDC_ADDRESS, 6, 'USDC')

    expect(
      getEarnWithdrawInputAmount({
        currency,
        exactAssetsAmount: undefined,
        position: { depositedRaw: '0', sharesRaw: '0' },
        withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      }),
    ).toBeUndefined()
    expect(
      getEarnWithdrawInputAmount({
        currency,
        exactAssetsAmount: undefined,
        position: { depositedRaw: '1000000', sharesRaw: '0' },
        withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      }),
    ).toBeUndefined()
  })

  it('uses full position amount when vault liquidity can cover the withdrawal', () => {
    expect(
      getEarnWithdrawableAmount({
        position: {
          depositedRaw: '1000000',
          depositedUsd: 100,
        },
        vault: createSharedVault({
          liquidityRaw: '1000000',
          liquidityUsd: 100,
        }),
      }),
    ).toEqual({
      availableRaw: '1000000',
      availableUsd: 100,
      isLiquidityLimited: false,
    })
  })

  it('does not cap withdrawals when raw vault liquidity is unavailable', () => {
    expect(
      getEarnWithdrawableAmount({
        position: {
          depositedRaw: '1000000',
          depositedUsd: 100,
        },
        vault: createSharedVault({
          liquidityRaw: undefined,
          liquidityUsd: 25,
        }),
      }),
    ).toEqual({
      availableRaw: '1000000',
      availableUsd: 100,
      isLiquidityLimited: false,
    })
  })

  it('caps withdrawable amount when vault liquidity is below the user position', () => {
    expect(
      getEarnWithdrawableAmount({
        position: {
          depositedRaw: '1000000',
          depositedUsd: 100,
        },
        vault: createSharedVault({
          liquidityRaw: '250000',
          liquidityUsd: 25,
        }),
      }),
    ).toEqual({
      availableRaw: '250000',
      availableUsd: 25,
      isLiquidityLimited: true,
    })
  })

  it('never shows a capped withdrawable USD amount above the user position', () => {
    expect(
      getEarnWithdrawableAmount({
        position: {
          depositedRaw: '1000000',
          depositedUsd: 100,
        },
        vault: createSharedVault({
          liquidityRaw: '250000',
          liquidityUsd: 200,
        }),
      }).availableUsd,
    ).toBe(100)
  })

  it('falls back to a raw amount ratio when capped liquidity USD is unavailable', () => {
    expect(
      getEarnWithdrawableAmount({
        position: {
          depositedRaw: '1000000',
          depositedUsd: 100,
        },
        vault: createSharedVault({
          liquidityRaw: '250000',
          liquidityUsd: 0,
        }),
      }),
    ).toEqual({
      availableRaw: '250000',
      availableUsd: 25,
      isLiquidityLimited: true,
    })
  })

  it('keeps tiny positive raw liquidity withdrawable when capped liquidity USD is unavailable', () => {
    const withdrawable = getEarnWithdrawableAmount({
      position: {
        depositedRaw: '1000000000000',
        depositedUsd: 100,
      },
      vault: createSharedVault({
        liquidityRaw: '100000',
        liquidityUsd: 0,
      }),
    })

    expect(withdrawable.availableRaw).toBe('100000')
    expect(withdrawable.availableUsd).toBeCloseTo(0.00001)
    expect(withdrawable.isLiquidityLimited).toBe(true)
  })

  it('sums active earn deposits by USD value', () => {
    expect(
      getTotalEarnDepositedUsd([
        {
          vaultId: '1-0xvault-1',
          depositedUsd: 100,
          depositedRaw: '100000000',
          apyPercent: 1,
          sharesRaw: '1',
        },
        {
          vaultId: '1-0xvault-2',
          depositedUsd: 25,
          depositedRaw: '25000000',
          apyPercent: 1,
          sharesRaw: '1',
        },
        {
          vaultId: '1-0xvault-3',
          depositedUsd: 10,
          depositedRaw: '0',
          apyPercent: 1,
          sharesRaw: '0',
        },
      ]),
    ).toBe(135)
  })

  it('sorts vaults with active positions first by deposited USD value', () => {
    const vaultWithoutPosition = createSharedVault({
      id: 'vault-without-position',
    })
    const smallerPositionVault = createSharedVault({
      id: 'smaller-position-vault',
    })
    const largerPositionVault = createSharedVault({
      id: 'larger-position-vault',
    })
    const positionsByVaultId = new Map([
      [
        smallerPositionVault.id,
        {
          vaultId: smallerPositionVault.id,
          depositedUsd: 25,
          depositedRaw: '25000000',
          apyPercent: 1,
          sharesRaw: '1',
        },
      ],
      [
        largerPositionVault.id,
        {
          vaultId: largerPositionVault.id,
          depositedUsd: 100,
          depositedRaw: '100000000',
          apyPercent: 1,
          sharesRaw: '1',
        },
      ],
    ])

    expect(
      getEarnVaultsSortedByPosition({
        positionsByVaultId,
        vaults: [vaultWithoutPosition, smallerPositionVault, largerPositionVault],
      }).map((vault) => vault.id),
    ).toEqual([largerPositionVault.id, smallerPositionVault.id, vaultWithoutPosition.id])
  })

  it('sorts Explore vaults in the launch order', () => {
    const usdtVault = createSharedVault({
      id: 'usdt-vault',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDT_ADDRESS),
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDT_ADDRESS),
    })
    const usdcVault = createSharedVault({
      id: 'usdc-vault',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    })
    const ethVault = createSharedVault({
      id: 'eth-vault',
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const unknownVault = createSharedVault({
      id: 'unknown-vault',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
    })

    expect(
      getEarnVaultsSortedForExplore([ethVault, usdcVault, unknownVault, usdtVault]).map((vault) => vault.id),
    ).toEqual([usdtVault.id, usdcVault.id, ethVault.id, unknownVault.id])
  })

  it('treats positions with deposited USD or raw shares as existing deposits', () => {
    expect(
      hasEarnPosition({
        vaultId: '1-0xvault',
        depositedUsd: 1,
        depositedRaw: '0',
        apyPercent: 1,
        sharesRaw: '0',
      }),
    ).toBe(true)
    expect(
      hasEarnPosition({
        vaultId: '1-0xvault',
        depositedUsd: 0,
        depositedRaw: '1000000',
        apyPercent: 1,
        sharesRaw: '0',
      }),
    ).toBe(true)
    expect(
      hasEarnPosition({
        vaultId: '1-0xvault',
        depositedUsd: 0,
        depositedRaw: '0',
        apyPercent: 1,
        sharesRaw: '1000000',
      }),
    ).toBe(true)
    expect(
      hasEarnPosition({
        vaultId: '1-0xvault',
        depositedUsd: 0,
        depositedRaw: '0',
        apyPercent: 1,
        sharesRaw: '0',
      }),
    ).toBe(false)
  })
})

describe(resolveEarnAmountPosition, () => {
  // The post-first-deposit snapshot: synthesized optimistically with zero raw balances.
  const optimisticSnapshot: EarnPositionInfo = {
    vaultId: '1-0xvault',
    depositedUsd: 12,
    depositedRaw: '0',
    apyPercent: 5,
    sharesRaw: '0',
  }

  const confirmedLivePosition: EarnPositionInfo = {
    vaultId: '1-0xvault',
    depositedUsd: 11.98,
    depositedRaw: '11980000',
    apyPercent: 5,
    sharesRaw: '11900000',
  }

  it('keeps the snapshot while the live query has not resolved', () => {
    expect(
      resolveEarnAmountPosition({
        livePosition: undefined,
        snapshotPosition: optimisticSnapshot,
      }),
    ).toBe(optimisticSnapshot)
  })

  it('keeps the snapshot while the live position is still an unconfirmed optimistic merge (zero raw)', () => {
    expect(
      resolveEarnAmountPosition({
        livePosition: { ...optimisticSnapshot },
        snapshotPosition: optimisticSnapshot,
      }),
    ).toBe(optimisticSnapshot)
  })

  it('switches to the live position once raw balances are confirmed (first-deposit withdraw bug)', () => {
    // Sequence: startWithdraw snapshots the zero-raw optimistic position, then GetEarnPosition
    // resolves with real raw balances — the withdraw view must un-gate without re-entering.
    expect(
      resolveEarnAmountPosition({
        livePosition: confirmedLivePosition,
        snapshotPosition: optimisticSnapshot,
      }),
    ).toBe(confirmedLivePosition)
  })

  it('prefers the live position over an already-confirmed snapshot (normal withdraw path)', () => {
    const confirmedSnapshot: EarnPositionInfo = {
      ...confirmedLivePosition,
      depositedUsd: 12,
      depositedRaw: '12000000',
      sharesRaw: '12000000',
    }

    expect(
      resolveEarnAmountPosition({
        livePosition: confirmedLivePosition,
        snapshotPosition: confirmedSnapshot,
      }),
    ).toBe(confirmedLivePosition)
  })

  it('ignores a confirmed live position for a different vault', () => {
    expect(
      resolveEarnAmountPosition({
        livePosition: { ...confirmedLivePosition, vaultId: '1-0xothervault' },
        snapshotPosition: optimisticSnapshot,
      }),
    ).toBe(optimisticSnapshot)
  })
})
