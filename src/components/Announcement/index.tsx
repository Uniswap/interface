import { useCallback, useEffect, useRef, useState } from 'react'
import { useMedia, usePrevious } from 'react-use'
import AnnouncementApi from 'services/announcement'
import styled, { css } from 'styled-components'

import AnnouncementView, { Tab } from 'components/Announcement/AnnoucementView'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  position: relative;
  outline: none;
  background-color: transparent;
  border: 1px solid transparent;
  :hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.buttonBlack};
    border: 1px solid ${({ theme }) => theme.primary};
  }

  ${({ active }) =>
    active
      ? css`
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const Badge = styled.div<{ isOverflow: boolean }>`
  border-radius: 16px;
  position: absolute;
  top: -6px;
  right: ${({ isOverflow }) => (isOverflow ? -16 : -10)}px;
  background-color: ${({ theme }) => theme.primary};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  z-index: 1;
`

const browserCustomStyle = css`
  padding: 0;
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`
const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export default function AnnouncementComponent() {
  const { account, chainId } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState(Tab.ANNOUNCEMENT)
  const { mixpanelHandler } = useMixpanel()

  const isOpenNotificationCenter = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggleNotificationCenter = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [curPage, setPage] = useState(1)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [privateAnnouncements, setPrivateAnnouncements] = useState<PrivateAnnouncement[]>([])

  const { useLazyGetAnnouncementsQuery, useLazyGetPrivateAnnouncementsQuery, useAckPrivateAnnouncementsMutation } =
    AnnouncementApi
  const [fetchGeneralAnnouncement, { data: respAnnouncement = responseDefault }] = useLazyGetAnnouncementsQuery()
  const [fetchPrivateAnnouncement, { data: respPrivateAnnouncement = responseDefault, isError }] =
    useLazyGetPrivateAnnouncementsQuery()

  const [ackAnnouncement] = useAckPrivateAnnouncementsMutation()

  const isMyInboxTab = activeTab === Tab.INBOX
  const loadingAnnouncement = useRef(false)

  const fetchAnnouncementsByTab = useCallback(
    async (isReset = false, tab: Tab = activeTab) => {
      if (loadingAnnouncement.current) return
      try {
        const isMyInboxTab = tab === Tab.INBOX
        loadingAnnouncement.current = true
        const page = isReset ? 1 : curPage + 1
        const promise = isMyInboxTab
          ? account
            ? fetchPrivateAnnouncement({ page, account })
            : null
          : fetchGeneralAnnouncement({ page })

        if (!promise) return
        const { data } = await promise
        const notifications = data?.notifications ?? []
        if (isMyInboxTab) {
          const newData = isReset ? notifications : [...privateAnnouncements, ...notifications]
          setPrivateAnnouncements(newData as PrivateAnnouncement[])
        } else {
          const newData = isReset ? notifications : [...announcements, ...notifications]
          setAnnouncements(newData as Announcement[])
        }
        setPage(page)
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
    },
    [
      account,
      announcements,
      privateAnnouncements,
      curPage,
      activeTab,
      fetchGeneralAnnouncement,
      fetchPrivateAnnouncement,
    ],
  )

  const {
    pagination: { totalItems: totalAnnouncement },
  } = respAnnouncement

  const {
    numberOfUnread,
    pagination: { totalItems: totalPrivateAnnouncement },
  } = isError ? responseDefault : respPrivateAnnouncement
  const refreshAnnouncement = () => {
    fetchAnnouncementsByTab(true)
  }

  const loadMoreAnnouncements = useCallback(() => {
    fetchAnnouncementsByTab()
  }, [fetchAnnouncementsByTab])

  const trackingClickTab = useCallback(
    (tab: Tab, mode: 'manual' | 'auto') => {
      if (tab === Tab.INBOX)
        mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_INBOX, {
          mode,
          total_unread_message_count: numberOfUnread,
          total_message_count: totalPrivateAnnouncement,
        })
      else {
        mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT, {
          mode,
          total_message_count: totalAnnouncement,
        })
      }
    },
    [mixpanelHandler, numberOfUnread, totalAnnouncement, totalPrivateAnnouncement],
  )
  const trackingClickTabRef = useRef(trackingClickTab)
  trackingClickTabRef.current = trackingClickTab

  const onSetTab = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
    trackingClickTab(tab, 'manual')
    tab !== activeTab && fetchAnnouncementsByTab(true, tab)
  }

  const prefetchPrivateAnnouncements = useCallback(async () => {
    try {
      if (!account) return []
      const { data } = await fetchPrivateAnnouncement({ account, page: 1 })
      const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
      setPrivateAnnouncements(notifications)
      return notifications
    } catch (error) {
      setPrivateAnnouncements([])
      return []
    }
  }, [account, fetchPrivateAnnouncement])

  const prevOpen = usePrevious(isOpenNotificationCenter)
  useEffect(() => {
    const justClosedPopup = prevOpen !== isOpenNotificationCenter && !isOpenNotificationCenter
    if (justClosedPopup) return

    // prefetch data
    prefetchPrivateAnnouncements().then((data: PrivateAnnouncement[]) => {
      const newTab = account && data.length ? Tab.INBOX : Tab.ANNOUNCEMENT
      setActiveTab(newTab)
      if (prevOpen !== isOpenNotificationCenter && isOpenNotificationCenter) {
        trackingClickTabRef.current(newTab, 'auto')
      }
      if (isOpenNotificationCenter && newTab === Tab.ANNOUNCEMENT)
        fetchGeneralAnnouncement({ page: 1 })
          .then(({ data }) => {
            setAnnouncements((data?.notifications ?? []) as Announcement[])
          })
          .catch(() => {
            setAnnouncements([])
          })
    })
  }, [account, prefetchPrivateAnnouncements, fetchGeneralAnnouncement, prevOpen, isOpenNotificationCenter])

  useEffect(() => {
    if (!account) {
      setPrivateAnnouncements([])
    }
  }, [account, chainId])

  useInterval(prefetchPrivateAnnouncements, 10_000)

  const togglePopupWithAckAllMessage = () => {
    toggleNotificationCenter()
    if (isOpenNotificationCenter && numberOfUnread && account) {
      ackAnnouncement({ account, action: 'read-all' })
    }
  }

  const props = {
    numberOfUnread,
    announcements: isMyInboxTab ? privateAnnouncements : announcements,
    totalAnnouncement: isMyInboxTab ? totalPrivateAnnouncement : totalAnnouncement,
    refreshAnnouncement,
    loadMoreAnnouncements,
    toggleNotificationCenter: togglePopupWithAckAllMessage,
    isMyInboxTab,
    onSetTab,
  }
  const bellIcon = (
    <StyledMenuButton
      active={isOpenNotificationCenter || numberOfUnread > 0}
      onClick={() => {
        togglePopupWithAckAllMessage()
        if (!isOpenNotificationCenter) mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP)
      }}
    >
      <NotificationIcon />
      {numberOfUnread > 0 && (
        <Badge isOverflow={formatNumberOfUnread(numberOfUnread).length >= 3}>
          {formatNumberOfUnread(numberOfUnread)}
        </Badge>
      )}
    </StyledMenuButton>
  )
  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {bellIcon}
          <Modal isOpen={isOpenNotificationCenter} onDismiss={togglePopupWithAckAllMessage} minHeight={80}>
            <AnnouncementView {...props} />
          </Modal>
        </>
      ) : (
        <MenuFlyout
          trigger={bellIcon}
          customStyle={browserCustomStyle}
          isOpen={isOpenNotificationCenter}
          toggle={togglePopupWithAckAllMessage}
        >
          <AnnouncementView {...props} />
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
