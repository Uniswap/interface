import { t } from '@lingui/macro'
import axios from 'axios'
import { stringify } from 'querystring'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import MailIcon from 'components/Icons/MailIcon'
import { NOTIFICATION_API } from 'constants/env'
import useNotification from 'hooks/useNotification'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'

// this component to verify email/telegram
function VerifyComponent() {
  const qs = useParsedQueryString()
  const notify = useNotify()
  const calledApi = useRef(false)
  const { showNotificationModal } = useNotification()
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    if (!qs?.confirmation || calledApi.current) return
    calledApi.current = true
    axios
      .get(`${NOTIFICATION_API}/v1/topics/verify`, {
        params: { confirmation: qs.confirmation },
      })
      .then(() => {
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Subscription Successful`,
            summary: t`You have successfully subscribed with the email address ${qs.email}`,
            icon: <MailIcon color={theme.primary} />,
          },
          10000,
        )
        setTimeout(() => {
          showNotificationModal()
        }, 1000)
        const { confirmation, email, ...rest } = qs
        navigate({ search: stringify(rest) })
      })
      .catch(e => {
        const code = e?.response?.data?.code
        console.error(e)
        const isExpired = code === '4001' || code === '4090'
        notify({
          type: NotificationType.ERROR,
          title: t`Subscription Error`,
          icon: <MailIcon color={theme.red} />,
          summary: isExpired
            ? t`This verification link has expired. Please return to your inbox to verify with the latest verification link.`
            : t`Error occur, please try again.`,
        })
      })
  }, [qs, notify, navigate, showNotificationModal, theme])

  return null
}
export default VerifyComponent
