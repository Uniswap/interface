import React from 'react'

import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import { AnnouncementTemplate, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'

import Bridge from './Bridge'
import LimitOrder from './LimitOrder'
import PoolPosition from './PoolPosition'
import PriceAlert from './PriceAlert'
import TrendingSoon from './TrendingSoon'

export type PrivateAnnouncementPropCenter<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  title?: string
}

type PrivateAnnouncementCenterMap = {
  [type in PrivateAnnouncementType]: (data: { announcement: PrivateAnnouncement }) => JSX.Element
}
const ANNOUNCEMENT_MAP_IN_CENTER = {
  [PrivateAnnouncementType.POOL_POSITION]: PoolPosition,
  [PrivateAnnouncementType.LIMIT_ORDER]: LimitOrder,
  [PrivateAnnouncementType.TRENDING_SOON_TOKEN]: TrendingSoon,
  [PrivateAnnouncementType.BRIDGE]: Bridge,
  [PrivateAnnouncementType.PRICE_ALERT]: PriceAlert,
} as PrivateAnnouncementCenterMap

export default function InboxItemNotificationCenter({ announcement }: PrivateAnnouncementPropCenter) {
  const { templateType } = announcement
  try {
    const component = ANNOUNCEMENT_MAP_IN_CENTER[templateType]
    const props: PrivateAnnouncementPropCenter = { announcement, title: PRIVATE_ANN_TITLE[templateType] }
    return component ? React.createElement(component, props) : null
  } catch (error) {
    return null
  }
}
