import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Flex } from 'rebass'
import { useGetAlertStatsQuery, useGetListAlertsQuery } from 'services/priceAlert'

import { PrivateAnnouncementType } from 'components/Announcement/type'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import NoData from 'pages/NotificationCenter/NoData'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'
import { subscribePrivateAnnouncement } from 'utils/firebase'

import SingleAlert from './SingleAlert'

const ActiveAlerts = ({ setDisabledClearAll }: { setDisabledClearAll: (v: boolean) => void }) => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch } = useGetListAlertsQuery(
    {
      walletAddress: account || '',
      page,
      pageSize: ITEMS_PER_PAGE,
      sort: 'is_enabled:desc,created_at:desc',
    },
    { skip: !account },
  )
  const { data: alertStat, refetch: refetchStat } = useGetAlertStatsQuery(account || '', { skip: !account })
  const isMaxQuotaActiveAlert = alertStat ? alertStat.totalActiveAlerts >= alertStat.maxActiveAlerts : false

  useEffect(() => {
    setDisabledClearAll(!data?.alerts?.length)
  }, [data?.alerts?.length, setDisabledClearAll])

  useEffect(() => {
    if (!account) return
    const unsubscribePrivate = subscribePrivateAnnouncement(account, data => {
      data.forEach(item => {
        if (item.templateType === PrivateAnnouncementType.PRICE_ALERT) {
          refetch()
          refetchStat()
        }
      })
    })
    return () => unsubscribePrivate?.()
  }, [account, refetch, refetchStat])

  if (isLoading) {
    return (
      <Flex justifyContent="center" height="100%" minHeight="100%" alignItems="center">
        <Loader size="36px" />
      </Flex>
    )
  }

  const totalAlert = data?.alerts?.length ?? 0

  if (!totalAlert) {
    return <NoData msg={t`No price alerts created yet`} />
  }

  return (
    <>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        {data?.alerts.map(alert => (
          <SingleAlert key={alert.id} alert={alert} isMaxQuotaActiveAlert={isMaxQuotaActiveAlert} />
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

export default ActiveAlerts
