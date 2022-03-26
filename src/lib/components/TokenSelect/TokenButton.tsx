import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ChevronDown } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'

import Button from '../Button'
import Row from '../Row'
import TokenImg from '../TokenImg'

const StyledTokenButton = styled(Button)<{ empty?: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
  padding-left: ${({ empty }) => (empty ? 0.75 : 0.25)}em;

  :disabled {
    // prevents border from expanding the button's box size
    padding: calc(0.25em - 1px);
    padding-left: calc(${({ empty }) => (empty ? 0.75 : 0.25)}em - 1px);
  }
`

const TokenButtonRow = styled(Row)<{ collapsed: boolean }>`
  height: 1.2em;
  // max-width must have an absolute value in order to transition.
  max-width: ${({ collapsed }) => (collapsed ? '1.2em' : '12em')};
  overflow: hidden;
  transition: max-width 0.25s linear;

  img {
    min-width: 1.2em;
  }
`

interface TokenButtonProps {
  value?: Currency
  collapsed: boolean
  disabled?: boolean
  onClick: () => void
}

export default function TokenButton({ value, collapsed, disabled, onClick }: TokenButtonProps) {
  const buttonBackgroundColor = useMemo(() => (value ? 'interactive' : 'accent'), [value])
  const contentColor = useMemo(() => (value || disabled ? 'onInteractive' : 'onAccent'), [value, disabled])
  return (
    <StyledTokenButton onClick={onClick} empty={!value} color={buttonBackgroundColor} disabled={disabled}>
      <ThemedText.ButtonLarge color={contentColor}>
        <TokenButtonRow gap={0.4} collapsed={Boolean(value) && collapsed}>
          {value ? (
            <>
              <TokenImg token={value} size={1.2} />
              {value.symbol}
            </>
          ) : (
            <Trans>Select a token</Trans>
          )}
          <ChevronDown color={contentColor} strokeWidth={3} />
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
