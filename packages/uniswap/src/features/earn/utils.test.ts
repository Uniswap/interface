import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { Token as SdkToken } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  getEarnAmountValidation,
  getEarnFiatPercentageInput,
  getEarnPercentageInput,
  getProjectedAnnualEarnings,
} from 'uniswap/src/features/earn/amount'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnDepositSourceOptions,
  getEarnDepositSourceOptionsBySupport,
  getEarnVaultDepositSourceCurrencyIds,
  getEarnVaultDisplayCurrencyId,
  getEarnPositionInfo,
  getEarnPositionInfosByVaultId,
  getEarnVaultId,
  getEarnVaultInfo,
  getEarnVaultInfos,
  getEarnVaultTokenDetailsCurrencyIds,
  getEarnVaultWithdrawDestinationCurrencyId,
  getEarnVaultsSortedByPosition,
  getTotalEarnDepositedUsd,
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  selectEarnVaultForToken,
} from 'uniswap/src/features/earn/utils'
import {
  areCurrencyIdsEqual,
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyIdWithThrow,
} from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_ADDRESS_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
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
      curator: { name: 'Gauntlet' },
      displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    })
    expect(vault?.deploymentDate).toBeUndefined()
    expect(vault?.morphoUrl).toBeUndefined()
    expect(vault?.exposureAndRiskUrl).toBeUndefined()
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

    expect(getEarnDepositSourceOptionsBySupport(options)).toEqual({
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

  it('uses native withdraw destinations for wrapped-native vaults and preserves normal vault destinations', () => {
    const wrappedNativeVault = createSharedVault({
      currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    })
    const usdcVault = createSharedVault()

    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: wrappedNativeVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBe(buildNativeCurrencyId(UniverseChainId.Unichain))
    expect(
      getEarnVaultWithdrawDestinationCurrencyId({
        vault: usdcVault,
        destinationChainId: UniverseChainId.Unichain,
      }),
    ).toBe(usdcVault.currencyId)
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

  it('builds withdraw percentage amount inputs from local fiat', () => {
    expect(
      getEarnFiatPercentageInput({
        balanceUsd: 1_000,
        convertUsdToLocalFiat: (balanceUsd) => balanceUsd * 1.5,
        percentage: 0.5,
      }),
    ).toBe('750.00')
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
