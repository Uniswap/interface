import { ApolloError } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import {
  Chain,
  Token as GQLToken,
  TokenProject,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  buildCurrency,
  currencyIdToContractInput,
  gqlTokenToCurrencyInfo,
  sortByName,
  tokenProjectToCurrencyInfos,
  usePersistedError,
} from 'uniswap/src/features/dataApi/utils'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_CURRENCY_ID_2,
  ethToken,
  removeSafetyInfo,
  usdcTokenProject,
} from 'uniswap/src/test/fixtures'
import { renderHook } from 'uniswap/src/test/test-utils'

describe(currencyIdToContractInput, () => {
  it('converts currencyId to ContractInput', () => {
    expect(currencyIdToContractInput(SAMPLE_CURRENCY_ID_1)).toEqual({
      address: SAMPLE_CURRENCY_ID_1.replace('1-', '').toLocaleLowerCase(),
      chain: 'ETHEREUM',
    })
    expect(currencyIdToContractInput(SAMPLE_CURRENCY_ID_2)).toEqual({
      address: SAMPLE_CURRENCY_ID_2.replace('1-', '').toLocaleLowerCase(),
      chain: 'ETHEREUM',
    })
  })
})

describe(tokenProjectToCurrencyInfos, () => {
  const project = usdcTokenProject()

  const getExpectedResult = (proj: TokenProject, token: GQLToken): CurrencyInfo =>
    ({
      logoUrl: project.logoUrl,
      currencyId: `${fromGraphQLChain(token.chain)}-${token.address}`,
      currency: buildCurrency({
        chainId: fromGraphQLChain(token.chain),
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name ?? project.name,
      }),
    }) as CurrencyInfo

  it('converts tokenProject to CurrencyInfo', () => {
    const result = tokenProjectToCurrencyInfos([project]).map(removeSafetyInfo)

    expect(result).toEqual(project.tokens.map((token) => getExpectedResult(project, token)))
  })

  it('filters by chainId if chainFilter is provided', () => {
    const result = tokenProjectToCurrencyInfos([project], UniverseChainId.Polygon).map(removeSafetyInfo)

    expect(result).toEqual(
      project.tokens.filter((token) => token.chain === 'POLYGON').map((token) => getExpectedResult(project, token)),
    )
  })

  it('filters out values for which currency is invalid', () => {
    const projectWithInvalidTokens = {
      ...project,
      tokens: [
        project.tokens[0],
        {
          ...project.tokens[1],
          chain: 'INVALID',
        },
      ],
    } as TokenProject

    const result = tokenProjectToCurrencyInfos([projectWithInvalidTokens], UniverseChainId.Mainnet).map(
      removeSafetyInfo,
    )

    expect(result).toEqual([getExpectedResult(project, project.tokens[0] as GQLToken)])
  })
})

