import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React from 'react'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'

type WrapperProps = {
  $variant: 'normal' | 'warning' | 'fatal'
}
const Wrapper = styled(AutoColumn).attrs<WrapperProps>(props => ({
  'data-variant': props.$variant,
}))<WrapperProps>`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
  color: ${({ theme }) => theme.primary};
  padding: 0.5rem;
  border-radius: 12px;

  &[data-variant='warning'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.warning)};
    color: ${({ theme }) => theme.warning};

    ${ButtonPrimary} {
      background-color: ${({ theme }) => theme.warning};
    }
  }

  &[data-variant='fatal'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.red)};
    color: ${({ theme }) => theme.red};

    ${ButtonPrimary} {
      background-color: ${({ theme }) => theme.red};
    }
  }
`

type Props = {
  level: number
  onAcceptChange: () => void
}
const AcceptChangesNotice: React.FC<Props> = ({ level, onAcceptChange }) => {
  const variant = level === 0 ? 'normal' : level === 1 ? 'warning' : 'fatal'
  return (
    <Wrapper justify="flex-start" gap={'0px'} $variant={variant}>
      <RowBetween>
        <RowFixed>
          <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
          <Text as="span" fontWeight={'500'}>
            <Trans>Price Updated</Trans>
          </Text>
        </RowFixed>
        <ButtonPrimary
          style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
          onClick={onAcceptChange}
        >
          <Trans>Accept</Trans>
        </ButtonPrimary>
      </RowBetween>
    </Wrapper>
  )
}

export default AcceptChangesNotice
