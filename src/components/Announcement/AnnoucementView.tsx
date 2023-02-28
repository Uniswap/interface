import { Trans } from '@lingui/macro'
import { useCallback } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Flex, Text } from 'rebass'
import AnnouncementApi from 'services/announcement'
import styled, { CSSProperties, css } from 'styled-components'

import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import MenuMoreAction from 'components/Announcement/MoreAction'
import InboxItem from 'components/Announcement/PrivateAnnoucement'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import Column from 'components/Column'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 70vh;
  padding-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    min-width: 380px;
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: unset;
  `};
`
const Container = styled.div`
  gap: 12px;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  padding-right: 16px;
`

const TabItem = styled.div<{ active: boolean }>`
  flex: 1;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  padding: 6px 0px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  ${({ active }) =>
    active &&
    css`
      background-color: ${({ theme }) => theme.tabActive};
      color: ${({ theme }) => theme.text};
    `};
`

const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

const TabWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  display: flex;
  padding: 4px;
  gap: 10px;
  justify-content: space-between;
`

const ListAnnouncement = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 0px 0px 12px 12px;
  .scrollbar {
    &::-webkit-scrollbar {
      display: block;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.border};
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
  `};
`

const Badge = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  padding: 0px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
`
export enum Tab {
  INBOX,
  ANNOUNCEMENT,
}

type Props = {
  numberOfUnread: number
  totalAnnouncement: number
  announcements: Announcement[] | PrivateAnnouncement[]
  isMyInboxTab: boolean
  onSetTab: (tab: Tab) => void
  refreshAnnouncement: () => void
  loadMoreAnnouncements: () => void
  toggleNotificationCenter: () => void
}

export default function AnnouncementView({
  numberOfUnread,
  announcements,
  totalAnnouncement,
  refreshAnnouncement,
  loadMoreAnnouncements,
  toggleNotificationCenter,
  isMyInboxTab,
  onSetTab,
}: Props) {
  const { account } = useActiveWeb3React()

  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()

  const { useAckPrivateAnnouncementsMutation } = AnnouncementApi
  const [ackAnnouncement] = useAckPrivateAnnouncementsMutation()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { mixpanelHandler } = useMixpanel()

  const onReadPrivateAnnouncement = (item: PrivateAnnouncement, statusMessage: string) => {
    if (!account) return
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_INBOX_MESSAGE, {
      message_status: statusMessage,
      message_type: item.templateType,
    })
    if (item.isRead) {
      toggleNotificationCenter()
      return
    }
    ackAnnouncement({ account, action: 'read', ids: [item.id] })
      .then(() => {
        refreshAnnouncement()
        toggleNotificationCenter()
      })
      .catch(err => {
        console.error('ack noti error', err)
      })
  }

  const onReadAnnouncement = (item: Announcement) => {
    toggleNotificationCenter()
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE, {
      message_title: item.templateBody.name,
    })
  }

  const clearAll = () => {
    if (!announcements.length || !account) return
    ackAnnouncement({ account, action: 'clear-all' })
      .then(() => {
        refreshAnnouncement()
      })
      .catch(err => {
        console.error('ack noti error', err)
      })
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLEAR_ALL_INBOXES, {
      total_message_count: totalAnnouncement,
    })
  }

  const hasMore = announcements.length !== totalAnnouncement
  const isItemLoaded = (index: number) => !hasMore || index < announcements.length
  const itemCount = hasMore ? announcements.length + 1 : announcements.length

  const tabComponent = (
    <TabWrapper>
      <TabItem active={isMyInboxTab} onClick={() => onSetTab(Tab.INBOX)}>
        <Trans>My Inbox</Trans>
        {numberOfUnread > 0 && account && <Badge>{formatNumberOfUnread(numberOfUnread)}</Badge>}
      </TabItem>
      <TabItem active={!isMyInboxTab} onClick={() => onSetTab(Tab.ANNOUNCEMENT)}>
        <Trans>General</Trans>
      </TabItem>
    </TabWrapper>
  )

  const showClearAll = account && isMyInboxTab && announcements.length > 0

  const onRefChange = useCallback((node: HTMLDivElement) => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [])

  return (
    <Wrapper>
      <Container>
        <RowBetween gap="10px" height="28px">
          <Title>
            <NotificationIcon size={18} />
            <Trans>Notifications</Trans>
          </Title>
          <Flex style={{ gap: '20px', alignItems: 'center' }}>
            {showClearAll && <MenuMoreAction showClearAll={Boolean(showClearAll)} clearAll={clearAll} />}
            {isMobile && <X color={theme.subText} onClick={toggleNotificationCenter} cursor="pointer" />}
          </Flex>
        </RowBetween>

        {tabComponent}
      </Container>

      {announcements.length ? (
        <ListAnnouncement>
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreAnnouncements}>
                {({ onItemsRendered, ref }) => (
                  <FixedSizeList
                    outerRef={onRefChange}
                    height={height}
                    width={width}
                    itemCount={itemCount}
                    itemSize={isMyInboxTab ? 116 : 126}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                  >
                    {({ index, style }: { index: number; style: CSSProperties }) => {
                      if (!isItemLoaded(index)) {
                        return null
                      }
                      const item = announcements[index]
                      return isMyInboxTab ? (
                        <InboxItem
                          style={style}
                          key={item.id}
                          announcement={item as PrivateAnnouncement}
                          onRead={onReadPrivateAnnouncement}
                        />
                      ) : (
                        <AnnouncementItem
                          key={item.id}
                          style={style}
                          announcement={item as Announcement}
                          onRead={() => onReadAnnouncement(item as Announcement)}
                        />
                      )
                    }}
                  </FixedSizeList>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </ListAnnouncement>
      ) : (
        <Column style={{ alignItems: 'center', margin: '24px 0px 32px 0px' }} gap="8px">
          <Info color={theme.subText} size={27} />
          {!account && isMyInboxTab ? (
            <>
              <Text color={theme.primary} sx={{ cursor: 'pointer' }} textAlign="center" onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </Text>
              <Text color={theme.subText} textAlign="center">
                <Trans>to view My inbox</Trans>
              </Text>
            </>
          ) : (
            <Text color={theme.subText} textAlign="center">
              <Trans>No notifications found</Trans>
            </Text>
          )}
        </Column>
      )}
    </Wrapper>
  )
}
