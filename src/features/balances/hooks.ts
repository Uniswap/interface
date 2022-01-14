import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { utils } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { MULTICALL_ADDRESS } from 'src/constants/addresses'
import { ChainId, ChainIdToAddressTo } from 'src/constants/chains'
import { useMulticall2Contract, useTokenContract } from 'src/features/contracts/useContract'
import {
  useMultiChainMultiContractSingleData,
  useMultiChainSingleContractSingleData,
  useSingleCallResult,
} from 'src/features/multicall'
import { ChainIdToAddressToToken } from 'src/features/tokens/types'
import { currencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { flattenObjectOfObjects } from 'src/utils/objects'

type ChainIdToAddressToCurrencyAmount = ChainIdToAddressTo<CurrencyAmount<Currency>>

const BLOCKS_PER_FETCH = 3
const ERC20Interface = new utils.Interface(ERC20_ABI)
const MulticallInterface = new utils.Interface(MulticallABI)
const blocksPerFetchOption = { blocksPerFetch: BLOCKS_PER_FETCH }

// TODO: move balances to store?
export function useTokenBalance(
  token: Token | undefined,
  accountAddress?: Address
): { balance: CurrencyAmount<Currency> | undefined; loading: boolean } {
  const chainId = token?.chainId ?? ChainId.MAINNET
  const contract = useTokenContract(chainId, token?.address)
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])

  const callState = useSingleCallResult(
    chainId,
    contract,
    'balanceOf',
    accountAddressArray,
    blocksPerFetchOption
  )

  const currencyAmount = useMemo(() => {
    const value = callState.result?.[0]
    const amount = value?.toString()
    return amount && token ? CurrencyAmount.fromRawAmount<Token>(token, amount) : undefined
  }, [callState.result, token])

  return { balance: currencyAmount, loading: callState.loading }
}

export function useEthBalance(
  chainId: ChainId,
  accountAddress?: Address
): { balance: CurrencyAmount<Currency>; loading: boolean } {
  const multicallContract = useMulticall2Contract(chainId)
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])

  const callState = useSingleCallResult(
    chainId,
    multicallContract,
    'getEthBalance',
    accountAddressArray,
    blocksPerFetchOption
  )

  const loading = callState.loading
  const balance = useMemo(() => {
    const value = callState.result?.[0]
    if (!value) return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), 0)
    return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), value.toString())
  }, [callState, chainId])

  return { balance, loading }
}

export function useTokenBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): { balances: ChainIdToAddressTo<CurrencyAmount<Token>>; loading: boolean } {
  // Memoize inputs
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  const chainToAddresses = useMemo(() => {
    return chainIds.reduce<Record<number, Address[]>>((result, chainId) => {
      const tokenAddrs = Object.keys(chainIdToTokens[chainId] ?? {})
      result[chainId] = tokenAddrs
      return result
    }, {})
  }, [chainIds, chainIdToTokens])

  // Subscribe to multichain multicall
  const chainToCallStates = useMultiChainMultiContractSingleData(
    chainIds,
    chainToAddresses,
    ERC20Interface,
    'balanceOf',
    accountAddressArray,
    blocksPerFetchOption
  )

  // Transform outputs
  return useMemo(() => {
    const balances: ChainIdToAddressTo<CurrencyAmount<Token>> = {}
    let loading = false

    for (const chainId of chainIds) {
      balances[chainId] = {}
      const tokenAddrs = chainToAddresses[chainId]
      const callStates = chainToCallStates[chainId]

      // If results not yet ready for chain, skip for now
      if (!callStates || tokenAddrs.length !== callStates.length) continue

      for (let i = 0; i < tokenAddrs.length; i++) {
        const tokenAddr = tokenAddrs[i]
        const token = chainIdToTokens[chainId]?.[tokenAddr]
        if (!token) {
          logger.warn('balances/hooks', 'useTokenBalances', 'Token missing for address:', tokenAddr)
          continue
        }
        const callState = callStates[i]
        if (callState?.loading) loading = true

        const amount = callState?.result?.[0]?.toString()
        if (!amount) continue

        balances[chainId]![token.address] = CurrencyAmount.fromRawAmount(token, amount)
      }
    }
    return { balances, loading }
  }, [chainIds, chainToAddresses, chainIdToTokens, chainToCallStates])
}

