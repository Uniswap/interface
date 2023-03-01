import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { PoolValueOutMap } from 'state/bridge/reducer'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type BridgeStateParams = {
  tokenIn?: WrappedTokenInfo | undefined
  tokenOut?: WrappedTokenInfo | undefined
  chainIdOut?: ChainId
  listChainIn?: ChainId[] | undefined
  listTokenIn?: WrappedTokenInfo[] | undefined
  listTokenOut?: WrappedTokenInfo[] | undefined
  loadingToken?: boolean
}

export const setBridgeState = createAction<BridgeStateParams>('bridge/setBridgeState')

export type BridgeStatePoolParams = { poolValueOutMap: PoolValueOutMap }
export const setBridgePoolInfo = createAction<BridgeStatePoolParams>('bridge/setBridgePoolInfo')

export const resetBridgeState = createAction('bridge/resetBridgeState')
export const setHistoryURL = createAction<string>('bridge/setHistoryURL')