describe(buildCurrency, () => {
  it('should return a new Token instance when all parameters are provided', () => {
    const token = buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 0,
      symbol: 'TEST',
      name: 'Test Token',
    }) as Token
    expect(token).toBeInstanceOf(Token)
    expect(token.chainId).toBe(UniverseChainId.Mainnet)
    expect(token.address).toBe('0x0000000000000000000000000000000000000000')
    expect(token.decimals).toBe(0)
    expect(token.symbol).toBe('TEST')
    expect(token.name).toBe('Test Token')
  })

  it('should return the same reference when the same parameters are provided', () => {
    const args = {
      chainId: UniverseChainId.Mainnet,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 0,
      symbol: 'TEST',
      name: 'Test Token',
    }

    const tokenA = buildCurrency({ ...args }) as Token
    const tokenB = buildCurrency({ ...args }) as Token

    expect(tokenA).toBeInstanceOf(Token)
    expect(tokenA).toBe(tokenB)
  })

  it('should return a new NativeCurrency instance when address is not provided', () => {
    const nativeCurrency = buildCurrency({
      chainId: UniverseChainId.Mainnet,
      address: null,
      decimals: 18,
    }) as NativeCurrency
    expect(nativeCurrency).toBeInstanceOf(NativeCurrency)
    expect(nativeCurrency.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('should return undefined when chainId or decimals are not provided', () => {
    expect(
      buildCurrency({
        chainId: null,
        address: '0x0',
        decimals: 18,
      }),
    ).toBeUndefined()
    expect(
      buildCurrency({
        chainId: UniverseChainId.Mainnet,
        address: '0x0',
        decimals: null,
      }),
    ).toBeUndefined()
  })
})

describe(gqlTokenToCurrencyInfo, () => {
  it('returns formatted CurrencyInfo for a given token', () => {
    const token = ethToken()
    const result = removeSafetyInfo(gqlTokenToCurrencyInfo(token))

    expect(result).toEqual({
      currency: buildCurrency({
        chainId: fromGraphQLChain(token.chain),
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
      }),
      currencyId: `${fromGraphQLChain(token.chain)}-${token.address}`,
      logoUrl: token.project?.logoUrl,
      isSpam: token.project?.isSpam,
    })
  })

  it('returns null if currency is invalid', () => {
    const result = gqlTokenToCurrencyInfo(ethToken({ chain: 'INVALID' as Chain }))

    expect(result).toBeNull()
  })
})

describe(usePersistedError, () => {
  it('returns undefined when no error is passed', () => {
    const { result } = renderHook(() => usePersistedError(false))

    expect(result.current).toBeUndefined()
  })

  it('returns error when error is passed', () => {
    const error = new ApolloError({})
    const { result } = renderHook(() => usePersistedError(false, error))

    expect(result.current).toBe(error)
  })

  describe('when is not loading', () => {
    it('returns undefined if error was previously passed and undefined is passed later', () => {
      const error = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error],
      })

      expect(result.current).toBe(error)

      rerender([false])

      expect(result.current).toBeUndefined()
    })

    it('returns new error if error was previously passed and new error is passed later', () => {
      const error1 = new ApolloError({})
      const error2 = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error1],
      })

      expect(result.current).toBe(error1)

      rerender([false, error2])

      expect(result.current).toBe(error2)
    })
  })

  describe('when is loading', () => {
    it('returns undefined if error was previously passed and undefined is passed later when loading is finished', () => {
      const error = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error],
      })

      expect(result.current).toBe(error)

      rerender([true])

      expect(result.current).toBe(error) // still retruns error as loading is not finished

      rerender([false])

      expect(result.current).toBeUndefined() // returns undefined as loading is finished
    })

    it('returns error if error was previously passed and new error is passed later', () => {
      const error1 = new ApolloError({})
      const error2 = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error1],
      })

      expect(result.current).toBe(error1)

      rerender([true, error2])

      expect(result.current).toBe(error2) // returns the new error because it is passed
    })
  })
})

describe('sortByName', () => {
  it('returns an empty array when input is undefined', () => {
    expect(sortByName(undefined)).toEqual([])
  })

  it('returns an empty array when input is an empty array', () => {
    expect(sortByName([])).toEqual([])
  })

  it('sorts balances by currency name', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: 'Cardano' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Cardano' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
    ])
  })

  it('handles balances with missing or empty names', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: '' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: '' } } },
      { currencyInfo: { currency: { name: null } } },
    ])
  })

  it('places balances with missing names at the end', () => {
    const unsortedBalances = [
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: '' } } },
    ] as PortfolioBalance[]

    const sortedBalances = sortByName(unsortedBalances)

    expect(sortedBalances).toEqual([
      { currencyInfo: { currency: { name: 'Bitcoin' } } },
      { currencyInfo: { currency: { name: 'Ethereum' } } },
      { currencyInfo: { currency: { name: null } } },
      { currencyInfo: { currency: { name: '' } } },
    ])
  })
})
