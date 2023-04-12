import KyberOauth2 from '@kybernetwork/oauth2'
import { BaseQueryFn, fetchBaseQuery } from '@reduxjs/toolkit/query'

// this query is use for private api call: this will attach access token in every request, auto refresh token if expired
const baseQueryOauth =
  ({ baseUrl = '' }: { baseUrl?: string }): BaseQueryFn =>
  async (args, WebApi, extraOptions) => {
    if (!args.authentication) {
      // to quickly revert if meet incident
      const rawBaseQuery = fetchBaseQuery({ baseUrl })
      return rawBaseQuery(args, WebApi, extraOptions)
    }
    try {
      const config = args
      if (config.method?.toLowerCase() !== 'get') {
        // mapping rtk query vs axios
        config.data = config.data || args.body
      }
      config.url = baseUrl + config.url
      const result = await KyberOauth2.callHttp(config)
      return { data: result.data }
    } catch (err) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      }
    }
  }
export default baseQueryOauth
