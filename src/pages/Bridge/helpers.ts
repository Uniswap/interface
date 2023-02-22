import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import axios from 'axios'

import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { formatNumberWithPrecisionRange, isAddress } from 'utils'

import { MultiChainTokenInfo } from './type'

export const BridgeLocalStorageKeys = {
  BRIDGE_INFO: 'bridgeInfo',
  SHOWED_DISCLAIMED: 'showedDisclaimed',
  CHAINS_SUPPORTED: 'chainSupported',
  TOKEN_VERSION: 'tokenVer',
  TOKEN_LIST: 'bridgeTokenList',
}

export const getBridgeLocalstorage = (key: string) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(BridgeLocalStorageKeys.BRIDGE_INFO) || '{}',
  )
  return bridgeInfo?.[key]
}
export const setBridgeLocalstorage = (key: string, value: any) => {
  const bridgeInfo: { [key: string]: any } = JSON.parse(
    localStorage.getItem(BridgeLocalStorageKeys.BRIDGE_INFO) || '{}',
  )
  localStorage.setItem(BridgeLocalStorageKeys.BRIDGE_INFO, JSON.stringify({ ...bridgeInfo, [key]: value }))
}

const MULTICHAIN_API = `https://bridgeapi.multichain.org`
const fetchListChainSupport = () => {
  return axios.get(`${MULTICHAIN_API}/data/bridgeChainInfo`).then(data => data.data)
}
const fetchListTokenByChain = (chainId: ChainId) => {
  return axios.get(`${MULTICHAIN_API}/v4/tokenlistv4/${chainId}`).then(data => data.data)
}

export const fetchTokenVersion = () => {
  return axios.get(`${MULTICHAIN_API}/token/version`).then(data => data.data)
}

const getTokenListCache = () => {
  try {
    let local: any = localStorage.getItem(BridgeLocalStorageKeys.TOKEN_LIST) || '{}'
    local = JSON.parse(local)
    return local
  } catch (error) {
    return {}
  }
}
const filterTokenList = (tokens: { [key: string]: MultiChainTokenInfo }) => {
  try {
    // filter wrong address, to reduce trash token and local storage size
    Object.keys(tokens).forEach(key => {
      const token = { ...tokens[key] }
      const { destChains = {} } = token
      let hasChainSupport = false
      Object.keys(destChains).forEach((chain: string) => {
        Object.keys(destChains[chain]).forEach(address => {
          const info = destChains[chain][address]
          info.chainId = Number(info.chainId)
          if (!isAddress(info.chainId, info.address)) {
            delete destChains[chain][address]
          }
        })
        if (NETWORKS_INFO_CONFIG[chain as unknown as keyof typeof NETWORKS_INFO_CONFIG]) {
          hasChainSupport = true
        }
        if (!Object.keys(destChains[chain]).length) {
          delete destChains[chain]
        }
      })
      if (!hasChainSupport || !Object.keys(destChains).length) {
        delete tokens[key]
      }
    })
  } catch (error) {}
  return tokens
}
export async function getTokenlist(chainId: ChainId, isStaleData: boolean) {
  let tokens
  let local: any
  try {
    local = getTokenListCache()
    if (local[chainId] && Object.keys(local[chainId]).length && !isStaleData) {
      return local[chainId]
    }
    tokens = await fetchListTokenByChain(chainId)
    tokens = filterTokenList(tokens)
    local = getTokenListCache() // make sure get latest data
    try {
      localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ ...local, [chainId]: tokens }))
    } catch (error) {
      console.log('overflow localstorage QuotaExceededError')
      localStorage.removeItem(BridgeLocalStorageKeys.TOKEN_LIST)
      localStorage.setItem(BridgeLocalStorageKeys.TOKEN_LIST, JSON.stringify({ [chainId]: tokens }))
    }
    return tokens
  } catch (e) {
    console.log(e.toString())
    return local?.[chainId] || {}
  }
}

export async function getChainlist(isStaleData: boolean) {
  let chainIds: number[] = []
  try {
    chainIds = getBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED)
    if (chainIds && !isStaleData) {
      return chainIds
    }
    const tokens = await fetchListChainSupport()
    const filter = Object.keys(tokens)
      .map(Number)
      .filter(id => !!NETWORKS_INFO_CONFIG[id as ChainId])
    setBridgeLocalstorage(BridgeLocalStorageKeys.CHAINS_SUPPORTED, filter)
    return filter
  } catch (e) {
    console.log(e)
    return chainIds || []
  }
}

export const formatPoolValue = (amount: string | number | undefined) => {
  try {
    if (amount === undefined) return t`Unlimited`
    if (Number(amount) && amount) return formatNumberWithPrecisionRange(parseFloat(amount + ''), 0, 2)
  } catch (error) {}
  return '0'
}

export const formatAmountBridge = (amount: string) => formatNumberWithPrecisionRange(parseFloat(amount ?? '0'), 0, 6)
