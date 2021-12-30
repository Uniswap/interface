import { Trans } from '@lingui/macro'
import { ChevronDown } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'

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
  max-width: ${({ collapsed }) => (collapsed ? '1.2' : '8.2')}em;
  overflow-x: hidden;
  transition: max-width 0.25s linear;
`

interface TokenButtonProps {
  value?: Token
  collapsed: boolean
  disabled?: boolean
  onClick: () => void
}

export default function TokenButton({ value, collapsed, disabled, onClick }: TokenButtonProps) {
  return (
    <StyledTokenButton onClick={onClick} empty={!value} color={value ? 'interactive' : 'accent'} disabled={disabled}>
      <ThemedText.ButtonLarge color="onInteractive">
        <TokenButtonRow gap={0.4} collapsed={Boolean(value) && collapsed}>
          {value ? (
            <>
              <TokenImg token={value} size={1.2} />
              {value.symbol}
            </>
          ) : (
            <Trans>Select a token</Trans>
          )}
          <ChevronDown color="onInteractive" strokeWidth={3} />
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
