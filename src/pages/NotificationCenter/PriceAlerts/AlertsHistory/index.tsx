import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Flex } from 'rebass'
import { useGetListPriceAlertHistoryQuery } from 'services/priceAlert'

import { AnnouncementTemplatePriceAlert, PrivateAnnouncement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import NoData from 'pages/NotificationCenter/NoData'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

import SingleAlert from './SingleAlert'

const AlertsHistory = ({ setDisabledClearAll }: { setDisabledClearAll: (v: boolean) => void }) => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetListPriceAlertHistoryQuery(
    {
      account: account || '',
      page,
      pageSize: ITEMS_PER_PAGE,
    },
    { skip: !account },
  )

  const notifications = data?.notifications ?? []

  useEffect(() => {
    setDisabledClearAll(!notifications?.length)
  }, [notifications?.length, setDisabledClearAll])

  if (!notifications?.length || isLoading) {
    return <NoData msg={t`No alerts yet`} isLoading={isLoading} />
  }

  return (
    <>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        {notifications.map((alert, i) => (
          <SingleAlert key={alert.id} announcement={alert as PrivateAnnouncement<AnnouncementTemplatePriceAlert>} />
        ))}
      </Flex>

      <CommonPagination
        style={{ margin: 0 }}
        onPageChange={setPage}
        totalCount={data?.pagination?.totalItems || 0}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </>
  )
}

export default AlertsHistory
