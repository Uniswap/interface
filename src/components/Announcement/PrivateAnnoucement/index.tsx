import { t } from '@lingui/macro'
import React, { ReactNode } from 'react'
import { CSSProperties } from 'styled-components'

import InboxItemBridge from 'components/Announcement/PrivateAnnoucement/InboxItemBridge'
import InboxItemLO from 'components/Announcement/PrivateAnnoucement/InboxItemLO'
import InboxItemPoolPosition from 'components/Announcement/PrivateAnnoucement/InboxItemPoolPosition'
import InboxItemPriceAlert from 'components/Announcement/PrivateAnnoucement/InboxItemPriceAlert'
import InboxItemTrendingSoon from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { InboxItemTime } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplate, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

export type PrivateAnnouncementProp<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  onRead: (data: PrivateAnnouncement, statusMessage: string) => void
  style: CSSProperties
  time?: ReactNode
  title?: string
}

type PrivateAnnouncementMap = {
  [type in PrivateAnnouncementType]: (data: PrivateAnnouncementProp) => JSX.Element
}
const ANNOUNCEMENT_MAP = {
  [PrivateAnnouncementType.POOL_POSITION]: InboxItemPoolPosition,
  [PrivateAnnouncementType.LIMIT_ORDER]: InboxItemLO,
  [PrivateAnnouncementType.TRENDING_SOON_TOKEN]: InboxItemTrendingSoon,
  [PrivateAnnouncementType.BRIDGE]: InboxItemBridge,
  [PrivateAnnouncementType.PRICE_ALERT]: InboxItemPriceAlert,
} as PrivateAnnouncementMap

export const PRIVATE_ANN_TITLE = {
  [PrivateAnnouncementType.POOL_POSITION]: t`Liquidity Pool Alert`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Order`,
  [PrivateAnnouncementType.TRENDING_SOON_TOKEN]: t`Trending Soon`,
  [PrivateAnnouncementType.BRIDGE]: t`Bridge Token`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alert`,
}

export default function InboxItem({ announcement, onRead, style }: PrivateAnnouncementProp) {
  const { templateType, sentAt, isRead } = announcement
  const theme = useTheme()
  const props: PrivateAnnouncementProp = {
    onRead,
    style,
    time: <InboxItemTime color={isRead ? theme.border : theme.subText}>{formatTime(sentAt)}</InboxItemTime>,
    announcement,
    title: PRIVATE_ANN_TITLE[templateType],
  }
  try {
    const component = ANNOUNCEMENT_MAP[templateType]
    return component ? React.createElement(component, props) : null
  } catch (error) {
    return null
  }
}
