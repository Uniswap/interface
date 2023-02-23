import { ReactNode } from 'react'
import { CSSProperties } from 'styled-components'

import InboxItemBridge from 'components/Announcement/PrivateAnnoucement/InboxItemBridge'
import InboxItemLO from 'components/Announcement/PrivateAnnoucement/InboxItemLO'
import InboxItemTrendingSoon from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { InboxItemTime } from 'components/Announcement/PrivateAnnoucement/styled'
import { formatTime } from 'components/Announcement/helper'
import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'

export type PrivateAnnouncementProp = {
  announcement: PrivateAnnouncement
  onRead: (data: PrivateAnnouncement, statusMessage: string) => void
  style: CSSProperties
  time?: ReactNode
}

export default function InboxItem({ announcement, onRead, style }: PrivateAnnouncementProp) {
  const { templateType, sentAt, isRead } = announcement
  const theme = useTheme()
  const props = {
    announcement,
    onRead,
    style,
    time: <InboxItemTime color={isRead ? theme.border : theme.subText}>{formatTime(sentAt)}</InboxItemTime>,
  }
  switch (templateType) {
    case PrivateAnnouncementType.BRIDGE:
      return <InboxItemBridge {...props} />
    case PrivateAnnouncementType.LIMIT_ORDER:
      return <InboxItemLO {...props} />
    case PrivateAnnouncementType.TRENDING_SOON_TOKEN:
      return <InboxItemTrendingSoon {...props} />
    default:
      return null
  }
}
