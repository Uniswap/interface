import { ReactNode } from 'react'

import DescriptionPriceAlert from 'components/Announcement/Popups/PopupTopRightDescriptions/DescriptionPriceAlert'
import {
  AnnouncementTemplate,
  NotificationType,
  PopupContentAnnouncement,
  PrivateAnnouncementType,
} from 'components/Announcement/type'

type Summary = {
  title: string
  summary: ReactNode
  type: NotificationType
  link: string
  icon?: ReactNode
}

type SummaryMap = {
  [type in PrivateAnnouncementType]: (popup: AnnouncementTemplate) => Summary
}

const MAP_DESCRIPTION = {
  [PrivateAnnouncementType.PRICE_ALERT]: DescriptionPriceAlert,
} as Partial<SummaryMap>

export default function getPopupTopRightDescriptionByType(content: PopupContentAnnouncement) {
  const { templateType, templateBody } = content
  return MAP_DESCRIPTION[templateType]?.(templateBody)
}
