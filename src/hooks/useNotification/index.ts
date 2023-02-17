import { uuid4 } from '@sentry/utils'
import axios from 'axios'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR, { mutate } from 'swr'

import { KS_SETTING_API, NOTIFICATION_API } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'
import { useNotificationModalToggle } from 'state/application/hooks'

const getAllTopicUrl = (account: string | null | undefined) =>
  `${KS_SETTING_API}/v1/topic-groups${account ? `?walletAddress=${account}` : ''}`

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

type SaveNotificationParam = {
  subscribeIds: number[]
  unsubscribeIds: number[]
  email: string
  isChangeEmailOnly: boolean
  isEmail: boolean
  isTelegram: boolean
}

const useNotification = () => {
  const { isLoading, topicGroups, userInfo } = useSelector((state: AppState) => state.application.notification)

  const { account, chainId } = useActiveWeb3React()
  const toggleSubscribeModal = useNotificationModalToggle()
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
    dispatch(setSubscribedNotificationTopic({ topicGroups, userInfo: resp?.user ?? { email: '', telegram: '' } }))
  }, [resp, dispatch])

  const refreshTopics = useCallback(() => account && mutate(getAllTopicUrl(account)), [account])

  const saveNotification = useCallback(
    async ({ subscribeIds, unsubscribeIds, email, isEmail, isChangeEmailOnly, isTelegram }: SaveNotificationParam) => {
      try {
        setLoading(true)
        if (isEmail) {
          if (unsubscribeIds.length) {
            await axios.post(`${NOTIFICATION_API}/v1/topics/unsubscribe?userType=EMAIL`, {
              walletAddress: account,
              topicIDs: unsubscribeIds,
            })
          }
          if (subscribeIds.length || isChangeEmailOnly) {
            const allTopicSubscribed = topicGroups.reduce(
              (topics: number[], item) => [...topics, ...item.topics.filter(e => e.isSubscribed).map(e => e.id)],
              [],
            )
            await axios.post(`${NOTIFICATION_API}/v1/topics/subscribe?userType=EMAIL`, {
              email,
              walletAddress: account,
              topicIDs: isChangeEmailOnly ? allTopicSubscribed : subscribeIds,
            })
          }
          return
        }
        if (isTelegram) {
          const response = await axios.post(`${NOTIFICATION_API}/v1/topics/build-verification/telegram`, {
            chainId: chainId + '',
            wallet: account,
            subscribe: subscribeIds,
            unsubscribe: unsubscribeIds,
          })
          return response?.data?.data
        }
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, account, chainId, topicGroups],
  )

  const showNotificationModal = useCallback(() => {
    refreshTopics()
    toggleSubscribeModal()
  }, [refreshTopics, toggleSubscribeModal])

  return {
    topicGroups,
    isLoading,
    userInfo,
    saveNotification,
    showNotificationModal,
    refreshTopics,
  }
}

export default useNotification
