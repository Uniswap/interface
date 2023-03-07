import { configureStore } from '@reduxjs/toolkit'
import { load, save } from 'redux-localstorage-simple'
import routeApi from 'services/route'

import { ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'

import annoucementApi from '../services/announcement'
import geckoTerminalApi from '../services/geckoTermial'
import ksSettingApi from '../services/ksSetting'
import application from './application/reducer'
import bridge from './bridge/reducer'
import burnProAmm from './burn/proamm/reducer'
import burn from './burn/reducer'
import campaigns from './campaigns/reducer'
import customizeDexes from './customizeDexes'
import farms from './farms/classic/reducer'
import elasticFarm from './farms/elastic'
import elasticFarmV2 from './farms/elasticv2'
import { updateVersion } from './global/actions'
import limit from './limit/reducer'
import lists from './lists/reducer'
import mintV2 from './mint/proamm/reducer'
import mint from './mint/reducer'
import multicall from './multicall/reducer'
import pair from './pair/reducer'
import pools from './pools/reducer'
import swap from './swap/reducer'
import tokenPrices from './tokenPrices'
import topTokens from './topTokens'
import transactions from './transactions/reducer'
import tutorial from './tutorial/reducer'
import user from './user/reducer'
import vesting from './vesting/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions']
ENV_LEVEL < ENV_TYPE.PROD && PERSISTED_KEYS.push('customizeDexes')
ENV_LEVEL < ENV_TYPE.PROD && PERSISTED_KEYS.push('mintV2')

const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: {
    application,
    user,
    transactions,
    swap,
    limit,
    mint,
    mintV2,
    burn,
    burnProAmm,
    multicall,
    lists,
    pair,
    pools,
    farms,
    vesting,
    [annoucementApi.reducerPath]: annoucementApi.reducer,
    [geckoTerminalApi.reducerPath]: geckoTerminalApi.reducer,
    [ksSettingApi.reducerPath]: ksSettingApi.reducer,
    campaigns,
    tutorial,
    bridge,
    customizeDexes,
    elasticFarm,
    elasticFarmV2,
    tokenPrices,
    topTokens,
    [routeApi.reducerPath]: routeApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ thunk: true, immutableCheck: false, serializableCheck: false })
      .concat(save({ states: PERSISTED_KEYS, debounce: 100 }))
      .concat(geckoTerminalApi.middleware)
      .concat(ksSettingApi.middleware)
      .concat(annoucementApi.middleware)
      .concat(routeApi.middleware),
  preloadedState: load({ states: PERSISTED_KEYS }),
})

store.dispatch(updateVersion())
// setupListeners(store.dispatch)

export default store

export type AppState = ReturnType<typeof store.getState>

/**
 * @see https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-dispatch-type
 */
export type AppDispatch = typeof store.dispatch
