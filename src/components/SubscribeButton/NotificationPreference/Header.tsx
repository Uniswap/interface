import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import MailIcon from 'components/Icons/MailIcon'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const CloseIcon = styled(X)`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
`
export default function Header({ toggleModal }: { toggleModal: () => void }) {
  const navigate = useNavigate()
  return (
    <RowBetween>
      <Row fontSize={20} fontWeight={500} gap="10px">
        <MailIcon /> <Trans>Email Notifications</Trans>
      </Row>
      <MouseoverTooltip text={t`Notification Preferences`} placement="top" width="fit-content">
        <TransactionSettingsIcon
          size={24}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.OVERVIEW}`)
            toggleModal()
          }}
        />
      </MouseoverTooltip>
      <CloseIcon onClick={toggleModal} style={{ marginLeft: 16 }} />
    </RowBetween>
  )
}
