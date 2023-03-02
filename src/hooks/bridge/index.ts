import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber, ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import ERC20_INTERFACE, { ERC20_ABI } from 'constants/abis/erc20'
import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import useInterval from 'hooks/useInterval'
import { useKyberswapConfig } from 'hooks/useKyberswapConfig'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export const useTokenBalanceOfAnotherChain = (chainId: ChainId | undefined, token: WrappedTokenInfo | undefined) => {
  const { account } = useActiveWeb3React()
  const [balance, setBalance] = useState('0')
  const { provider } = useKyberswapConfig()

  useEffect(() => {
    if (account && chainId && token && provider)
      getTokenBalanceOfAnotherChain(account, token, chainId, provider)
        .then(data => {
          setBalance(data)
        })
        .catch(console.error)
    else {
      setBalance('0')
    }
  }, [chainId, token, account, balance, provider])
  return balance
}

function getTokenBalanceOfAnotherChain(
  account: string,
  token: WrappedTokenInfo,
  chainId: ChainId,
  provider: ethers.providers.JsonRpcProvider,
): Promise<string> {
  const isNativeToken = token.multichainInfo?.tokenType === 'NATIVE'
  return new Promise(async (resolve, reject) => {
    try {
      if (!account || !token || !isEVM(chainId)) return reject('wrong input')
      let balance: BigNumber | undefined
      try {
        if (isNativeToken) {
          balance = await provider.getBalance(account)
        } else {
          const contract = new ethers.Contract(token?.address, ERC20_ABI, provider)
          balance = await contract.balanceOf(account)
        }
      } catch (error) {}
      resolve(balance ? ethers.utils.formatUnits(balance, token.decimals) : '0')
    } catch (error) {
      reject(error)
    }
  })
}

type TokenList = { anytoken: string; underlying: string }[]

type PoolBridgeInfoMap = {
  [address: string]: PoolBridgeInfo
}
type PoolBridgeInfo = {
  balance: string
  balanceOf: string
}
type CallParam = {
  callData: string
  target: string
  label: string
  fragment: string
  key: string
}

function getCallParams(list: TokenList) {
  const calls: CallParam[] = []
  for (const item of list) {
    calls.push({
      callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [item.anytoken]),
      target: item.underlying,
      label: 'balanceOf',
      fragment: 'balanceOf',
      key: item.anytoken,
    })
  }
  return calls
}

const formatResult = (response: string[], calls: CallParam[]): PoolBridgeInfoMap => {
  const resultList: PoolBridgeInfoMap = {}
  if (!response) return resultList
  for (let i = 0, len = calls.length; i < len; i++) {
    const item = calls[i]
    if (!response[i]) continue

    let value = ''
    try {
      value = ERC20_INTERFACE?.decodeFunctionResult(item.fragment, response[i])?.toString()
    } catch (error) {
      continue
    }

    if (!resultList[item.key]) {
      resultList[item.key] = { balance: '0', balanceOf: '0' }
    }
    resultList[item.key][item.label as keyof PoolBridgeInfo] = value
  }
  return resultList
}

// get pool of list token of a chain
export function useMultichainPool(chainId: ChainId | undefined, tokenList: TokenList) {
  const [poolData, setPoolData] = useState<PoolBridgeInfoMap>()
  const { account } = useActiveWeb3React()
  const multicallContract = useMulticallContract(chainId)
  const getEvmPoolsData = useCallback(async (): Promise<PoolBridgeInfoMap> => {
    if (!chainId) return Promise.reject('Wrong input')
    try {
      const calls = getCallParams(tokenList)
      const { returnData } = (await multicallContract?.callStatic.tryBlockAndAggregate(
        false,
        calls.map(({ callData, target }) => ({ target, callData })),
      )) || { returnData: [] }
      return formatResult(
        returnData.map((item: [boolean, string]) => item[1]),
        calls,
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }, [chainId, tokenList, multicallContract])

  const fetchPoolCallback = useCallback(async () => {
    try {
      const newData: PoolBridgeInfoMap = await getEvmPoolsData()
      // small object, no performance problem here
      if (JSON.stringify(newData || {}) !== JSON.stringify(poolData || {})) {
        setPoolData(newData)
      }
    } catch (e) {
      console.log(e)
    }
  }, [getEvmPoolsData, poolData])

  useEffect(() => {
    fetchPoolCallback()
  }, [chainId, account, tokenList, fetchPoolCallback])

  useInterval(fetchPoolCallback, 1000 * 10)

  return !chainId ? undefined : poolData
}
