import { t, Trans } from '@lingui/macro'
import styled, { icon, Theme, ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { transparentize } from 'polished'
import { ChevronDown } from 'react-feather'

import Button from '../Button'
import Row from '../Row'

const StyledTokenButton = styled(Button)<{ empty?: boolean; theme: Theme }>`
  background-color: ${({ empty, theme }) => (empty ? theme.accent : theme.interactive)};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
  padding-left: ${({ empty }) => (empty ? 0.75 : 0.25)}em;

  :hover {
    background-color: ${({ empty, theme }) => transparentize(0.3, empty ? theme.accent : theme.interactive)};
    opacity: 1;
  }
`

const TokenButtonRow = styled(Row)`
  height: 1.2em;
`

const TokenImg = styled.img<{ disabled?: boolean }>`
  border-radius: 100%;
  filter: ${({ disabled }) => disabled && 'saturate(0) opacity(0.6)'};
  height: 1.2em;
  width: 1.2em;
`

const ChevronDownIcon = styled(icon(ChevronDown, { color: 'onInteractive' }))`
  stroke-width: 3;
`

interface TokenOptionProps {
  value?: Token
  disabled?: boolean
  onClick: () => void
}

export default function TokenButton({ value, disabled, onClick }: TokenOptionProps) {
  return (
    <StyledTokenButton onClick={onClick} empty={!value}>
      <ThemedText.ButtonLarge color="onInteractive">
        <TokenButtonRow gap={0.4}>
          {value ? (
            <>
              <TokenImg src={value.logoURI} alt={t`${value.name || value.symbol} logo`} disabled={disabled} />
              {value.symbol}
            </>
          ) : (
            <Trans>Select a token</Trans>
          )}
          <ChevronDownIcon />
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
