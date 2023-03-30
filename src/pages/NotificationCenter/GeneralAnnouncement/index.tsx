import { useState } from 'react'
import { useGetAnnouncementsQuery } from 'services/announcement'

import AnnouncementItem from 'pages/NotificationCenter/GeneralAnnouncement/AnnouncementItem'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/styled'

export default function GeneralAnnouncement() {
  const [page, setPage] = useState(1)
  const { data } = useGetAnnouncementsQuery({ page, pageSize: ITEMS_PER_PAGE })

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        {data?.notifications.map(item => (
          <AnnouncementItem key={item.id} announcement={item} />
        ))}
      </ShareContentWrapper>
      <CommonPagination
        onPageChange={setPage}
        totalCount={data?.pagination?.totalItems || 0}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </ShareWrapper>
  )
}
