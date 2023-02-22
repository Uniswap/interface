import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import { NOTIFICATION_API, NOTIFICATION_IGNORE_TEMPLATE_IDS } from 'constants/env'

type Response = {
  notifications: PrivateAnnouncement[] | Announcement[]
  numberOfUnread: number
  pagination: {
    totalItems: number
  }
}

const transformResponse = (data: any) => {
  const { metaMessages, notifications, ...rest } = data.data ?? {}
  return {
    ...rest,
    notifications: (metaMessages ?? notifications ?? []).map((e: any) => ({
      ...e,
      templateBody: JSON.parse(e.templateBody ?? '{}') ?? {},
    })),
  } as Response
}

type Params = {
  page: number
  account?: string
}
const AnnouncementApi = createApi({
  reducerPath: 'announcementApi',
  baseQuery: fetchBaseQuery({ baseUrl: NOTIFICATION_API }),
  endpoints: builder => ({
    getAnnouncements: builder.query<Response, Params>({
      query: params => ({
        url: `/v1/messages/announcements`,
        params,
      }),
      transformResponse,
    }),
    getPrivateAnnouncements: builder.query<Response, Params>({
      query: ({ account, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params: { ...params, excludedTemplateIds: NOTIFICATION_IGNORE_TEMPLATE_IDS },
      }),
      transformResponse,
    }),
    ackPrivateAnnouncements: builder.mutation<
      Response,
      { account: string; action: 'read' | 'clear-all' | 'read-all'; ids?: number[] }
    >({
      query: ({ account, action, ids }) => {
        const body: { excludedTemplateIds?: number[]; ids?: number[] } = { ids }
        if (action === 'read-all' || action === 'clear-all') {
          body.excludedTemplateIds = NOTIFICATION_IGNORE_TEMPLATE_IDS.split(',').map(Number)
        }
        return {
          url: `/v1/users/${account}/notifications/${action}`,
          method: 'put',
          body,
        }
      },
    }),
  }),
})

export default AnnouncementApi
