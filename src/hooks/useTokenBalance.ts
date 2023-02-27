import { WETH } from '@kyberswap/ks-sdk-core'
import { BigNumber, Contract } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import ERC20_ABI from 'constants/abis/erc20.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useContract } from 'hooks/useContract'
import useTransactionStatus from 'hooks/useTransactionStatus'
import { isAddress } from 'utils'

interface BalanceProps {
  value: BigNumber
  decimals: number
}

function useTokenBalance(tokenAddress: string) {
  const [balance, setBalance] = useState<BalanceProps>({ value: BigNumber.from(0), decimals: 18 })
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  //const currentBlockNumber = useBlockNumber()
  // allows balance to update given transaction updates
  const currentTransactionStatus = useTransactionStatus()
  const addressCheckSum = isAddress(chainId, tokenAddress)
  const tokenContract = useContract(addressCheckSum ? addressCheckSum : undefined, ERC20_ABI, false)

  const fetchBalance = useCallback(async () => {
    const getBalance = async (contract: Contract | null, owner: string | null | undefined): Promise<BalanceProps> => {
      try {
        if (account && chainId && contract?.address === WETH[chainId].address) {
          const ethBalance = await library?.getBalance(account)
          return { value: BigNumber.from(ethBalance), decimals: 18 }
        }

        const balance = await contract?.balanceOf(owner)
        const decimals = await contract?.decimals()

        return { value: BigNumber.from(balance), decimals: decimals }
        //todo: return as BigNumber as opposed toString since information will
        //return Fraction.from(BigNumber.from(balance), BigNumber.from(10).pow(decimals)).toString()
      } catch (e) {
        return { value: BigNumber.from(0), decimals: 18 }
      }
    }

    const balance = await getBalance(tokenContract, account)
    setBalance(balance)
  }, [account, tokenContract, chainId, library])

  useEffect(() => {
    if (account && tokenContract) {
      fetchBalance()
    }
  }, [account, currentTransactionStatus, fetchBalance, tokenContract])

  return balance
}

export default useTokenBalance
