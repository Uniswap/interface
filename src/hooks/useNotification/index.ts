import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useBuildTelegramVerificationMutation,
  useGetNotificationTopicsQuery,
  useSubscribeTopicMutation,
  useUnsubscribeTopicMutation,
} from 'services/notification'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { setLoadingNotification, setSubscribedNotificationTopic } from 'state/application/actions'
import { useNotificationModalToggle } from 'state/application/hooks'

export type Topic = {
  id: number
  code: string
  description: string
  name: string
  isSubscribed: boolean
  topics: Topic[]
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

  const { data: resp, refetch } = useGetNotificationTopicsQuery(account)

  useEffect(() => {
    if (!resp) return
    const topicGroups: Topic[] = (resp?.topicGroups ?? []).map((e: Topic, i) => ({
      ...e,
      id: Date.now() + i,
      isSubscribed: e?.topics?.every(e => e.isSubscribed),
    }))
    dispatch(setSubscribedNotificationTopic({ topicGroups, userInfo: resp?.user ?? { email: '', telegram: '' } }))
  }, [resp, dispatch])

  const refreshTopics = useCallback(() => account && refetch(), [refetch, account])
  const [callSubscribeTopic] = useSubscribeTopicMutation()
  const [callUnSubscribeTopic] = useUnsubscribeTopicMutation()
  const [buildTelegramVerification] = useBuildTelegramVerificationMutation()

  const saveNotification = useCallback(
    async ({ subscribeIds, unsubscribeIds, email, isEmail, isChangeEmailOnly, isTelegram }: SaveNotificationParam) => {
      try {
        setLoading(true)
        if (isEmail) {
          if (unsubscribeIds.length) {
            await callUnSubscribeTopic({ walletAddress: account ?? '', topicIDs: unsubscribeIds })
          }
          if (subscribeIds.length || isChangeEmailOnly) {
            const allTopicSubscribed = topicGroups.reduce(
              (topics: number[], item) => [...topics, ...item.topics.filter(e => e.isSubscribed).map(e => e.id)],
              [],
            )
            await callSubscribeTopic({
              email,
              walletAddress: account ?? '',
              topicIDs: isChangeEmailOnly ? allTopicSubscribed : subscribeIds,
            })
          }
          return
        }
        if (isTelegram) {
          const data = await buildTelegramVerification({
            chainId: chainId + '',
            wallet: account ?? '',
            subscribe: subscribeIds,
            unsubscribe: unsubscribeIds,
          })
          return data
        }
        return
      } catch (e) {
        return Promise.reject(e)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, account, chainId, topicGroups, callSubscribeTopic, callUnSubscribeTopic, buildTelegramVerification],
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