export function useEthBalances(
  chainIds: ChainId[],
  accountAddress?: Address
): { balances: ChainIdToAddressTo<CurrencyAmount<Ether>>; loading: boolean } {
  // Memoize inputs
  const accountAddressArray = useMemo(() => [accountAddress], [accountAddress])
  const chainToAddresses = useMemo(() => {
    return chainIds.reduce<Record<number, Address>>((result, chainId) => {
      const address = MULTICALL_ADDRESS[chainId]
      if (address) {
        result[chainId] = address
      } else {
        logger.error('balances/hooks', 'useEthBalances', 'Multicall address missing for:', chainId)
      }
      return result
    }, {})
  }, [chainIds])

  // Subscribe to multichain multicall
  const chainToCallState = useMultiChainSingleContractSingleData(
    chainIds,
    chainToAddresses,
    MulticallInterface,
    'getEthBalance',
    accountAddressArray,
    blocksPerFetchOption
  )

  // Transform outputs
  return useMemo(() => {
    const balances: ChainIdToAddressTo<CurrencyAmount<Ether>> = {}
    let loading = false

    for (const chainId of chainIds) {
      const callState = chainToCallState[chainId]
      if (callState?.loading) loading = true

      const amount = callState?.result?.[0]?.toString()
      if (!amount) continue

      const currencyAmount = CurrencyAmount.fromRawAmount(Ether.onChain(chainId), amount)
      balances[chainId] = {
        [currencyId(currencyAmount.currency)]: currencyAmount,
      }
    }
    return { balances, loading }
  }, [chainIds, chainToCallState])
}

/** returns a mapping of chainId to address to CurrencyAmount */
export function useAllBalancesByChainId(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): {
  balances: ChainIdToAddressToCurrencyAmount
  loading: boolean
} {
  const { balances: tokenBalances, loading: tokenBalancesLoading } = useTokenBalances(
    chainIds,
    chainIdToTokens,
    accountAddress
  )

  const { balances: ethBalances, loading: ethBalancesLoading } = useEthBalances(
    chainIds,
    accountAddress
  )

  const loading = tokenBalancesLoading || ethBalancesLoading
  const balances = useMemo(() => {
    return chainIds.reduce<ChainIdToAddressToCurrencyAmount>((result, chainId) => {
      result[chainId] = {
        ...ethBalances[chainId],
        ...tokenBalances[chainId],
      }
      return result
    }, {})
  }, [chainIds, tokenBalances, ethBalances])
  return { balances, loading }
}

/** returns a list of `CurrencyAmount<Currency>`s representing non-zero user balances */
export function useAllBalances(
  chainIds: ChainId[],
  chainIdToTokens: ChainIdToAddressToToken,
  accountAddress?: Address
): {
  // TODO consider replacing allCurrencyAmounts with a CallState-like interface here (#268)
  allCurrencyAmounts: CurrencyAmount<Currency>[] // All currencies
  balances: CurrencyAmount<Currency>[] // Non-zero amounts
  loading: boolean
} {
  const { balances: chainIdToBalances, loading } = useAllBalancesByChainId(
    chainIds,
    chainIdToTokens,
    accountAddress
  )

  const { balances, allCurrencyAmounts } = useMemo(() => {
    const _allCurrencyAmounts = flattenObjectOfObjects(chainIdToBalances)
    const _balances = _allCurrencyAmounts.filter(
      (currencyAmount: CurrencyAmount<Currency>) => !!currencyAmount?.greaterThan(0)
    )
    return { balances: _balances, allCurrencyAmounts: _allCurrencyAmounts }
  }, [chainIdToBalances])

  return { balances, allCurrencyAmounts, loading }
}
