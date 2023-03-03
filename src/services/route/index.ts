import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import axios from 'axios'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { GetRouteParams, GetRouteResponse } from './types/getRoute'

const routeApi = createApi({
  reducerPath: 'routeApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getRoute: builder.query<
      GetRouteResponse,
      {
        url: string
        params: GetRouteParams
      }
    >({
      query: ({ params, url }) => ({
        url,
        params,
      }),
    }),
  }),
})

export const buildRoute = async (url: string, payload: BuildRoutePayload, signal?: AbortSignal) => {
  const resp = await axios.post<BuildRouteResponse>(url, payload, {
    signal,
  })

  if (resp.status === 200) {
    if (resp.data?.data) {
      return resp.data.data
    }

    const err = new Error('Invalid response when building route')
    console.error(err)
    throw err
  }

  const err = new Error('Building route failed')
  console.error(err)
  throw err
}

export default routeApi
