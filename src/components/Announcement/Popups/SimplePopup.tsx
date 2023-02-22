import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import WarningIcon from 'components/Icons/WarningIcon'
import { AutoRow } from 'components/Row'
import useTheme from 'hooks/useTheme'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function SimplePopup({
  title,
  summary,
  type = NotificationType.ERROR,
  icon,
  link,
}: {
  title: string
  type?: NotificationType
  summary?: ReactNode
  icon?: ReactNode
  link?: string
}) {
  const theme = useTheme()
  const mapColor = {
    [NotificationType.SUCCESS]: theme.primary,
    [NotificationType.WARNING]: theme.warning,
    [NotificationType.ERROR]: theme.red,
  }
  const color = mapColor[type]
  const mapIcon = {
    [NotificationType.SUCCESS]: <CheckCircle color={color} size={'20px'} />,
    [NotificationType.WARNING]: <WarningIcon solid color={color} />,
    [NotificationType.ERROR]: <IconFailure color={color} />,
  }

  const navigate = useNavigate()
  const onClickLink = () => {
    link && navigate(link)
  }
  return (
    <RowNoFlex>
      <div style={{ paddingRight: 10 }}>{icon || mapIcon[type]}</div>
      <AutoColumn gap="8px">
        <Text fontSize="16px" fontWeight={500} color={color}>
          {title}
        </Text>
        {summary && (
          <Text fontSize="14px" fontWeight={400} color={theme.text}>
            {summary}
          </Text>
        )}
        {link && (
          <Text style={{ color, fontSize: 14, fontWeight: '500', cursor: 'pointer' }} onClick={onClickLink}>
            <Trans>See here</Trans>
          </Text>
        )}
      </AutoColumn>
    </RowNoFlex>
  )
}
