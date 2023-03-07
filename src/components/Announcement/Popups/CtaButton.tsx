import { t } from '@lingui/macro'
import { MouseEventHandler } from 'react'
import styled from 'styled-components'

import { AnnouncementCTA } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'

function CtaButton({
  data,
  className = '',
  color,
  onClick,
}: {
  data: AnnouncementCTA
  className?: string
  color: 'primary' | 'gray' | 'outline'
  onClick?: MouseEventHandler<HTMLButtonElement>
}) {
  const theme = useTheme()
  if (!data) return null
  const { name } = data
  const props = { className, onClick }
  const displayName = name || t`Close`
  switch (color) {
    case 'primary':
      return <ButtonPrimary {...props}>{displayName}</ButtonPrimary>
    case 'outline':
      return <ButtonOutlined {...props}>{displayName}</ButtonOutlined>
    default:
      return (
        <ButtonEmpty
          {...props}
          style={{
            background: theme.border,
            color: theme.text,
          }}
        >
          {displayName}
        </ButtonEmpty>
      )
  }
}
export default styled(CtaButton)``
