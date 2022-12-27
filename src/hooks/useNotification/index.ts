import { uuid4 } from '@sentry/utils'
import axios, { AxiosResponse } from 'axios'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR, { mutate } from 'swr'

import { KS_SETTING_API, NOTIFICATION_API } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'

const getAllTopicUrl = (account: string | null | undefined) =>
  `${KS_SETTING_API}/v1/notification/topic-groups${account ? `?walletAddress=${account}` : ''}`

export type Topic = {
  id: number
  code: string
  description: string
  name: string
  isSubscribed: boolean
  topics: Topic[]
}

export const NOTIFICATION_TOPICS = {
  TRENDING_SOON: 2,
  POSITION_POOL: 1,
}

const useNotification = () => {
  const { isLoading, topicGroups, userInfo } = useSelector((state: AppState) => state.application.notification)

  const { account, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  const setLoading = useCallback(
    (isLoading: boolean) => {
      dispatch(setLoadingNotification(isLoading))
    },
    [dispatch],
  )

  const { data: resp } = useSWR(
    getAllTopicUrl(account),
    (url: string) => {
      try {
        if (url) {
          return axios.get(url).then(({ data }) => data.data)
        }
      } catch (error) {}
      return
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  useEffect(() => {
    if (!resp) return
    const topicGroups: Topic[] = (resp?.topicGroups ?? []).map((e: Topic) => ({
      ...e,
      id: uuid4(),
      isSubscribed: e?.topics?.every(e => e.isSubscribed),
    }))
    dispatch(setSubscribedNotificationTopic({ topicGroups, userInfo: resp?.user ?? { email: '' } }))
  }, [resp, dispatch])

  const refreshTopics = useCallback(() => account && mutate(getAllTopicUrl(account)), [account])

  const handleSubscribe = useCallback(
    async (subIds: number[], unsubIds: number[], registerAccount: string, isEmail = true) => {
      try {
        setLoading(true)
        const promises = []
        if (isEmail) {
          subIds.length &&
            promises.push(
              axios.post(`${NOTIFICATION_API}/v1/topics/subscribe?userType=EMAIL`, {
                email: registerAccount,
                walletAddress: account,
                topicIDs: subIds,
              }),
            )
          unsubIds.length &&
            promises.push(
              axios.post(`${NOTIFICATION_API}/v1/topics/unsubscribe?userType=EMAIL`, {
                walletAddress: account,
                topicIDs: unsubIds,
              }),
            )
        } else {
          promises.push(
            axios.post(`${NOTIFICATION_API}/v1/topics/build-verification/telegram`, {
              chainId: chainId + '',
              wallet: account,
              subscribe: unsubIds,
              unsubscribe: unsubIds,
            }),
          )
        }

        let response: AxiosResponse[] = []
        if (promises.length) {
          response = await Promise.all(promises)
        }
        refreshTopics()
        return response.map(e => e?.data?.data)
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
      return
    },
    [setLoading, account, refreshTopics, chainId],
  )

  return {
    topicGroups,
    isLoading,
    handleSubscribe,
    userInfo,
    refreshTopics,
  }
}

export default useNotification
