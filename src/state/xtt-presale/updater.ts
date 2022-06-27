import { Interface } from '@ethersproject/abi'
import { abi as XttPresaleABI } from 'abis/xtt-presale.json'
import { useEffect, useMemo } from 'react'

import { useXttPresaleContract } from '../../hooks/useContract'
import { useActiveWeb3React } from '../../hooks/web3'
import { useAppDispatch } from '../hooks'
import { useSingleContractWithCallData } from '../multicall/hooks'
import { fetchDataSuccess, fetchDataWithSignerSuccess } from './actions'
import { useXttPresaleStateStatus, useXttPresaleStateStatusWithSigner } from './hooks'
import { Status } from './reducer'

export default function XttPresaleUpdater(): null {
  const presaleStateStatus = useXttPresaleStateStatus()
  const presaleStateStatusWithSigner = useXttPresaleStateStatusWithSigner()

  const itf = useMemo(() => {
    return new Interface(XttPresaleABI)
  }, [])

  const contract = useXttPresaleContract()

  const { account } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const callDataMethods = [
    'token',
    'privateSaleStartTimestamp',
    'privateSaleEndTimestamp',
    'hardCapEthAmount',
    'totalDepositedEthBalance',
    'minimumDepositEthAmount',
    'maximumDepositEthAmount',
    'tokenPerETH',
    'claimEnabledStart',
    'totalBought',
    'totalClaimed',
  ]
  const callData = callDataMethods.map((name) => itf.encodeFunctionData(name))

  const results: any = useSingleContractWithCallData(contract, callData).reduce((prev, cur, i) => {
    if (cur.valid && !cur.loading && cur.result) {
      let typed: any = cur.result[0]
      switch (i) {
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 9:
        case 10:
          typed = cur.result[0].toString()
          break
        case 1:
        case 2:
        case 8:
          typed = Number(cur.result[0].toString())
          break
      }
      return { ...prev, [callDataMethods[i]]: typed }
    }
    return {}
  }, {})

  const callDataWithSigner = useMemo(() => {
    if (!account) {
      return []
    }
    return [itf.encodeFunctionData('deposits', [account]), itf.encodeFunctionData('balanceOf', [account])]
  }, [account, itf])

  useEffect(() => {
    if (results.token && presaleStateStatus === Status.INITIAL && contract) {
      dispatch(fetchDataSuccess({ ...results, status: Status.SUCCESS }))
    }
  }, [results, presaleStateStatus, contract, dispatch])

  const resultsWithSigner: any = useSingleContractWithCallData(contract, callDataWithSigner).reduce((prev, cur, i) => {
    if (!cur.result) {
      return {}
    }
    if (i === 0) {
      return { deposits: cur.result.toString() }
    }
    return { ...prev, balanceOf: cur.result[0].toString() }
  }, {})

  useEffect(() => {
    if (resultsWithSigner.balanceOf !== undefined && presaleStateStatusWithSigner === Status.INITIAL && contract) {
      console.log(resultsWithSigner.balanceOf)
      dispatch(fetchDataWithSignerSuccess({ ...resultsWithSigner, statusWithSigner: Status.SUCCESS }))
    }
  }, [resultsWithSigner, presaleStateStatusWithSigner, contract, dispatch])

  return null
}
