import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AnnouncementResponse, transformResponseAnnouncement } from 'services/announcement'

import { PrivateAnnouncement } from 'components/Announcement/type'
import { NOTIFICATION_API, PRICE_ALERT_API, getAnnouncementsTemplateIds } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { CreatePriceAlertPayload, PriceAlert, PriceAlertStat } from 'pages/NotificationCenter/const'

type MetaResponse<T> = {
  code: number
  data?: T
  message: string
}

type GetListAlertsResponseData = {
  alerts: PriceAlert[]
  pagination: {
    totalItems: number
  }
}

type GetListAlertsParams = {
  walletAddress: string
  page?: number
  pageSize?: number
  sort?: string
}

const priceAlertApi = createApi({
  reducerPath: 'priceAlertApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRICE_ALERT_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_HISTORY, RTK_QUERY_TAGS.GET_ALERTS_STAT],
  endpoints: builder => ({
    getListAlerts: builder.query<GetListAlertsResponseData, GetListAlertsParams>({
      query: params => ({
        url: `/v1/alerts`,
        params,
      }),
      transformResponse: (data: any) => {
        return data.data as GetListAlertsResponseData
      },
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS],
    }),
    getAlertStats: builder.query<PriceAlertStat, string>({
      query: walletAddress => ({
        url: `/v1/alerts/statistics`,
        params: {
          walletAddress,
        },
      }),
      transformResponse: (data: any) => data?.data?.statistics,
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    createPriceAlert: builder.mutation<MetaResponse<{ id: number }>, CreatePriceAlertPayload>({
      query: body => ({
        url: `/v1/alerts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    updatePriceAlert: builder.mutation<void, { isEnabled: boolean; id: number }>({
      query: ({ isEnabled, id }) => ({
        url: `/v1/alerts/${id}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    deleteAllAlerts: builder.mutation<void, { account: string }>({
      query: ({ account }) => ({
        url: `/v1/alerts`,
        method: 'DELETE',
        body: { walletAddress: account },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    deleteSingleAlert: builder.mutation<void, number>({
      query: alertId => ({
        url: `/v1/alerts/${alertId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    getListPriceAlertHistory: builder.query<
      AnnouncementResponse<PrivateAnnouncement>,
      {
        account: string
        page: number
        pageSize?: number
      }
    >({
      query: ({ account, ...params }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications`,
        params: {
          ...params,
          templateIds: getAnnouncementsTemplateIds().PRICE_ALERT,
        },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
      transformResponse: transformResponseAnnouncement,
    }),
    clearSinglePriceAlertHistory: builder.mutation<Response, { account: string; id: number }>({
      query: ({ account, id }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications/clear`,
        body: {
          ids: [id],
        },
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
    }),
    clearAllPriceAlertHistory: builder.mutation<Response, { account: string }>({
      query: ({ account }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications/clear-all`,
        body: {
          templateIds: getAnnouncementsTemplateIds()
            .PRICE_ALERT.split(',')
            .map(id => Number(id)),
        },
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
    }),
  }),
})
export const {
  useCreatePriceAlertMutation,
  useUpdatePriceAlertMutation,
  useGetAlertStatsQuery,
  useLazyGetAlertStatsQuery,
  useGetListAlertsQuery,
  useDeleteAllAlertsMutation,
  useDeleteSingleAlertMutation,
  useClearSinglePriceAlertHistoryMutation,
  useClearAllPriceAlertHistoryMutation,
  useGetListPriceAlertHistoryQuery,
} = priceAlertApi
export default priceAlertApi
