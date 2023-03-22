import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { KS_SETTING_API, NOTIFICATION_API } from 'constants/env'
import { Topic } from 'hooks/useNotification'

const NotificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({ baseUrl: NOTIFICATION_API }),
  endpoints: builder => ({
    getNotificationTopics: builder.query<
      { topicGroups: Topic[]; user: { email: string; telegram: string } },
      string | null | undefined
    >({
      query: walletAddress => ({
        url: `${KS_SETTING_API}/v1/topic-groups`,
        params: walletAddress ? { walletAddress } : {},
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getConnectedWallet: builder.query<string, string>({
      query: email => ({
        url: `/v1/users/connected`,
        params: { email },
      }),
      transformResponse: (data: any) => data?.data?.walletAddress,
    }),
    ackTelegramSubscriptionStatus: builder.mutation<Response, string>({
      query: wallet => ({
        url: `/v1/subscription-result/telegram`,
        method: 'DELETE',
        body: { wallet },
      }),
    }),
    unsubscribeTopic: builder.mutation<Response, { walletAddress: string; topicIDs: number[] }>({
      query: body => ({
        url: `/v1/topics/unsubscribe?userType=EMAIL`,
        method: 'POST',
        body,
      }),
    }),
    subscribeTopic: builder.mutation<Response, { email: string; walletAddress: string; topicIDs: number[] }>({
      query: body => ({
        url: `/v1/topics/subscribe?userType=EMAIL`,
        method: 'POST',
        body,
      }),
    }),
    buildTelegramVerification: builder.mutation<
      string,
      {
        chainId: string
        wallet: string
        subscribe: number[]
        unsubscribe: number[]
      }
    >({
      query: body => ({
        url: `/v1/topics/build-verification/telegram`,
        method: 'POST',
        body,
      }),
      transformResponse: (data: any) => data?.data?.verificationUrl,
    }),
  }),
})

export const {
  useLazyGetConnectedWalletQuery,
  useAckTelegramSubscriptionStatusMutation,
  useSubscribeTopicMutation,
  useUnsubscribeTopicMutation,
  useBuildTelegramVerificationMutation,
  useGetNotificationTopicsQuery,
} = NotificationApi

export default NotificationApi
