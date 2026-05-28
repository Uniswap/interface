import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnPositionInfo,
  getEarnPositionInfosByVaultId,
  getEarnVaultId,
  getEarnVaultInfo,
  getEarnVaultInfos,
  getEarnVaultsSortedByPosition,
  getProjectedAnnualEarningsUsd,
  getTotalEarnDepositedUsd,
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  selectEarnVaultForToken,
} from 'uniswap/src/features/earn/utils'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_ADDRESS_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71B54bdA02913'
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
    ...overrides,
  })
}

function createSharedVault(overrides: Partial<EarnVaultInfo> = {}): EarnVaultInfo {
  return {
    id: getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: VAULT_ADDRESS }),
    currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
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

describe('earn API mappers', () => {
  it('maps data-api vaults into frontend-ready EarnVaultInfo', () => {
    const vault = getEarnVaultInfo(createDataApiVault())

    expect(vault).toMatchObject({
      id: getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: VAULT_ADDRESS }),
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
      vaultAddress: VAULT_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      apyPercent: 4.8,
      totalDepositsUsd: 50_000_000,
      liquidityUsd: 5_000_000,
      curator: { name: 'Gauntlet' },
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
      vaultId: getEarnVaultId({ chainId: UniverseChainId.Mainnet, vaultAddress: VAULT_ADDRESS }),
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

  it('falls back to token price when USD balance is unavailable', () => {
    expect(getTokenBalanceUsd({ balance: createBalance(10, undefined), tokenPriceUsd: 1 })).toBe(10)
  })

  it('computes projected annual earnings from APY', () => {
    expect(getProjectedAnnualEarningsUsd({ balanceUsd: 1_000, apyPercent: 5.23 })).toBeCloseTo(52.3)
  })

  it('sums active earn deposits by USD value', () => {
    expect(
      getTotalEarnDepositedUsd([
        { vaultId: '1-0xvault-1', depositedUsd: 100, depositedRaw: '100000000', apyPercent: 1, sharesRaw: '1' },
        { vaultId: '1-0xvault-2', depositedUsd: 25, depositedRaw: '25000000', apyPercent: 1, sharesRaw: '1' },
        { vaultId: '1-0xvault-3', depositedUsd: 10, depositedRaw: '0', apyPercent: 1, sharesRaw: '0' },
      ]),
    ).toBe(135)
  })

  it('sorts vaults with active positions first by deposited USD value', () => {
    const vaultWithoutPosition = createSharedVault({ id: 'vault-without-position' })
    const smallerPositionVault = createSharedVault({ id: 'smaller-position-vault' })
    const largerPositionVault = createSharedVault({ id: 'larger-position-vault' })
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
      hasEarnPosition({ vaultId: '1-0xvault', depositedUsd: 1, depositedRaw: '0', apyPercent: 1, sharesRaw: '0' }),
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
      hasEarnPosition({ vaultId: '1-0xvault', depositedUsd: 0, depositedRaw: '0', apyPercent: 1, sharesRaw: '0' }),
    ).toBe(false)
  })
})
