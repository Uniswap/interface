import type { PortfolioChainBalance } from 'uniswap/src/features/dataApi/types'
import { sortPortfolioChainBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import { createPortfolioChainBalance } from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it } from 'vitest'

const CHAIN_ID = 1
const currencyIdOnChain1 = (address: string): string => `${CHAIN_ID}-${address}`

/** Distinct dummy token addresses (hex pattern mnemonics). */
const ADDR_0X_AA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ADDR_0X_BB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const ADDR_0X_CC = '0xcccccccccccccccccccccccccccccccccccccccc'
const ADDR_0X_DD = '0xdddddddddddddddddddddddddddddddddddddddd'
const ADDR_0X_EE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const ADDR_0X_FF = '0xffffffffffffffffffffffffffffffffffffffff'
const ADDR_0X_99 = '0x9999999999999999999999999999999999999999'

describe(sortPortfolioChainBalances, () => {
  it('returns the same array instance when at most one token', () => {
    const single = [createPortfolioChainBalance()]
    expect(sortPortfolioChainBalances({ tokens: single, isTestnetModeEnabled: false })).toBe(single)
    expect(sortPortfolioChainBalances({ tokens: [], isTestnetModeEnabled: false })).toEqual([])
  })

  it('sorts by valueUsd descending then alphabetically when value is missing (mainnet)', () => {
    const high = createPortfolioChainBalance({
      address: ADDR_0X_AA,
      valueUsd: 100,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_AA),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_AA,
          isToken: true,
          symbol: 'A',
          name: 'Alpha',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const low = createPortfolioChainBalance({
      address: ADDR_0X_BB,
      valueUsd: 10,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_BB),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_BB,
          isToken: true,
          symbol: 'B',
          name: 'Beta',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const noUsd = createPortfolioChainBalance({
      address: ADDR_0X_CC,
      valueUsd: undefined,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_CC),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_CC,
          isToken: true,
          symbol: 'C',
          name: 'Charlie',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const noUsdZ = createPortfolioChainBalance({
      address: ADDR_0X_DD,
      valueUsd: 0,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_DD),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_DD,
          isToken: true,
          symbol: 'D',
          name: 'Zulu',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const sorted = sortPortfolioChainBalances({
      tokens: [noUsdZ, low, noUsd, high],
      isTestnetModeEnabled: false,
    })
    expect(sorted.map((t: PortfolioChainBalance) => t.valueUsd)).toEqual([100, 10, undefined, 0])
    expect(sorted[2]!.currencyInfo.currency.name).toBe('Charlie')
    expect(sorted[3]!.currencyInfo.currency.name).toBe('Zulu')
  })

  it('sorts native tokens by quantity before non-native (testnet)', () => {
    const nativeLow = createPortfolioChainBalance({
      quantity: 1,
      valueUsd: 100,
      currencyInfo: {
        currencyId: '1-native-low',
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_EE,
          isToken: true,
          symbol: 'N',
          name: 'NativeLow',
          isNative: true,
        } as never,
        logoUrl: undefined,
      },
    })
    const nativeHigh = createPortfolioChainBalance({
      quantity: 99,
      valueUsd: 1,
      currencyInfo: {
        currencyId: '1-native-high',
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_FF,
          isToken: true,
          symbol: 'N',
          name: 'NativeHigh',
          isNative: true,
        } as never,
        logoUrl: undefined,
      },
    })
    const erc20 = createPortfolioChainBalance({
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_99),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_99,
          isToken: true,
          symbol: 'E',
          name: 'Erc20',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const sorted = sortPortfolioChainBalances({
      tokens: [erc20, nativeLow, nativeHigh],
      isTestnetModeEnabled: true,
    })
    expect(sorted[0]!.quantity).toBe(99)
    expect(sorted[1]!.quantity).toBe(1)
    expect(sorted[2]!.currencyInfo.currency.isNative).toBe(false)
  })

  it('sorts multiple non-native tokens by name after natives (testnet)', () => {
    const native = createPortfolioChainBalance({
      quantity: 5,
      currencyInfo: {
        currencyId: '1-native',
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_EE,
          isToken: true,
          symbol: 'ETH',
          name: 'Ether',
          isNative: true,
        } as never,
        logoUrl: undefined,
      },
    })
    const zebra = createPortfolioChainBalance({
      address: ADDR_0X_AA,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_AA),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_AA,
          isToken: true,
          symbol: 'Z',
          name: 'Zebra',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const alpha = createPortfolioChainBalance({
      address: ADDR_0X_BB,
      currencyInfo: {
        currencyId: currencyIdOnChain1(ADDR_0X_BB),
        currency: {
          chainId: CHAIN_ID,
          address: ADDR_0X_BB,
          isToken: true,
          symbol: 'A',
          name: 'Alpha',
          isNative: false,
        } as PortfolioChainBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const sorted = sortPortfolioChainBalances({
      tokens: [zebra, native, alpha],
      isTestnetModeEnabled: true,
    })
    expect(sorted.map((t: PortfolioChainBalance) => t.currencyInfo.currency.name)).toEqual(['Ether', 'Alpha', 'Zebra'])
  })
})
