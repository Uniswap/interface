import { Link, useLocation } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { formatNumberOfUnread } from 'components/Announcement/helper'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const IconWrapper = styled.div`
  height: 16px;
  flex: 0 0 16px;
  justify-content: center;
  align-items: center;
`

const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
  overflow-wrap: break-word;
`

const Badge = styled.div`
  padding: 2px 4px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  background: ${({ theme }) => theme.subText};
  color: ${({ theme }) => theme.textReverse};
`

type WrapperProps = {
  $active: boolean
  $mobile: boolean
}
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-active': props.$active,
  'data-mobile': props.$mobile,
}))<WrapperProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  padding: 4px 0;
  cursor: pointer;

  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};

    ${Badge} {
      background-color: ${({ theme }) => theme.primary};
    }
  }

  &[data-mobile='true'] {
    height: 36px;
    padding: 0 12px;
    flex-wrap: nowrap;

    border: 1px solid ${({ theme }) => theme.subText};
    border-radius: 36px;

    ${Label} {
      overflow-wrap: unset;
      white-space: nowrap;
    }

    &[data-active='true'] {
      background-color: ${({ theme }) => `${theme.primary}33`};
      border-color: transparent;
    }
  }
`

type Props = {
  href: string
  icon: React.ReactElement
  text: string
  unread?: number
  isMobile?: boolean
}

const MenuItem: React.FC<Props> = ({ icon, text, unread, href, isMobile = false }) => {
  const location = useLocation()
  const theme = useTheme()

  const path = `${APP_PATHS.NOTIFICATION_CENTER}${href}`
  const isActive = location.pathname === path

  const { mixpanelHandler } = useMixpanel()
  const trackingPriceAlertTab = () => {
    if (path.includes(NOTIFICATION_ROUTES.PRICE_ALERTS)) mixpanelHandler(MIXPANEL_TYPE.PA_CLICK_TAB_IN_NOTI_CENTER)
  }

  return (
    <Link to={path} onClick={trackingPriceAlertTab}>
      <Wrapper $active={isActive} $mobile={isMobile}>
        <Flex
          sx={{
            flex: '1 1 0',
            alignItems: 'center',
            color: isActive ? theme.primary : theme.subText,
            gap: '8px',
          }}
        >
          <IconWrapper>{icon}</IconWrapper>
          <Label>{text}</Label>
        </Flex>

        {unread ? <Badge>{formatNumberOfUnread(unread)}</Badge> : null}
      </Wrapper>
    </Link>
  )
}

export default MenuItem
