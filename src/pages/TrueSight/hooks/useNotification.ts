import { useState } from 'react'
import { useLocalStorage } from 'react-use'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { checkChrome } from 'utils/checkChrome'
import { fetchToken } from 'utils/firebase'

const useNotification = () => {
  const [isLoading, setLoading] = useState(false)
  const [hasSubscribed, setHasSubscribed] = useLocalStorage('true-sight-subscribe', false)
  const isChrome = checkChrome()
  const { mixpanelHandler } = useMixpanel()

  const handleSubscribe = async () => {
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON)

    if (!isChrome || isLoading) {
      return
    }

    const token = await fetchToken()
    // TODO: implement for Safari
    if (!token) {
      return
    }

    setLoading(true)

    try {
      const payload = { users: [{ type: isChrome && 'FCM_TOKEN', receivingAddress: token }] }
      const response = await fetch(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/1/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 200) {
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS)
        setHasSubscribed(true)
      }
    } catch (e) {
      console.error('Something went wrong while subscribing', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON)

    if (isLoading) {
      return
    }

    const token = await fetchToken()
    if (!token) {
      return
    }

    setLoading(true)

    try {
      const payload = { users: [{ type: isChrome && 'FCM_TOKEN', receivingAddress: token }] }
      const response = await fetch(`${process.env.REACT_APP_NOTIFICATION_API}/v1/topics/1/unsubscribe`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 200) {
        mixpanelHandler(MIXPANEL_TYPE.DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS)
        setHasSubscribed(false)
      }
    } catch (e) {
      console.error('Something went wrong while unsubscribing', e)
    } finally {
      setLoading(false)
    }
  }
  return { isLoading, isChrome, hasSubscribed, handleSubscribe, handleUnsubscribe }
}

export default useNotification
