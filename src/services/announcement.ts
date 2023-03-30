import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import { NOTIFICATION_API, getAnnouncementsTemplateIds } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

export type AnnouncementResponse<T extends PrivateAnnouncement | Announcement = Announcement> = {
  notifications: T[]
  numberOfUnread: number
  pagination: {
    totalItems: number
  }
}

export const transformResponseAnnouncement = <T extends PrivateAnnouncement | Announcement = Announcement>(
  data: any,
) => {
  const { metaMessages, notifications, ...rest } = data.data ?? {}
  return {
    ...rest,
    notifications: (metaMessages ?? notifications ?? []).map((e: any) => ({
      ...e,
      templateBody: JSON.parse(e.templateBody ?? '{}') ?? {},
    })),
  } as AnnouncementResponse<T>
}

type Params = {
  page: number
  account?: string
  pageSize?: number
}

type ParamsPrivate = {
  page: number
  account: string
  templateIds?: string
  pageSize?: number
}

const AnnouncementApi = createApi({
  reducerPath: 'announcementApi',
  baseQuery: fetchBaseQuery({ baseUrl: NOTIFICATION_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID, RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN],
  endpoints: builder => ({
    getAnnouncements: builder.query<AnnouncementResponse<Announcement>, Params>({
      query: params => ({
        url: `/v1/messages/announcements`,
        params,
      }),
      transformResponse: transformResponseAnnouncement,
    }),
    getPrivateAnnouncements: builder.query<AnnouncementResponse<PrivateAnnouncement>, ParamsPrivate>({
      query: ({ account, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params: { ...params, excludedTemplateIds: getAnnouncementsTemplateIds().EXCLUDE },
      }),
      transformResponse: transformResponseAnnouncement,
      providesTags: [RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN],
    }),
    getPrivateAnnouncementsByIds: builder.query<AnnouncementResponse<PrivateAnnouncement>, ParamsPrivate>({
      query: ({ account, templateIds, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params: { ...params, templateIds },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID],
      transformResponse: transformResponseAnnouncement,
    }),
    ackPrivateAnnouncements: builder.mutation<
      AnnouncementResponse,
      { account: string; action: 'read' | 'clear-all' | 'read-all'; ids?: number[] }
    >({
      query: ({ account, action, ids }) => {
        const body: { excludedTemplateIds?: number[]; ids?: number[] } = { ids }
        if (action === 'read-all' || action === 'clear-all') {
          body.excludedTemplateIds = getAnnouncementsTemplateIds().EXCLUDE.split(',').map(Number)
        }
        return {
          url: `/v1/users/${account}/notifications/${action}`,
          method: 'put',
          body,
        }
      },
    }),
    ackPrivateAnnouncementsByIds: builder.mutation<AnnouncementResponse, { account: string; templateIds?: string }>({
      query: ({ account, templateIds }) => {
        const body = {
          templateIds: templateIds?.split(',').map(Number),
          excludedTemplateIds: getAnnouncementsTemplateIds().EXCLUDE.split(',').map(Number),
        }
        return {
          url: `/v1/users/${account}/notifications/read-all`,
          method: 'put',
          body,
        }
      },
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN],
    }),
    clearAllPrivateAnnouncementById: builder.mutation<Response, { account: string; templateIds: string }>({
      query: ({ account, templateIds }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications/clear-all`,
        body: {
          templateIds: templateIds.split(',').map(id => Number(id)),
        },
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN, RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID],
    }),
  }),
})
export const {
  useGetAnnouncementsQuery,
  useLazyGetAnnouncementsQuery,
  useLazyGetPrivateAnnouncementsQuery,
  useGetPrivateAnnouncementsQuery,
  useAckPrivateAnnouncementsMutation,
  useGetPrivateAnnouncementsByIdsQuery,
  useClearAllPrivateAnnouncementByIdMutation,
  useAckPrivateAnnouncementsByIdsMutation,
} = AnnouncementApi

export default AnnouncementApi
