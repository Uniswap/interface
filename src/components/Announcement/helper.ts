import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AnnouncementApi from 'services/announcement'

import { AnnouncementTemplatePopup, PopupContentAnnouncement, PopupItemType } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import { useAppDispatch } from 'state/hooks'

const LsKey = 'ack-announcements'
export const getAnnouncementsAckMap = () => JSON.parse(localStorage[LsKey] || '{}')

export const ackAnnouncementPopup = (id: string | number) => {
  const announcementsMap = getAnnouncementsAckMap()
  localStorage.setItem(
    LsKey,
    JSON.stringify({
      ...announcementsMap,
      [id]: '1',
    }),
  )
}

export const formatNumberOfUnread = (num: number | undefined) => (num ? (num > 10 ? '10+' : num + '') : null)

export const isPopupCanShow = (popupInfo: PopupItemType<PopupContentAnnouncement>, chainId: ChainId) => {
  const { templateBody = {}, metaMessageId } = popupInfo.content
  const { endAt, startAt, chainIds = [] } = templateBody as AnnouncementTemplatePopup
  const isRightChain = chainIds.includes(chainId + '')
  const announcementsAckMap = getAnnouncementsAckMap()
  const isRead = announcementsAckMap[metaMessageId]
  const isExpired = Date.now() < startAt * 1000 || Date.now() > endAt * 1000
  return !isRead && !isExpired && isRightChain
}

/**
 * this hook to navigate to specific url
 * detect using window.open or navigate (react-router)
 * check change chain if needed
 */
export const useNavigateToUrl = () => {
  const navigate = useNavigate()
  const { chainId: currentChain } = useActiveWeb3React()
  const changeNetwork = useChangeNetwork()

  const redirect = useCallback(
    (actionURL: string) => {
      if (actionURL && actionURL.startsWith('/')) {
        navigate(actionURL)
        return
      }
      const { pathname, host, search } = new URL(actionURL)
      if (window.location.host === host) {
        navigate(`${pathname}${search}`)
      } else {
        window.open(actionURL)
      }
    },
    [navigate],
  )

  return useCallback(
    (actionURL: string, chainId?: ChainId) => {
      try {
        if (!actionURL) return
        if (chainId && chainId !== currentChain) {
          changeNetwork(chainId, () => redirect(actionURL), undefined, true)
        } else {
          redirect(actionURL)
        }
      } catch (error) {}
    },
    [changeNetwork, currentChain, redirect],
  )
}

export const useInvalidateTagAnnouncement = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    (tag: string) => {
      dispatch({
        type: `${AnnouncementApi.reducerPath}/invalidateTags`,
        payload: [tag],
      })
    },
    [dispatch],
  )
}
