import { t } from '@lingui/macro'
import styled from 'styled-components'

import { AnnouncementCTA } from 'components/Announcement/type'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import useTheme from 'hooks/useTheme'

function CtaButton({
  data,
  className = '',
  color,
  onClick,
}: {
  data: AnnouncementCTA
  className?: string
  color: 'primary' | 'gray'
  onClick?: () => void
}) {
  const theme = useTheme()
  if (!data) return null
  const { name } = data
  const props = { className, onClick }
  const displayName = name || t`Close`
  if (color === 'primary') return <ButtonPrimary {...props}>{displayName}</ButtonPrimary>
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
export default styled(CtaButton)``
