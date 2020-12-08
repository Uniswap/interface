import { Web3Provider } from '@ethersproject/providers'
import { getBridgeMode } from '../bridges/utils'
import { BridgeMode } from '../bridges/tokenBridge'
import {
  getHomeBridgeNativeToErcContract,
  getHomeCustomBridgeAddress,
  tryFormatAmount,
  getForeignBridgeNativeToErcContract,
  getForeignCustomBridgeAddress,
  getAMBErc677To677Contract,
  getHomeMultiErc20ToErc677BridgeAddress,
  getHomeMultiAMBErc20ToErc677Contract,
  getForeignMultiErc20ToErc677BridgeAddress,
  getForeignMultiAMBErc20ToErc677Contract
} from '../../../utils'

async function getNativeToErcMinMax(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  chainId: number,
  library: Web3Provider,
  account: string
) {
  let minAmount, maxAmount

  if (isHome) {
    const address = getHomeCustomBridgeAddress(tokenAddress)

    if (!address) throw Error('Home bridge address not provided')

    const contract = getHomeBridgeNativeToErcContract(address, library, account)
    const min = await contract.minPerTx()
    const max = await contract.maxPerTx()

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  } else {
    const address = getForeignCustomBridgeAddress(tokenAddress)

    if (!address) throw Error('Foreign bridge address not provided')

    const contract = getForeignBridgeNativeToErcContract(address, library, account)
    const min = await contract.minPerTx()
    const max = await contract.maxPerTx()

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  }

  return { minAmount, maxAmount }
}

async function getErc20ToErc677MinMax(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  chainId: number,
  library: Web3Provider,
  account: string
) {
  const zeroAddress = '0x0000000000000000000000000000000000000000'
  let minAmount, maxAmount

  if (isHome) {
    const address = getHomeMultiErc20ToErc677BridgeAddress()

    if (!address) throw Error('Home bridge address not provided')

    const contract = getHomeMultiAMBErc20ToErc677Contract(address, library, account)
    const min = await contract.minPerTx(tokenAddress)
    let max = await contract.maxPerTx(tokenAddress)
    if (tryFormatAmount(max, decimals) === '0.0') {
      max = await contract.maxPerTx(zeroAddress)
    }

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  } else {
    const address = getForeignMultiErc20ToErc677BridgeAddress()

    if (!address) throw Error('Foreign bridge address not provided')

    const contract = getForeignMultiAMBErc20ToErc677Contract(address, library, account)
    const min = await contract.minPerTx(tokenAddress)
    let max = await contract.maxPerTx(tokenAddress)
    if (tryFormatAmount(max, decimals) === '0.0') {
      max = await contract.maxPerTx(zeroAddress)
    }

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  }

  return { minAmount, maxAmount }
}

async function getErc677ToErc677MinMax(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  chainId: number,
  library: Web3Provider,
  account: string
) {
  let minAmount, maxAmount

  if (isHome) {
    const address = getHomeCustomBridgeAddress(tokenAddress)

    if (!address) throw Error('Home bridge address not provided')

    const contract = getAMBErc677To677Contract(address, library, account)
    const min = await contract.minPerTx()
    const max = await contract.maxPerTx()

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  } else {
    const address = getForeignCustomBridgeAddress(tokenAddress)

    if (!address) throw Error('Foreign bridge address not provided')

    const contract = getAMBErc677To677Contract(address, library, account)
    const min = await contract.minPerTx()
    const max = await contract.maxPerTx()

    minAmount = tryFormatAmount(min, decimals)
    maxAmount = tryFormatAmount(max, decimals)
  }

  return { minAmount, maxAmount }
}

export async function getMinMaxPerTxn(
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  chainId: number,
  library: Web3Provider,
  account: string
) {
  const mode = getBridgeMode(tokenAddress)

  switch (mode) {
    case BridgeMode.NATIVE_TO_ERC:
      return await getNativeToErcMinMax(tokenAddress, decimals, isHome, chainId, library, account)
    case BridgeMode.ERC20_TO_ERC677:
      return await getErc20ToErc677MinMax(tokenAddress, decimals, isHome, chainId, library, account)
    case BridgeMode.ERC677_TO_ERC677:
      return await getErc677ToErc677MinMax(tokenAddress, decimals, isHome, chainId, library, account)
  }
}
