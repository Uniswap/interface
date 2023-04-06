import { stringify } from 'querystring'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAckPrivateAnnouncementsByIdsMutation, useGetPrivateAnnouncementsByIdsQuery } from 'services/announcement'

import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'
import TitleOnMobile from 'pages/NotificationCenter/PriceAlerts/TitleOnMobile'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/styled'

export enum Tab {
  ACTIVE = 'active',
  HISTORY = 'history',
}

const useAckAnnouncement = (templateIds: string) => {
  const { account } = useActiveWeb3React()
  const [ackAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const { data, refetch } = useGetPrivateAnnouncementsByIdsQuery(
    { page: 1, account: account ?? '', templateIds, pageSize: ITEMS_PER_PAGE },
    { skip: !account || !templateIds },
  )
  const numberOfUnread = data?.numberOfUnread || 0
  const loadingRef = useRef(false)
  useEffect(() => {
    if (loadingRef.current || !account || numberOfUnread === 0) return
    // mark all as read
    loadingRef.current = true
    ackAnnouncement({ templateIds: templateIds || undefined, account })
      .then(() => {
        refetch()
      })
      .catch(e => {
        console.error('ackAnnouncement', e)
      })
      .finally(() => {
        loadingRef.current = false
      })
  }, [numberOfUnread, templateIds, account, ackAnnouncement, refetch])
}

const PriceAlerts = () => {
  const { tab, ...rest } = useParsedQueryString<{ tab: Tab }>()
  const [currentTab, setCurrentTab] = useState(tab || Tab.ACTIVE)
  const [_disabledClearAll, setDisabledClearAll] = useState(true)
  const disabledClearAll = useDebounce(_disabledClearAll, 50)

  const navigate = useNavigate()
  const onSetTab = (tab: Tab) => {
    setCurrentTab(tab)
    const search = { ...rest, tab }
    navigate({ search: stringify(search) }, { replace: true })
    setDisabledClearAll(false)
  }

  useAckAnnouncement(getAnnouncementsTemplateIds().PRICE_ALERT)

  return (
    <ShareWrapper>
      <TitleOnMobile />
      <ShareContentWrapper>
        <Header currentTab={currentTab} setCurrentTab={onSetTab} disabledClearAll={disabledClearAll} />
        {currentTab === Tab.ACTIVE ? (
          <ActiveAlerts setDisabledClearAll={setDisabledClearAll} />
        ) : (
          <AlertsHistory setDisabledClearAll={setDisabledClearAll} />
        )}
      </ShareContentWrapper>
    </ShareWrapper>
  )
}

export default PriceAlerts
