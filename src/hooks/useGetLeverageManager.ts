import {useMemo} from "react"
import * as LeverageManagerData from "../perpspotContracts/LeverageManager.json"
import * as GlobalStorageData from "../perpspotContracts/GlobalStorage.json"
import { Pool } from "@uniswap/v3-sdk"
import { useWeb3React } from '@web3-react/core'
import { ethers } from "ethers"
import { GLOBAL_STORAGE_ADDRESSES } from "constants/addresses"

export async function useLeverageManagerAddress(poolAddress: string): Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  console.log("levM", account, chainId, provider)
  if (!account || !chainId || !provider) return ""
  console.log("here")
  let gs = new ethers.Contract(GLOBAL_STORAGE_ADDRESSES[chainId], GlobalStorageData.abi, provider.getSigner(account))
  let result = await gs.poolData(poolAddress)
  return result.leverageManager
}