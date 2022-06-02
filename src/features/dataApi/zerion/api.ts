import { createApi } from '@reduxjs/toolkit/query/react'
import {
  Asset,
  Namespace,
  RequestBody,
  Scope,
  Transaction,
} from 'src/features/dataApi/zerion/types'
import { ACTION_TYPE, initSocket } from 'src/features/dataApi/zerion/utils'

export const zerionApi = createApi({
  reducerPath: 'zerionApi',
  async baseQuery() {
    return { data: {} }
  },
  endpoints: (builder) => ({
    transactionHistory: builder.query<
      { info: { [address: Address]: Transaction[] | null } },
      { requestBodies: Array<RequestBody>; actionType?: ACTION_TYPE }
    >({
      queryFn() {
        return { data: { info: {} } }
      },
      onCacheEntryAdded: (
        { requestBodies, actionType },
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
      ) => {
        requestBodies.forEach((requestBody) =>
          initSocket(
            Namespace.Address,
            requestBody,
            cacheDataLoaded,
            cacheEntryRemoved,
            (data: { payload: { [Scope.Transactions]: Transaction[] } }) => {
              updateCachedData((draft) => {
                // TODO: verify payload
                draft.info[requestBody.payload.address as string] = data.payload[Scope.Transactions]
              })
            },
            actionType
          )
        )
      },
    }),
    assetInfo: builder.query<{ info: Asset[] | null }, { requestBody: RequestBody }>({
      queryFn() {
        return { data: { info: null } }
      },
      onCacheEntryAdded: (
        { requestBody },
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
      ) => {
        initSocket(
          Namespace.Assets,
          requestBody,
          cacheDataLoaded,
          cacheEntryRemoved,
          (data: { payload: { [Scope.Info]: Asset[] } }) => {
            updateCachedData((draft) => {
              // TODO: verify payload
              draft.info = data.payload[Scope.Info]
            })
          }
        )
      },
    }),
  }),
})

export const { useTransactionHistoryQuery, useAssetInfoQuery } = zerionApi
