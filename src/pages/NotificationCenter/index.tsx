import { Trans } from '@lingui/macro'
import { Navigate, Route, Routes } from 'react-router-dom'
import styled from 'styled-components'

import { PrivateAnnouncementType } from 'components/Announcement/type'
import MailIcon from 'components/Icons/MailIcon'
import { APP_PATHS } from 'constants/index'
import CreateAlert from 'pages/NotificationCenter/CreateAlert'
import GeneralAnnouncement from 'pages/NotificationCenter/GeneralAnnouncement'
import Menu from 'pages/NotificationCenter/Menu'
import Overview from 'pages/NotificationCenter/Overview'
import PriceAlerts from 'pages/NotificationCenter/PriceAlerts'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import VerifyComponent from 'pages/Verify/VerifyComponent'

import PrivateAnnouncement from './PrivateAnnouncement'

const PageWrapper = styled.div`
  padding: 32px 50px;
  width: 100%;
  max-width: 1300px;

  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    flex: 1 1 100%;
  `}
`
const Wrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;

  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
    flex-direction: column;
    gap: 16px;
    flex: 1 1 100%;
  `}
`

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 16px;
  `}
`

const Title = styled.h2`
  margin-left: 12px;
  font-size: 24px;
  font-weight: 500;
`

const LeftColumn = styled.div`
  width: 280px;

  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 24px 0px 0px 24px;
  border-right: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border: none;
    border-radius: 0;
    width: 100%;
    background-color: unset;
  `}
`
const RightColumn = styled.div`
  background-color: ${({ theme }) => theme.background};
  flex: 1;
  border-radius: 0px 24px 24px 0px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    border-radius: 0px;

    display: flex;
    flex-direction: column;
  `}
`

function NotificationCenter() {
  return (
    <PageWrapper>
      <HeaderWrapper>
        <MailIcon />
        <Title>
          <Trans>Notification Center</Trans>
        </Title>
      </HeaderWrapper>
      <Wrapper>
        <LeftColumn>
          <Menu />
        </LeftColumn>
        <RightColumn>
          <Routes>
            <Route index path={NOTIFICATION_ROUTES.ALL} element={<PrivateAnnouncement />} />
            <Route path={NOTIFICATION_ROUTES.OVERVIEW} element={<Overview />} />
            <Route path={NOTIFICATION_ROUTES.GENERAL} element={<GeneralAnnouncement />} />
            <Route path={NOTIFICATION_ROUTES.PRICE_ALERTS} element={<PriceAlerts />} />
            <Route path={`${NOTIFICATION_ROUTES.PRICE_ALERTS}/*`} element={<PriceAlerts />} />
            <Route
              path={NOTIFICATION_ROUTES.MY_ELASTIC_POOLS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.POOL_POSITION} />}
            />
            <Route
              path={NOTIFICATION_ROUTES.LIMIT_ORDERS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.LIMIT_ORDER} />}
            />
            <Route
              path={NOTIFICATION_ROUTES.BRIDGE}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.BRIDGE} />}
            />
            <Route
              path={NOTIFICATION_ROUTES.TRENDING_SOON_TOKENS}
              element={<PrivateAnnouncement type={PrivateAnnouncementType.TRENDING_SOON_TOKEN} />}
            />
            <Route path={NOTIFICATION_ROUTES.CREATE_ALERT} element={<CreateAlert />} />

            <Route path="*" element={<Navigate to={`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.ALL}`} />} />
          </Routes>
        </RightColumn>
      </Wrapper>
      <VerifyComponent />
    </PageWrapper>
  )
}

export default NotificationCenter
