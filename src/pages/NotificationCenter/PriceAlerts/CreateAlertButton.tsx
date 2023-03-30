import { Trans } from '@lingui/macro'
import { Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

type Props = {
  className?: string
}
const CreateAlertButton: React.FC<Props> = ({ className }) => {
  const navigate = useNavigate()

  return (
    <ButtonPrimary
      className={className}
      style={{
        padding: '0 8px 0 6px',
        gap: '4px',
        flex: '0 0 fit-content',
        height: '36px',
      }}
      onClick={() => {
        navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}`)
      }}
    >
      <Plus size={16} />
      <Trans>Create Alert</Trans>
    </ButtonPrimary>
  )
}

export default styled(CreateAlertButton)``
