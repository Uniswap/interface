import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React from 'react'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'

const BadgeWrapper = styled(AutoColumn).attrs<Props>(props => ({
  'data-level': props.$level,
}))<Props>`
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 4px 8px;
  border-radius: 36px;

  line-height: 1;
  font-size: 12px;
  font-weight: 500;

  &[data-level='worse'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.subText)};
    color: ${({ theme }) => theme.subText};
  }

  &[data-level='better'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
    color: ${({ theme }) => theme.primary};
  }
`

export type Props = {
  $level: 'better' | 'worse' | undefined
}
const UpdatedBadge: React.FC<Props> = ({ $level }) => {
  const theme = useTheme()

  if (!$level) {
    return null
  }

  return (
    <BadgeWrapper $level={$level}>
      {$level === 'better' && (
        <InfoHelper
          placement="top"
          size={14}
          color={theme.primary}
          style={{
            marginLeft: 0,
          }}
          width="fit-content"
          text={
            <Trans>
              <i>We got you better price!</i>
            </Trans>
          }
        />
      )}
      <Trans>Updated</Trans>
    </BadgeWrapper>
  )
}

export default UpdatedBadge
