import { createApi } from '@reduxjs/toolkit/query/react'
import { Namespace, RequestBody, Scope, Transaction } from 'src/features/dataApi/zerion/types'
import { initSocket } from 'src/features/dataApi/zerion/utils'

export const zerionApi = createApi({
  reducerPath: 'zerionApi',
  async baseQuery() {
    return { data: {} }
  },
  endpoints: (builder) => ({
    transactionHistory: builder.query<{ info: Transaction[] | null }, { requestBody: RequestBody }>(
      {
        queryFn() {
          return { data: { info: null } }
        },
        onCacheEntryAdded: (
          { requestBody },
          { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
        ) => {
          initSocket(
            Namespace.Address,
            requestBody,
            cacheDataLoaded,
            cacheEntryRemoved,
            (data: { payload: { [Scope.Transactions]: Transaction[] } }) => {
              updateCachedData((draft) => {
                // TODO: verify payload
                draft.info = data.payload[Scope.Transactions]
              })
            }
          )
        },
      }
    ),
  }),
})

export const { useTransactionHistoryQuery } = zerionApi
